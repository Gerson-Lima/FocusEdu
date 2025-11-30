import { collection, addDoc, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import type { ButtonType } from '../constants/buttons';
import type { Unsubscribe } from 'firebase/firestore';

// Report item structure stored in collection `activity`
export type ReportItem = {
  id: string;
  name: string;
  // category stored in Firestore is a string (ex: "Minhas Atividades"), keep type as string
  category: string;
  topics: string[];
  date: string;
};

export function subscribeReports(userId: string, callback: (reports: ReportItem[]) => void): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }

  // Listen to each document in collection `activity` where userId === userId
  const q = query(collection(db, 'activity'), where('userId', '==', userId), orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(q, (snap) => {
    const reports: ReportItem[] = [];
    snap.forEach((d) => {
      const obj: any = d.data();
      reports.push({
        id: d.id,
        name: obj.name || '',
        category: obj.category || 'Minhas Atividades',
        topics: Array.isArray(obj.topics) ? obj.topics : [],
        date: obj.date ? String(obj.date) : '',
      });
    });

    callback(reports);
  });

  return unsubscribe;
}

export async function addReport(userId: string, report: Omit<ReportItem, 'id'>) {
  if (!userId) throw new Error('Usuário não autenticado');

  // We'll write each report as a separate document in collection `activity`.
  // Document fields (recommended schema):
  // - userId: string
  // - name: string
  // - category: ButtonType
  // - topics: string[]
  // - date: string
  // - createdAt: number (timestamp ms)

  const newItem = {
    userId,
    name: report.name,
    category: report.category,
    topics: report.topics || [],
    date: report.date || '',
    createdAt: Date.now(),
  } as any;

  // Insert as a new document in the collection
  await addDoc(collection(db, 'activity'), newItem);
}
