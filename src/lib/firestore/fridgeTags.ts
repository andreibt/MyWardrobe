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

export type FridgeTag = {
  id: string;
  name: string;
  ownerId: string;
};

const fridgeTagsCollection = collection(db, "fridgeTags");

export function subscribeToFridgeTags(
  ownerId: string,
  onChange: (tags: FridgeTag[]) => void
) {
  const tagsQuery = query(fridgeTagsCollection, where("ownerId", "==", ownerId));

  return onSnapshot(tagsQuery, (snapshot) => {
    const tags = snapshot.docs
      .map((tagDoc) => {
        const data = tagDoc.data();
        return {
          id: tagDoc.id,
          name: String(data.name ?? ""),
          ownerId: data.ownerId ?? ownerId,
        };
      })
      .filter((tag) => tag.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    onChange(tags);
  });
}

export async function addFridgeTag(ownerId: string, name: string) {
  await addDoc(fridgeTagsCollection, {
    ownerId,
    name,
    createdAt: serverTimestamp(),
  });
}

export async function deleteFridgeTag(tagId: string) {
  await deleteDoc(doc(db, "fridgeTags", tagId));
}
