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

export type TryOnConfig = {
  id: string;
  ownerId: string;
  name: string;
  createdAt?: Date | null;
};

const configsCollection = collection(db, "tryOnConfigs");

export function subscribeToTryOnConfigs(
  ownerId: string,
  onChange: (configs: TryOnConfig[]) => void
) {
  const configsQuery = query(configsCollection, where("ownerId", "==", ownerId));

  return onSnapshot(configsQuery, (snapshot) => {
    const configs = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        ownerId: data.ownerId ?? ownerId,
        name: String(data.name ?? ""),
        createdAt: data.createdAt?.toDate?.() ?? null,
      };
    });

    const sorted = configs
      .filter((config) => config.name.trim().length > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    onChange(sorted);
  });
}

export async function addTryOnConfig(ownerId: string, name: string) {
  await addDoc(configsCollection, {
    ownerId,
    name,
    createdAt: serverTimestamp(),
  });
}

export async function deleteTryOnConfig(configId: string) {
  const configRef = doc(db, "tryOnConfigs", configId);
  await deleteDoc(configRef);
}
