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
import type { Recipe, RecipeIngredient } from "./recipes";

export type CocktailRecipe = Recipe;
type NewCocktailRecipe = Omit<CocktailRecipe, "id" | "ownerId">;
type UpdateCocktailRecipe = Partial<NewCocktailRecipe>;

const cocktailRecipesCollection = collection(db, "cocktailRecipes");

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

export function subscribeToCocktailRecipes(
  ownerId: string,
  onChange: (recipes: CocktailRecipe[]) => void
) {
  const recipesQuery = query(cocktailRecipesCollection, where("ownerId", "==", ownerId));

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

export async function addCocktailRecipe(ownerId: string, data: NewCocktailRecipe) {
  await addDoc(cocktailRecipesCollection, {
    ...data,
    ingredients: sanitizeIngredients(data.ingredients),
    ownerId,
    createdAt: serverTimestamp(),
  });
}

export async function updateCocktailRecipe(recipeId: string, data: UpdateCocktailRecipe) {
  await updateDoc(doc(db, "cocktailRecipes", recipeId), {
    ...data,
    ...(data.ingredients ? { ingredients: sanitizeIngredients(data.ingredients) } : {}),
    updatedAt: serverTimestamp(),
  });
}
