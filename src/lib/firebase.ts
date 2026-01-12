import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";
import * as firebaseAuth from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyBeO6ZDVcS5PRzXic4mfbCJkqPB1s0dBFc",
  authDomain: "mywardrobe-181c3.firebaseapp.com",
  projectId: "mywardrobe-181c3",
  storageBucket: "mywardrobe-181c3.firebasestorage.app",
  messagingSenderId: "625710587746",
  appId: "1:625710587746:web:a9abf31f9db89e7886d63b",
  measurementId: "G-X6E9E39M0R",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);


if (Platform.OS !== "web") {
  try {
    initializeAuth(app, {
      persistence: (firebaseAuth as any).getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // ignore re-init during fast refresh
  }
}

export const auth = getAuth(app);
export const db = getFirestore(app);
