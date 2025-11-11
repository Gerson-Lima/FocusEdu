import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"

export async function signUp(email: string, password: string) {
    return await createUserWithEmailAndPassword(auth, email, password);
}

export async function signIn(email: string, password: string) {
    return await signInWithEmailAndPassword(auth, email, password);
}