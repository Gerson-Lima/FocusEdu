import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "../firebase"
import { doc, setDoc} from "firebase/firestore"

export async function signUp(email: string, password: string) {
    // cria o usuário no Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
    });

    return userCredential;
}

export async function signIn(email: string, password: string) {
    return await signInWithEmailAndPassword(auth, email, password);
}