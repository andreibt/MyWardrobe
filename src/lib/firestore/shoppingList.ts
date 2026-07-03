import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../firebase";
import type { QuantityType } from "./fridgeItems";

export type ShoppingListItemSource = "fridge" | "fridgeHistory" | "plain";

export type ShoppingListItem = {
  id: string;
  source: ShoppingListItemSource;
  fridgeItemId?: string;
  name: string;
  count: number;
  quantity?: number;
  quantityType?: QuantityType;
  checked: boolean;
  createdAt: number;
};

export type ShoppingList = {
  id: string;
  ownerId: string;
  items: ShoppingListItem[];
};

export type ShoppingListItemInput = Omit<ShoppingListItem, "id" | "checked" | "createdAt"> & {
  id?: string;
  checked?: boolean;
};

const shoppingListDoc = (ownerId: string) => doc(db, "shoppingLists", ownerId);

const createItemId = (item: ShoppingListItemInput) => {
  if (item.id) {
    return item.id;
  }
  if (item.fridgeItemId) {
    return `${item.source}:${item.fridgeItemId}`;
  }
  return `plain:${item.name.trim().toLowerCase()}`;
};

const sanitizeItem = (item: Partial<ShoppingListItem>): ShoppingListItem => ({
  id: String(item.id ?? ""),
  source:
    item.source === "fridge" || item.source === "fridgeHistory" || item.source === "plain"
      ? item.source
      : "plain",
  fridgeItemId: typeof item.fridgeItemId === "string" ? item.fridgeItemId : undefined,
  name: String(item.name ?? ""),
  count: Math.max(1, Number(item.count ?? 1)),
  quantity:
    typeof item.quantity === "number" && Number.isFinite(item.quantity)
      ? item.quantity
      : undefined,
  quantityType: item.quantityType,
  checked: item.checked === true,
  createdAt: Number(item.createdAt ?? Date.now()),
});

const sanitizeItems = (items: unknown): ShoppingListItem[] =>
  Array.isArray(items)
    ? items
        .map((item) => sanitizeItem(item as Partial<ShoppingListItem>))
        .filter((item) => item.id && item.name.trim())
    : [];

const serializeItem = (item: ShoppingListItem) => ({
  id: item.id,
  source: item.source,
  ...(item.fridgeItemId ? { fridgeItemId: item.fridgeItemId } : {}),
  name: item.name,
  count: item.count,
  ...(typeof item.quantity === "number" ? { quantity: item.quantity } : {}),
  ...(item.quantityType ? { quantityType: item.quantityType } : {}),
  checked: item.checked,
  createdAt: item.createdAt,
});

export function subscribeToShoppingList(
  ownerId: string,
  onChange: (list: ShoppingList) => void
) {
  return onSnapshot(shoppingListDoc(ownerId), (snapshot) => {
    const data = snapshot.data();
    const items = sanitizeItems(data?.items).sort((a, b) => a.createdAt - b.createdAt);
    onChange({
      id: snapshot.id,
      ownerId,
      items,
    });
  });
}

export async function saveShoppingListItems(ownerId: string, items: ShoppingListItem[]) {
  await setDoc(
    shoppingListDoc(ownerId),
    {
      ownerId,
      items: items.map(sanitizeItem).map(serializeItem),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function addShoppingListItems(ownerId: string, inputs: ShoppingListItemInput[]) {
  const ref = shoppingListDoc(ownerId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const existingItems = sanitizeItems(snapshot.data()?.items);
    const itemMap = new Map(existingItems.map((item) => [item.id, item]));

    inputs.forEach((input) => {
      const id = createItemId(input);
      const existing = itemMap.get(id);
      if (existing) {
        itemMap.set(id, {
          ...existing,
          count: existing.count + Math.max(1, Number(input.count ?? 1)),
          checked: false,
        });
        return;
      }
      itemMap.set(
        id,
        sanitizeItem({
          ...input,
          id,
          checked: input.checked ?? false,
          createdAt: Date.now(),
        })
      );
    });

    transaction.set(
      ref,
      {
        ownerId,
        items: Array.from(itemMap.values()).map(serializeItem),
        updatedAt: serverTimestamp(),
        createdAt: snapshot.exists() ? snapshot.data()?.createdAt : serverTimestamp(),
      },
      { merge: true }
    );
  });
}
