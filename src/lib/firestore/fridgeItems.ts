import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export const QUANTITY_TYPES = ["g", "kg", "mL", "L", "unit"] as const;
export type QuantityType = (typeof QUANTITY_TYPES)[number];

export type FridgeItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  quantityType: QuantityType;
  expirationDate: string;
  calories: number;
  imageUrl: string;
  imageSerialized?: string;
  tags: string[];
  ownerId: string;
  createdAt?: Date | null;
};

type NewFridgeItem = Omit<FridgeItem, "id" | "ownerId" | "createdAt">;

const fridgeCollection = collection(db, "fridgeItems");

export function subscribeToFridgeItems(
  ownerId: string,
  onChange: (items: FridgeItem[]) => void
) {
  const fridgeQuery = query(fridgeCollection, where("ownerId", "==", ownerId));

  return onSnapshot(fridgeQuery, (snapshot) => {
    const items = snapshot.docs.map((itemDoc) => {
      const data = itemDoc.data();
      const quantityType = QUANTITY_TYPES.includes(data.quantityType)
        ? data.quantityType
        : "unit";

      return {
        id: itemDoc.id,
        name: String(data.name ?? ""),
        description: String(data.description ?? ""),
        quantity: Number(data.quantity ?? 0),
        quantityType,
        expirationDate: String(data.expirationDate ?? ""),
        calories: Number(data.calories ?? 0),
        imageUrl: String(data.imageUrl ?? ""),
        imageSerialized:
          typeof data.imageSerialized === "string" ? data.imageSerialized : "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        ownerId: data.ownerId ?? ownerId,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    });

    items.sort((a, b) => {
      const aTime = a.createdAt?.getTime?.() ?? 0;
      const bTime = b.createdAt?.getTime?.() ?? 0;
      return bTime - aTime;
    });

    onChange(items);
  });
}

export async function addFridgeItem(ownerId: string, data: NewFridgeItem) {
  await addDoc(fridgeCollection, {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),
  });
}

export async function deleteFridgeItem(itemId: string) {
  await deleteDoc(doc(db, "fridgeItems", itemId));
}
