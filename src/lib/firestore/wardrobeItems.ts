import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export type WardrobeItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  color: string;
  ownerId: string;
  createdAt?: Date | null;
};

type NewWardrobeItem = Omit<WardrobeItem, "id" | "ownerId" | "createdAt">;

const wardrobeCollection = collection(db, "wardrobeItems");

export function subscribeToWardrobeItems(
  ownerId: string,
  onChange: (items: WardrobeItem[]) => void
) {
  const wardrobeQuery = query(wardrobeCollection, where("ownerId", "==", ownerId));

  return onSnapshot(wardrobeQuery, (snapshot) => {
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        title: data.title ?? "",
        description: data.description ?? "",
        imageUrl: data.imageUrl ?? "",
        color: data.color ?? "",
        ownerId: data.ownerId ?? ownerId,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    });

    const sorted = items.sort((a, b) => {
      const aTime = a.createdAt?.getTime?.() ?? 0;
      const bTime = b.createdAt?.getTime?.() ?? 0;

      return bTime - aTime;
    });

    onChange(sorted);
  });
}

export async function addWardrobeItem(ownerId: string, data: NewWardrobeItem) {
  await addDoc(wardrobeCollection, {
    ...data,
    ownerId,
    createdAt: serverTimestamp(),
  });
}
