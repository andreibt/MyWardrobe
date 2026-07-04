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
import { QUANTITY_TYPES, type QuantityType } from "./fridgeItems";

export type InventoryKind = "pantry" | "cocktails";

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  quantityType: QuantityType;
  expirationDate: string;
  calories?: number;
  imageUrl: string;
  imageSerialized?: string;
  tags: string[];
  isHistory: boolean;
  ownerId: string;
  createdAt?: Date | null;
};

export type NewInventoryItem = Omit<InventoryItem, "id" | "ownerId" | "createdAt" | "isHistory">;
export type UpdateInventoryItem = Partial<NewInventoryItem>;

const collectionNameByKind: Record<InventoryKind, string> = {
  pantry: "pantryItems",
  cocktails: "cocktailItems",
};

const inventoryCollection = (kind: InventoryKind) => collection(db, collectionNameByKind[kind]);
const inventoryDoc = (kind: InventoryKind, itemId: string) =>
  doc(db, collectionNameByKind[kind], itemId);

export function subscribeToInventoryItems(
  kind: InventoryKind,
  ownerId: string,
  onChange: (items: InventoryItem[]) => void
) {
  const inventoryQuery = query(inventoryCollection(kind), where("ownerId", "==", ownerId));

  return onSnapshot(inventoryQuery, (snapshot) => {
    const items = snapshot.docs.map((itemDoc) => {
      const data = itemDoc.data();
      const quantityType = QUANTITY_TYPES.includes(data.quantityType) ? data.quantityType : "unit";
      const item: InventoryItem = {
        id: itemDoc.id,
        name: String(data.name ?? ""),
        description: String(data.description ?? ""),
        quantity: Number(data.quantity ?? 0),
        quantityType,
        expirationDate: String(data.expirationDate ?? ""),
        imageUrl: String(data.imageUrl ?? ""),
        imageSerialized: typeof data.imageSerialized === "string" ? data.imageSerialized : "",
        tags: Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === "string") : [],
        isHistory: data.isHistory === true,
        ownerId: data.ownerId ?? ownerId,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };

      if (kind === "cocktails") {
        item.calories = Number(data.calories ?? 0);
      }

      return item;
    });

    items.sort((a, b) => {
      const aTime = a.createdAt?.getTime?.() ?? 0;
      const bTime = b.createdAt?.getTime?.() ?? 0;
      return bTime - aTime;
    });

    onChange(items);
  });
}

export async function addInventoryItem(
  kind: InventoryKind,
  ownerId: string,
  data: NewInventoryItem
) {
  const payload = kind === "pantry" ? withoutCalories(data) : data;
  await addDoc(inventoryCollection(kind), {
    ...payload,
    ownerId,
    isHistory: false,
    createdAt: serverTimestamp(),
  });
}

export async function updateInventoryItem(
  kind: InventoryKind,
  itemId: string,
  data: UpdateInventoryItem
) {
  const payload = kind === "pantry" ? withoutCalories(data) : data;
  await updateDoc(inventoryDoc(kind, itemId), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveInventoryItem(kind: InventoryKind, itemId: string) {
  await updateDoc(inventoryDoc(kind, itemId), {
    isHistory: true,
    expirationDate: "",
    updatedAt: serverTimestamp(),
  });
}

export async function restoreInventoryItem(
  kind: InventoryKind,
  itemId: string,
  expirationDate: string
) {
  await updateDoc(inventoryDoc(kind, itemId), {
    isHistory: false,
    expirationDate,
    updatedAt: serverTimestamp(),
  });
}

const withoutCalories = <T extends { calories?: number }>(value: T) => {
  const { calories: _calories, ...rest } = value;
  return rest;
};

export const subscribeToPantryItems = (ownerId: string, onChange: (items: InventoryItem[]) => void) =>
  subscribeToInventoryItems("pantry", ownerId, onChange);

export const subscribeToCocktailItems = (ownerId: string, onChange: (items: InventoryItem[]) => void) =>
  subscribeToInventoryItems("cocktails", ownerId, onChange);
