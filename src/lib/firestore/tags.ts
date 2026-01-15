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

export type WardrobeTag = {
  id: string;
  name: string;
  ownerId: string;
  createdAt?: Date | null;
};

const tagsCollection = collection(db, "wardrobeTags");

export function subscribeToTags(ownerId: string, onChange: (tags: WardrobeTag[]) => void) {
  const tagsQuery = query(tagsCollection, where("ownerId", "==", ownerId));

  return onSnapshot(tagsQuery, (snapshot) => {
    const tags = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        name: String(data.name ?? ""),
        ownerId: data.ownerId ?? ownerId,
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    });

    const sorted = tags
      .filter((tag) => tag.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    onChange(sorted);
  });
}

export async function addTag(ownerId: string, name: string) {
  await addDoc(tagsCollection, {
    name,
    ownerId,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTag(tagId: string) {
  const tagRef = doc(db, "wardrobeTags", tagId);
  await deleteDoc(tagRef);
}
