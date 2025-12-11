import { auth, db } from '@/firebase';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  deleteUser,
  updatePassword,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';

export async function reauthenticateUser(password: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado.');

  const cred = EmailAuthProvider.credential(user.email!, password);
  return reauthenticateWithCredential(user, cred);
}

export async function requestEmailUpdate(newEmail: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado.');

  try {
    await verifyBeforeUpdateEmail(user, newEmail);
    return true;
  } catch (err: any) {
    if (err.code === 'auth/email-already-in-use') throw new Error('Este e-mail ja esta em uso.');
    throw new Error('Erro ao solicitar atualizacao de e-mail.');
  }
}

export async function changePassword(newPassword: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado.');

  try {
    await updatePassword(user, newPassword);
    return true;
  } catch (err: any) {
    if (err.code === 'auth/weak-password') throw new Error('A senha deve ter no minimo 8 caracteres.');
    throw new Error('Erro ao atualizar senha.');
  }
}

export async function deleteAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario nao autenticado.');

  try {
    const ref = doc(db, 'users', user.uid);
    await deleteDoc(ref);
    await deleteUser(user);
    return true;
  } catch (err: any) {
    throw new Error('Erro ao excluir conta.');
  }
}
