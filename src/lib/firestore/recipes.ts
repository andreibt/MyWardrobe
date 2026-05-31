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

export type RecipeIngredient = {
  fridgeItemId: string;
  name: string;
  quantity: number;
  quantityType: QuantityType;
  description: string;
  calories: number;
  isHistory: boolean;
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
          ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
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
    ownerId,
    createdAt: serverTimestamp(),
  });
}

export async function updateRecipe(recipeId: string, data: UpdateRecipe) {
  await updateDoc(doc(db, "recipes", recipeId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}
