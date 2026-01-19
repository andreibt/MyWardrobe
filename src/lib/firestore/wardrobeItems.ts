import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../firebase";

export type WardrobeItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  imageSerialized?: string;
  color: string;
  tags: string[];
  ownerId: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

type NewWardrobeItem = Omit<WardrobeItem, "id" | "ownerId" | "createdAt">;
type UpdateWardrobeItem = Partial<NewWardrobeItem>;

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
        imageSerialized: typeof data.imageSerialized === "string" ? data.imageSerialized : "",
        color: data.color ?? "",
        tags: Array.isArray(data.tags) ? data.tags : [],
        ownerId: data.ownerId ?? ownerId,
        createdAt: data.createdAt?.toDate?.() ?? null,
        updatedAt: data.updatedAt?.toDate?.() ?? null,
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

export async function updateWardrobeItem(itemId: string, data: UpdateWardrobeItem) {
  const itemRef = doc(db, "wardrobeItems", itemId);
  await updateDoc(itemRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteWardrobeItem(itemId: string) {
  const itemRef = doc(db, "wardrobeItems", itemId);
  await deleteDoc(itemRef);
}
