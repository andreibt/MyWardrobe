import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";
import type { QuantityType } from "./fridgeItems";

type RecipeIngredientItem = {
  id: string;
  name: string;
  description: string;
  quantityType: QuantityType;
  calories?: number;
  imageUrl: string;
  imageSerialized?: string;
};

export type RecipeIngredient = {
  fridgeItemId: string;
  name: string;
  quantity: number;
  quantityType: QuantityType;
  description: string;
  calories: number;
  imageUrl?: string;
  imageSerialized?: string;
};

export type Recipe = {
  id: string;
  name: string;
  instructions: string;
  calories: number;
  portions: number;
  ingredients: RecipeIngredient[];
  ownerId: string;
};

type NewRecipe = Omit<Recipe, "id" | "ownerId">;
type UpdateRecipe = Partial<NewRecipe>;

const recipesCollection = collection(db, "recipes");
const sanitizeIngredients = (ingredients: RecipeIngredient[]) =>
  ingredients.map(({ fridgeItemId, name, quantity, quantityType, description, calories, imageUrl, imageSerialized }) => ({
    fridgeItemId,
    name,
    quantity,
    quantityType,
    description,
    calories,
    ...(imageUrl ? { imageUrl } : {}),
    ...(imageSerialized ? { imageSerialized } : {}),
  }));

export const hydrateRecipeIngredients = (
  ingredients: RecipeIngredient[],
  items: RecipeIngredientItem[]
) => {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return ingredients.map((ingredient) => {
    const item = itemsById.get(ingredient.fridgeItemId);

    if (!item) {
      return ingredient;
    }

    return {
      ...ingredient,
      name: item.name,
      quantityType: item.quantityType,
      description: item.description,
      calories: item.calories ?? 0,
      imageUrl: item.imageUrl,
      imageSerialized: item.imageSerialized,
    };
  });
};

export function subscribeToRecipes(ownerId: string, onChange: (recipes: Recipe[]) => void) {
  const recipesQuery = query(recipesCollection, where("ownerId", "==", ownerId));

  return onSnapshot(recipesQuery, (snapshot) => {
    const recipes = snapshot.docs
      .map((recipeDoc) => {
        const data = recipeDoc.data();
        return {
          id: recipeDoc.id,
          name: String(data.name ?? ""),
          instructions: String(data.instructions ?? ""),
          calories: Number(data.calories ?? 0),
          portions: Number(data.portions ?? 0),
          ingredients: Array.isArray(data.ingredients)
            ? sanitizeIngredients(data.ingredients)
            : [],
          ownerId: data.ownerId ?? ownerId,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    onChange(recipes);
  });
}

export async function addRecipe(ownerId: string, data: NewRecipe) {
  await addDoc(recipesCollection, {
    ...data,
    ingredients: sanitizeIngredients(data.ingredients),
    ownerId,
    createdAt: serverTimestamp(),
  });
}

export async function updateRecipe(recipeId: string, data: UpdateRecipe) {
  await updateDoc(doc(db, "recipes", recipeId), {
    ...data,
    ...(data.ingredients ? { ingredients: sanitizeIngredients(data.ingredients) } : {}),
    updatedAt: serverTimestamp(),
  });
}
