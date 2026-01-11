import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export const auth = getAuth(app);
export const db = getFirestore(app);
