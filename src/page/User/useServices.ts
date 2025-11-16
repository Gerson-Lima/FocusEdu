import { auth, db } from "../../firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  deleteUser,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";

// 🔐 Reautenticar usuário
export async function reautenticarUsuario(senha: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  const credencial = EmailAuthProvider.credential(user.email!, senha);
  return await reauthenticateWithCredential(user, credencial);
}

// ✉️ Solicitar troca de email (envia email de verificação)
export async function atualizarEmailUsuario(novoEmail: string, senha: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  // Reautentica antes de qualquer alteração
  await reautenticarUsuario(senha);

  try {
    // Envia email de verificação
    await verifyBeforeUpdateEmail(user, novoEmail);
    return true;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      throw new Error("Este email já está em uso.");
    }
    throw new Error("Erro ao solicitar atualização de email.");
  }
}

// Atualiza Firestore quando o Auth muda de fato (após confirmação do email)
export function observarMudancaDeEmail(callback: (novoEmail: string) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    const novoEmail = user.email;

    const ref = doc(db, "users", user.uid);
    await updateDoc(ref, { email: novoEmail });

    callback(novoEmail!);
  });
}

// Excluir conta
export async function excluirContaUsuario(senha: string) {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado.");

  await reautenticarUsuario(senha);

  try {
    const ref = doc(db, "users", user.uid);
    await deleteDoc(ref);

    await deleteUser(user);
    return true;
  } catch (err) {
    throw new Error("Erro ao excluir conta.");
  }
}
