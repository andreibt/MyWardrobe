import { collection, deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../firebase";

export type PushTokenType = "fcm" | "apns";
export type PushTokenPlatform = "android" | "ios";

const pushTokenCollection = collection(db, "pushTokens");

export async function savePushToken(
  ownerId: string,
  token: string,
  platform: PushTokenPlatform,
  type: PushTokenType
) {
  const tokenRef = doc(pushTokenCollection, token);
  await setDoc(
    tokenRef,
    {
      ownerId,
      token,
      platform,
      type,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function deletePushToken(token: string) {
  const tokenRef = doc(pushTokenCollection, token);
  await deleteDoc(tokenRef);
}
