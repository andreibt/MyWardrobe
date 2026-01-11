import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from "firebase/auth";

import { auth } from "./firebase";

export type AuthUser = {
  id: string;
  email: string | null;
};

const toAuthUser = (user: User | null): AuthUser | null => {
  if (!user) {
    return null;
  }

  return {
    id: user.uid,
    email: user.email,
  };
};

export function subscribeToAuthChanges(onChange: (user: AuthUser | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    onChange(toAuthUser(user));
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}
