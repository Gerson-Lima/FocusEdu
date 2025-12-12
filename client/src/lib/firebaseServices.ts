import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  Timestamp,
  enableNetwork,
  disableNetwork,
  waitForPendingWrites,
} from 'firebase/firestore';
import { db } from '@/firebase';
import type { Activity, Course, KanbanColumn, KanbanItem, ActivityStatus } from '@/types/firebase';

// Activities
// Use the single collection name `activity` to match Firestore (singular) used in the project
export const activityCollection = collection(db, 'activity');
export const coursesCollection = collection(db, 'courses');
export const kanbanColumnsCollection = collection(db, 'kanban_columns');
export const kanbanItemsCollection = collection(db, 'kanban_items');

// Subscribe to user activities in real-time
export function subscribeToActivities(userId: string, callback: (activities: Activity[]) => void) {
  // Use fallback query without orderBy to avoid index requirement
  // This will work immediately and we'll sort manually
  const fallbackQ = query(activityCollection, where('userId', '==', userId));
  
  return onSnapshot(fallbackQ, 
    (snapshot) => {
      const activities: Activity[] = [];
      snapshot.forEach((doc) => {
        activities.push({ id: doc.id, ...doc.data() } as Activity);
      });
      // Sort manually by createdAt descending
      activities.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(activities);
    },
    (error) => {
      console.error('Error subscribing to activities:', error);
      callback([]);
    }
  );
}

// Subscribe to user courses in real-time
export function subscribeToCourses(userId: string, callback: (courses: Course[]) => void) {
  // Use fallback query without orderBy to avoid index requirement
  // This will work immediately and we'll sort manually
  const fallbackQ = query(coursesCollection, where('userId', '==', userId));
  
  return onSnapshot(fallbackQ, 
    (snapshot) => {
      const courses: Course[] = [];
      snapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() } as Course);
      });
      // Sort manually by createdAt descending
      courses.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      callback(courses);
    },
    (error) => {
      console.error('Error subscribing to courses:', error);
      callback([]);
    }
  );
}

// Helper function to remove undefined values from an object
function removeUndefinedFields(obj: any): any {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
}

// Create a new activity
export async function createActivity(activity: Omit<Activity, 'id'>) {
  // basic validation to avoid saving empty entries
  if (!activity.userId) {
    console.warn('createActivity: missing userId, aborting', activity);
    throw new Error('createActivity: userId missing');
  }
  if (!activity.title || activity.title.trim() === '') {
    console.warn('createActivity: missing title, aborting', activity);
    throw new Error('createActivity: title missing');
  }

  // Validate dueDate
  if (!activity.dueDate || isNaN(activity.dueDate)) {
    throw new Error('createActivity: invalid dueDate');
  }

  // Build document data - explicitly set each field to avoid any undefined issues
  const docData: Record<string, any> = {
    userId: String(activity.userId),
    title: String(activity.title),
    description: activity.description ? String(activity.description) : '',
    courseId: activity.courseId ? String(activity.courseId) : '',
    courseName: activity.courseName ? String(activity.courseName) : (activity.courseId ? String(activity.courseId) : ''),
    category: activity.category || 'atividade',
    status: activity.status || 'nao_iniciada',
    dueDate: Number(activity.dueDate),
    createdAt: activity.createdAt ? Number(activity.createdAt) : Date.now(),
    // report-friendly fields
    name: String(activity.title),
    topics: activity.description ? [String(activity.description)] : [],
    date: new Date(activity.dueDate).toISOString(),
  };

  // Add completedAt only if it exists and is valid
  if (activity.completedAt !== undefined && activity.completedAt !== null && !isNaN(Number(activity.completedAt))) {
    docData.completedAt = Number(activity.completedAt);
  }

  // Validate that all required fields are present and valid
  if (!docData.userId || !docData.title || !docData.dueDate) {
    throw new Error('createActivity: missing required fields');
  }

  console.debug('createActivity -> saving document to activity collection', docData);
  
  // Try to ensure network is enabled
  try {
    await enableNetwork(db);
  } catch (e) {
    // Ignore if already enabled
    console.debug('Network enable check:', e);
  }
  
  // Use setDoc with a generated ID to avoid subscription conflicts
  // This is more reliable when there are active subscriptions
  try {
    // Generate a unique ID using timestamp + random
    const newId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const docRef = doc(db, 'activity', newId);
    
    // Use setDoc instead of addDoc to avoid internal assertion errors
    // and subscription conflicts
    await setDoc(docRef, docData);
    console.debug('Successfully created activity with setDoc, id:', newId);
    return newId;
  } catch (error: any) {
    console.error('Error creating activity:', error, 'Data:', docData);
    
    // Check if it's a permissions error
    const isPermissionError = 
      error.code === 'permission-denied' ||
      error.message?.includes('Missing or insufficient permissions') ||
      error.message?.includes('permission');
    
    if (isPermissionError) {
      const userMessage = 'Erro de permissão. Verifique se:\n' +
        '1. Você está autenticado (faça login novamente)\n' +
        '2. As regras de segurança do Firestore estão configuradas corretamente\n' +
        '3. Consulte o arquivo FIRESTORE_SETUP.md para instruções';
      throw new Error(userMessage);
    }
    
    // Check if it's a network/blocking error
    const isBlockedError = 
      error.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
      error.message?.includes('Failed to fetch') ||
      error.code === 'unavailable' ||
      error.code === 'deadline-exceeded' ||
      (error.message && typeof error.message === 'string' && error.message.includes('blocked'));
    
    if (isBlockedError) {
      // Try to wait for pending writes and retry
      try {
        console.warn('Network error detected, waiting for pending writes and retrying...');
        await waitForPendingWrites(db);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry with addDoc as alternative
        const collectionRef = collection(db, 'activity');
        const docRef = await addDoc(collectionRef, docData);
        console.debug('Successfully created activity with addDoc after retry, id:', docRef.id);
        return docRef.id;
      } catch (retryError: any) {
        const userMessage = 'Erro de conexão bloqueado. Por favor:\n' +
          '1. Verifique se há extensões do navegador bloqueando o Firebase\n' +
          '2. Desative bloqueadores de anúncios temporariamente\n' +
          '3. Verifique sua conexão com a internet\n' +
          '4. Tente recarregar a página';
        throw new Error(userMessage);
      }
    }
    
    // For internal assertion errors, try addDoc as fallback
    if (
      error.message?.includes('INTERNAL ASSERTION') || 
      error.message?.includes('Unexpected state')
    ) {
      try {
        console.warn('setDoc failed with internal assertion, trying addDoc as fallback');
        await new Promise(resolve => setTimeout(resolve, 200));
        const collectionRef = collection(db, 'activity');
        const docRef = await addDoc(collectionRef, docData);
        return docRef.id;
      } catch (fallbackError: any) {
        console.error('addDoc fallback also failed:', fallbackError);
        throw new Error(`Falha ao criar atividade. Erro: ${error.message}`);
      }
    }
    
    // For other errors, throw with a user-friendly message
    throw new Error(`Erro ao salvar atividade: ${error.message || 'Erro desconhecido'}`);
  }
}

// Update an activity
export async function updateActivity(activityId: string, updates: Partial<Activity>) {
  const activityRef = doc(db, 'activity', activityId);

  // map some fields to their report-friendly counterparts if provided
  const updatesToSave: any = { ...updates };
  if (updates.title !== undefined) updatesToSave.name = updates.title;
  if (updates.description !== undefined) updatesToSave.topics = updates.description ? [updates.description] : [];
  if (updates.dueDate !== undefined) updatesToSave.date = new Date(updates.dueDate).toISOString();

  // Remove undefined fields before saving (Firestore doesn't accept undefined)
  const cleanedUpdates = removeUndefinedFields(updatesToSave);

  console.debug('updateActivity -> updating activity/%s with', activityId, cleanedUpdates);
  await updateDoc(activityRef, cleanedUpdates);
}

// Delete an activity
export async function deleteActivity(activityId: string) {
  const activityRef = doc(db, 'activity', activityId);
  await deleteDoc(activityRef);
}

// Create a new course
export async function createCourse(course: Omit<Course, 'id'>) {
  const cleanedCourse = removeUndefinedFields(course);
  const docRef = await addDoc(coursesCollection, cleanedCourse);
  return docRef.id;
}

// Update a course
export async function updateCourse(courseId: string, updates: Partial<Course>) {
  const courseRef = doc(db, 'courses', courseId);
  const cleanedUpdates = removeUndefinedFields(updates);
  await updateDoc(courseRef, cleanedUpdates);
}

// Delete a course
export async function deleteCourse(courseId: string) {
  const courseRef = doc(db, 'courses', courseId);
  await deleteDoc(courseRef);
}

// Kanban operations
export function subscribeToKanbanColumns(userId: string, callback: (columns: KanbanColumn[]) => void) {
  try {
    const q = query(kanbanColumnsCollection, where('userId', '==', userId), orderBy('order', 'asc'));
    
    return onSnapshot(q, 
      (snapshot) => {
        const columns: KanbanColumn[] = [];
        snapshot.forEach((doc) => {
          columns.push({ id: doc.id, ...doc.data() } as KanbanColumn);
        });
        callback(columns);
      },
      (error) => {
        console.error('Error subscribing to kanban columns:', error);
        // Fallback without orderBy if index is missing
        if (error.code === 'failed-precondition') {
          console.warn('Index missing for kanban columns, using fallback query');
          const fallbackQ = query(kanbanColumnsCollection, where('userId', '==', userId));
          const unsubscribe = onSnapshot(fallbackQ, (snapshot) => {
            const columns: KanbanColumn[] = [];
            snapshot.forEach((doc) => {
              columns.push({ id: doc.id, ...doc.data() } as KanbanColumn);
            });
            // Sort manually
            columns.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(columns);
          }, (fallbackError) => {
            console.error('Fallback query also failed:', fallbackError);
            callback([]);
          });
          return unsubscribe;
        }
        callback([]);
        return () => {};
      }
    );
  } catch (error) {
    console.error('Error setting up kanban columns subscription:', error);
    callback([]);
    return () => {};
  }
}

export function subscribeToKanbanItems(userId: string, callback: (items: KanbanItem[]) => void) {
  try {
    const q = query(kanbanItemsCollection, where('userId', '==', userId), orderBy('order', 'asc'));
    
    return onSnapshot(q, 
      (snapshot) => {
        const items: KanbanItem[] = [];
        snapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as KanbanItem);
        });
        callback(items);
      },
      (error) => {
        console.error('Error subscribing to kanban items:', error);
        // Fallback without orderBy if index is missing
        if (error.code === 'failed-precondition') {
          console.warn('Index missing for kanban items, using fallback query');
          const fallbackQ = query(kanbanItemsCollection, where('userId', '==', userId));
          const unsubscribe = onSnapshot(fallbackQ, (snapshot) => {
            const items: KanbanItem[] = [];
            snapshot.forEach((doc) => {
              items.push({ id: doc.id, ...doc.data() } as KanbanItem);
            });
            // Sort manually
            items.sort((a, b) => (a.order || 0) - (b.order || 0));
            callback(items);
          }, (fallbackError) => {
            console.error('Fallback query also failed:', fallbackError);
            callback([]);
          });
          return unsubscribe;
        }
        callback([]);
        return () => {};
      }
    );
  } catch (error) {
    console.error('Error setting up kanban items subscription:', error);
    callback([]);
    return () => {};
  }
}

export async function createKanbanColumn(column: Omit<KanbanColumn, 'id'>) {
  const cleanedColumn = removeUndefinedFields(column);
  
  // Use setDoc with generated ID to avoid subscription conflicts
  try {
    const newId = `${column.userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const docRef = doc(db, 'kanban_columns', newId);
    await setDoc(docRef, cleanedColumn);
    return newId;
  } catch (error: any) {
    // Fallback to addDoc if setDoc fails
    console.warn('setDoc failed for kanban column, trying addDoc:', error);
    const docRef = await addDoc(kanbanColumnsCollection, cleanedColumn);
    return docRef.id;
  }
}

export async function updateKanbanColumn(columnId: string, updates: Partial<KanbanColumn>) {
  const columnRef = doc(db, 'kanban_columns', columnId);
  const cleanedUpdates = removeUndefinedFields(updates);
  await updateDoc(columnRef, cleanedUpdates);
}

export async function deleteKanbanColumn(columnId: string) {
  const columnRef = doc(db, 'kanban_columns', columnId);
  await deleteDoc(columnRef);
}

export async function createKanbanItem(item: Omit<KanbanItem, 'id'>) {
  // Check if item already exists for this activity
  try {
    const existingItems = await getDocs(
      query(
        kanbanItemsCollection,
        where('userId', '==', item.userId),
        where('activityId', '==', item.activityId)
      )
    );
    
    if (!existingItems.empty) {
      // Item already exists, return existing ID
      return existingItems.docs[0]!.id;
    }
  } catch (error) {
    console.warn('Error checking for existing kanban item:', error);
    // Continue with creation if check fails
  }

  const cleanedItem = removeUndefinedFields(item);
  
  // Use setDoc with generated ID to avoid subscription conflicts
  try {
    const newId = `${item.userId}-${item.activityId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const docRef = doc(db, 'kanban_items', newId);
    await setDoc(docRef, cleanedItem);
    return newId;
  } catch (error: any) {
    // Fallback to addDoc if setDoc fails
    console.warn('setDoc failed for kanban item, trying addDoc:', error);
    const docRef = await addDoc(kanbanItemsCollection, cleanedItem);
    return docRef.id;
  }
}

export async function updateKanbanItem(itemId: string, updates: Partial<KanbanItem>) {
  const itemRef = doc(db, 'kanban_items', itemId);
  const cleanedUpdates = removeUndefinedFields(updates);
  await updateDoc(itemRef, cleanedUpdates);
}

export async function deleteKanbanItem(itemId: string) {
  const itemRef = doc(db, 'kanban_items', itemId);
  await deleteDoc(itemRef);
}

// Track initialization to prevent concurrent calls
const initializationInProgress = new Set<string>();

// Helper function to clean up duplicate columns
async function cleanupDuplicateColumns(userId: string) {
  try {
    const existingColumns = await getDocs(
      query(kanbanColumnsCollection, where('userId', '==', userId))
    );

    const titleMap = new Map<string, { docId: string; order: number; data: any }[]>();
    
    existingColumns.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const title = data.title?.toLowerCase().trim() || '';
      if (!titleMap.has(title)) {
        titleMap.set(title, []);
      }
      titleMap.get(title)!.push({
        docId: docSnapshot.id,
        order: data.order || 999,
        data,
      });
    });

    // Delete duplicates, keeping only the first one (lowest order or first created)
    const deletions: Promise<void>[] = [];
    
    titleMap.forEach((docs, title) => {
      if (docs.length > 1) {
        // Sort by order, then keep the first one
        docs.sort((a, b) => a.order - b.order);
        // Delete all except the first
        for (let i = 1; i < docs.length; i++) {
          deletions.push(deleteDoc(doc(db, 'kanban_columns', docs[i]!.docId)));
        }
      }
    });

    if (deletions.length > 0) {
      await Promise.all(deletions);
      console.log(`Cleaned up ${deletions.length} duplicate kanban columns`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate columns:', error);
  }
}

// Helper function to clean up duplicate kanban items
async function cleanupDuplicateKanbanItems(userId: string) {
  try {
    const existingItems = await getDocs(
      query(kanbanItemsCollection, where('userId', '==', userId))
    );

    const activityMap = new Map<string, { docId: string; order: number; data: any }[]>();
    
    existingItems.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const activityId = data.activityId || '';
      if (activityId && !activityMap.has(activityId)) {
        activityMap.set(activityId, []);
      }
      if (activityId) {
        activityMap.get(activityId)!.push({
          docId: docSnapshot.id,
          order: data.order || 999,
          data,
        });
      }
    });

    // Delete duplicates, keeping only the first one (lowest order)
    const deletions: Promise<void>[] = [];
    
    activityMap.forEach((docs, activityId) => {
      if (docs.length > 1) {
        // Sort by order, then keep the first one
        docs.sort((a, b) => a.order - b.order);
        // Delete all except the first
        for (let i = 1; i < docs.length; i++) {
          deletions.push(deleteDoc(doc(db, 'kanban_items', docs[i]!.docId)));
        }
      }
    });

    if (deletions.length > 0) {
      await Promise.all(deletions);
      console.log(`Cleaned up ${deletions.length} duplicate kanban items`);
    }
  } catch (error) {
    console.error('Error cleaning up duplicate kanban items:', error);
  }
}

// Initialize default Kanban columns for a new user
export async function initializeKanbanColumns(userId: string) {
  // Prevent concurrent initialization for the same user
  if (initializationInProgress.has(userId)) {
    return;
  }

  try {
    initializationInProgress.add(userId);

    // First, clean up any duplicates
    await cleanupDuplicateColumns(userId);
    await cleanupDuplicateKanbanItems(userId);

    // Check if columns already exist - check by title to avoid duplicates
    const existingColumns = await getDocs(
      query(kanbanColumnsCollection, where('userId', '==', userId))
    );
    
    const existingTitles = new Set<string>();
    existingColumns.forEach((doc) => {
      const data = doc.data();
      if (data.title) {
        existingTitles.add(data.title.toLowerCase().trim());
      }
    });

    const defaultColumns = [
      { title: 'Por fazer', order: 0 },
      { title: 'Em andamento', order: 1 },
      { title: 'Concluído', order: 2 },
    ];

    // Only create columns that don't exist
    const columnsToCreate = defaultColumns.filter(
      (col) => !existingTitles.has(col.title.toLowerCase().trim())
    );

    if (columnsToCreate.length === 0) {
      // All columns already exist
      return;
    }

    // Use setDoc with generated IDs to avoid conflicts
    const promises = columnsToCreate.map(async (col, index) => {
      const newId = `${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${index}`;
      const docRef = doc(db, 'kanban_columns', newId);
      const cleanedColumn = removeUndefinedFields({
        userId,
        title: col.title,
        order: col.order,
      });
      await setDoc(docRef, cleanedColumn);
      return newId;
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error initializing kanban columns:', error);
    // Don't throw, just log the error
  } finally {
    // Remove from in-progress set after a delay to allow for async operations
    setTimeout(() => {
      initializationInProgress.delete(userId);
    }, 1000);
  }
}

// Helper to calculate activity status based on dates
export function calculateActivityStatus(dueDate: number, completedAt?: number): ActivityStatus {
  const now = Date.now();
  
  if (completedAt) {
    return 'concluida';
  }
  
  if (now > dueDate) {
    return 'atrasada';
  }
  
  return 'pendente';
}
