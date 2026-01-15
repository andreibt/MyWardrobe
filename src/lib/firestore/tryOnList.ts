import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  limit,
} from "firebase/firestore";

import { db } from "../firebase";
import type { WardrobeItem } from "./wardrobeItems";

export type TryOnItem = {
  id: string;
  ownerId: string;
  wardrobeItemId: string;
  title: string;
  imageUrl: string;
  color: string;
  configuration: string | null;
  layer: "top" | "middle" | "bottom";
  order: number;
  createdAt?: Date | null;
};

const tryOnCollection = collection(db, "tryOnItems");

export function subscribeToTryOnItems(
  ownerId: string,
  onChange: (items: TryOnItem[]) => void,
  configuration?: string | null
) {
  const filters = [where("ownerId", "==", ownerId)];
  if (configuration !== undefined) {
    filters.push(where("configuration", "==", configuration));
  }
  const tryOnQuery = query(tryOnCollection, ...filters);

  return onSnapshot(tryOnQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      const rawLayer = String(data.layer ?? "middle");
      const layer =
        rawLayer === "top" || rawLayer === "middle" || rawLayer === "bottom"
          ? rawLayer
          : "middle";

      return {
        id: doc.id,
        ownerId: data.ownerId ?? ownerId,
        wardrobeItemId: data.wardrobeItemId ?? "",
        title: String(data.title ?? ""),
        imageUrl: String(data.imageUrl ?? ""),
        color: String(data.color ?? ""),
        configuration: typeof data.configuration === "string" ? data.configuration : null,
        layer,
        order: typeof data.order === "number" ? data.order : 0,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    });

    const layerRank: Record<TryOnItem["layer"], number> = {
      top: 0,
      middle: 1,
      bottom: 2,
    };

    const sorted = items.sort((a, b) => {
      const layerDiff = layerRank[a.layer] - layerRank[b.layer];
      if (layerDiff !== 0) {
        return layerDiff;
      }
      return a.order - b.order;
    });

    onChange(sorted);
  });
}

export async function addTryOnItem(
  ownerId: string,
  item: WardrobeItem,
  configuration: string | null
) {
  const existingQuery = query(
    tryOnCollection,
    where("ownerId", "==", ownerId),
    where("wardrobeItemId", "==", item.id),
    where("configuration", "==", configuration),
    limit(1)
  );
  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    return;
  }

  await addDoc(tryOnCollection, {
    ownerId,
    wardrobeItemId: item.id,
    title: item.title ?? "",
    imageUrl: item.imageUrl ?? "",
    color: item.color ?? "",
    configuration,
    layer: "middle",
    order: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export async function updateTryOnOrder(items: TryOnItem[]) {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    const docRef = doc(db, "tryOnItems", item.id);
    batch.update(docRef, {
      order: index,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function updateTryOnLayer(itemId: string, layer: TryOnItem["layer"], order: number) {
  const itemRef = doc(db, "tryOnItems", itemId);
  await updateDoc(itemRef, {
    layer,
    order,
    updatedAt: serverTimestamp(),
  });
}

export async function updateTryOnConfiguration(items: TryOnItem[], configuration: string) {
  const batch = writeBatch(db);
  items.forEach((item, index) => {
    const docRef = doc(db, "tryOnItems", item.id);
    batch.update(docRef, {
      configuration,
      order: index,
      updatedAt: serverTimestamp(),
    });
  });
  await batch.commit();
}

export async function deleteTryOnItemsByConfiguration(
  ownerId: string,
  configuration: string
) {
  const itemsQuery = query(
    tryOnCollection,
    where("ownerId", "==", ownerId),
    where("configuration", "==", configuration)
  );
  const snapshot = await getDocs(itemsQuery);
  if (snapshot.empty) {
    return;
  }
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

export async function deleteTryOnItem(itemId: string) {
  const itemRef = doc(db, "tryOnItems", itemId);
  await deleteDoc(itemRef);
}
