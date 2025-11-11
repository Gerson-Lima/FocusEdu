import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { ButtonType } from "../constants/buttons";
import type { Unsubscribe } from "firebase/firestore";

export type ReportItem = {
  id: string;
  name: string;
  category: ButtonType;
  topics: string[];
  date: string;
};

export function subscribeReports(
  userId: string,
  callback: (reports: ReportItem[]) => void
): Unsubscribe {
  if (!userId) {
    callback([]);
    return () => {};
  }

  const dataDocRef = doc(db, "data", userId);
  
  const unsubscribe = onSnapshot(dataDocRef, (docSnapshot) => {
    const data = docSnapshot.data();
    const itemsArray = Array.isArray(data?.items) ? data.items : [];
    
    const reports: ReportItem[] = itemsArray.map((item: any, index: number) => ({
      id: item.id || `item-${index}`,
      name: item.name || "",
      category: item.category || "Aulas",
      topics: Array.isArray(item.topics) ? item.topics : [],
      date: item.date ? String(item.date) : "",
    }));
    
    callback(reports);
  });

  return unsubscribe; 
}

export async function addReport(userId: string, report: Omit<ReportItem, "id">) {
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  const dataDocRef = doc(db, "data", userId);
  
  // Gera um ID único para o novo item
  const newItem: ReportItem = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    name: report.name,
    category: report.category,
    topics: report.topics || [],
    date: report.date || "",
  };
  
  // Verifica se o documento existe
  const docSnapshot = await getDoc(dataDocRef);
  
  if (docSnapshot.exists()) {
    // Adiciona o novo item ao array usando arrayUnion
    await updateDoc(dataDocRef, {
      items: arrayUnion(newItem),
    });
  } else {
    // Cria o documento com o primeiro item
    await setDoc(dataDocRef, {
      items: [newItem],
    });
  }
}
