// src/services/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export async function signUp(email: string, password: string, name?: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (name && name.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    name: name?.trim() || null,
    createdAt: new Date().toISOString(),
  });

  return userCredential;
}

export async function signIn(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}
