import { useState, useEffect } from 'react';
import { useFirebaseAuth } from '@/contexts/MockAuthContext';
import {
  subscribeToActivities,
  subscribeToCourses,
  createActivity as fbCreateActivity,
  updateActivity as fbUpdateActivity,
  deleteActivity as fbDeleteActivity,
  createCourse as fbCreateCourse,
  subscribeToKanbanColumns,
  subscribeToKanbanItems,
  createKanbanColumn as fbCreateKanbanColumn,
  createKanbanItem as fbCreateKanbanItem,
  updateKanbanItem as fbUpdateKanbanItem,
  deleteKanbanItem as fbDeleteKanbanItem,
  initializeKanbanColumns as fbInitializeKanbanColumns,
  calculateActivityStatus as fbCalculateActivityStatus,
} from '@/lib/firebaseServices';
import { seedData } from '@/lib/seedData';
import { db } from '@/firebase';
import { query, where, getDocs } from 'firebase/firestore';
import type {
  Activity,
  Course,
  KanbanColumn,
  KanbanItem,
  ActivityStatus,
} from '@/types/firebase';

// ---------- Helpers de data ----------

function getTodayMidnight(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

function normalizeStatusByDueDate(status: ActivityStatus, dueDate: number): ActivityStatus {
  if (status === 'concluida') return 'concluida';

  const today = getTodayMidnight();
  if (dueDate < today) {
    return 'atrasada';
  }

  if (status === 'atrasada' && dueDate >= today) {
    return 'pendente';
  }

  return status;
}

function getStatusForColumnTitle(title: string): ActivityStatus | null {
  const t = title.trim().toLowerCase();

  if (t === 'por fazer') return 'nao_iniciada';
  if (t === 'pendente') return 'pendente';
  if (t === 'em andamento') return 'pendente';
  if (t === 'em atraso') return 'atrasada';
  if (t === 'concluído' || t === 'concluido') return 'concluida';

  return null;
}

function findColumnIdForStatus(columns: KanbanColumn[], status: ActivityStatus): string | undefined {
  for (const col of columns) {
    const colStatus = getStatusForColumnTitle(col.title);
    if (colStatus === status) return col.id;
  }
  return undefined;
}

async function syncKanbanItemToStatus(userId: string, activityId: string, status: ActivityStatus) {
  const colsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanColumnsCollection, where('userId', '==', userId)));
  let targetColumnId: string | undefined;
  colsSnap.forEach((d) => {
    const title = (d.data() as any).title?.toString?.() ?? '';
    const colStatus = getStatusForColumnTitle(title);
    if (colStatus === status) targetColumnId = d.id;
  });

  if (!targetColumnId) return;

  const itemsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanItemsCollection, where('userId', '==', userId), where('activityId', '==', activityId)));

  if (!itemsSnap.empty) {
    const docId = itemsSnap.docs[0].id;
    await fbUpdateKanbanItem(docId, { columnId: targetColumnId });
  } else {
    const columnItemsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanItemsCollection, where('userId', '==', userId), where('columnId', '==', targetColumnId)));
    const order = columnItemsSnap.size;
    await fbCreateKanbanItem({ userId, columnId: targetColumnId, activityId, order });
  }
}

// ---------- HOOKS ----------

export function useActivities() {
  const { currentUser } = useFirebaseAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    if (!currentUser) return;

    try {
      const snapshotActivities: Activity[] = await new Promise((resolve) => {
        const unsub = subscribeToActivities(currentUser.uid, (acts) => resolve(acts));
        setTimeout(() => unsub(), 1000);
      });

      for (const a of snapshotActivities) {
        const normalizedStatus = normalizeStatusByDueDate(a.status, a.dueDate);
        if (normalizedStatus !== a.status) {
          try { await fbUpdateActivity(a.id, { status: normalizedStatus }); } catch (e) { /* ignore */ }
          await syncKanbanItemToStatus(currentUser.uid, a.id, normalizedStatus);
        } else {
          await syncKanbanItemToStatus(currentUser.uid, a.id, normalizedStatus);
        }
      }
    } catch (err) {
      console.warn('refreshData error', err);
    }
  };

  useEffect(() => {
    let unsubActivities: (() => void) | undefined;
    let unsubCourses: (() => void) | undefined;
    let isMounted = true;

    if (currentUser) {
      setLoading(true);

      try {
        unsubActivities = subscribeToActivities(currentUser.uid, (acts) => {
          if (!isMounted) return;
          
          const today = getTodayMidnight();
          acts.forEach((a) => {
            const normalized = normalizeStatusByDueDate(a.status, a.dueDate);
            if (normalized !== a.status) {
              fbUpdateActivity(a.id, { status: normalized }).catch(() => {});
              syncKanbanItemToStatus(currentUser.uid, a.id, normalized).catch(() => {});
            } else {
              syncKanbanItemToStatus(currentUser.uid, a.id, normalized).catch(() => {});
            }
          });

          if (isMounted) {
            setActivities(acts);
            setLoading(false);
          }
        });

        unsubCourses = subscribeToCourses(currentUser.uid, (c) => {
          if (isMounted) setCourses(c);
        });
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        if (isMounted) {
          setActivities([]);
          setCourses([]);
          setLoading(false);
        }
      }
    } else {
      setActivities([]);
      setCourses([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
      // Add small delay to avoid cleanup during active operations
      setTimeout(() => {
        try {
          if (unsubActivities) {
            unsubActivities();
          }
        } catch (error) {
          console.warn('Error unsubscribing from activities:', error);
        }
        try {
          if (unsubCourses) {
            unsubCourses();
          }
        } catch (error) {
          console.warn('Error unsubscribing from courses:', error);
        }
      }, 0);
    };
  }, [currentUser]);

  return {
    activities,
    courses,
    loading,
    refreshData,
  };
}

export function useKanban() {
  const { currentUser } = useFirebaseAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [items, setItems] = useState<KanbanItem[]>([]);

  const refreshData = async () => {
    if (!currentUser) return;
    try {
      const cols = await new Promise<KanbanColumn[]>((resolve) => {
        const unsub = subscribeToKanbanColumns(currentUser.uid, (c) => resolve(c));
        setTimeout(() => unsub(), 1000);
      });

      const it = await new Promise<KanbanItem[]>((resolve) => {
        const unsub = subscribeToKanbanItems(currentUser.uid, (i) => resolve(i));
        setTimeout(() => unsub(), 1000);
      });

      setColumns(cols);
      setItems(it);
    } catch (err) {
      console.warn('refresh kanban error', err);
    }
  };

  useEffect(() => {
    let unsubCols: (() => void) | undefined;
    let unsubItems: (() => void) | undefined;
    let isMounted = true;

    if (currentUser) {
      // Initialize columns only once, before setting up subscriptions
      fbInitializeKanbanColumns(currentUser.uid)
        .then(() => {
          if (isMounted) {
            // Set up subscriptions after initialization
            unsubCols = subscribeToKanbanColumns(currentUser.uid, (c) => {
              if (isMounted) setColumns(c);
            });
            unsubItems = subscribeToKanbanItems(currentUser.uid, (i) => {
              if (isMounted) setItems(i);
            });
          }
        })
        .catch((error) => {
          console.error('Error initializing kanban columns:', error);
          // Still set up subscriptions even if initialization fails
          if (isMounted) {
            unsubCols = subscribeToKanbanColumns(currentUser.uid, (c) => {
              if (isMounted) setColumns(c);
            });
            unsubItems = subscribeToKanbanItems(currentUser.uid, (i) => {
              if (isMounted) setItems(i);
            });
          }
        });
    } else {
      setColumns([]);
      setItems([]);
    }

    return () => {
      isMounted = false;
      // Add small delay to avoid cleanup during active operations
      setTimeout(() => {
        try {
          if (unsubCols) {
            unsubCols();
          }
        } catch (error) {
          console.warn('Error unsubscribing from kanban columns:', error);
        }
        try {
          if (unsubItems) {
            unsubItems();
          }
        } catch (error) {
          console.warn('Error unsubscribing from kanban items:', error);
        }
      }, 0);
    };
  }, [currentUser]);

  return {
    columns,
    items,
    refreshData,
  };
}

export const activitiesService = {
  createActivity: async (activity: Omit<Activity, 'id'>) => {
    const id = await fbCreateActivity({ ...activity });
    return id;
  },

  updateActivity: async (activityId: string, updates: Partial<Activity>) => {
    await fbUpdateActivity(activityId, updates);
  },

  deleteActivity: async (activityId: string) => {
    await fbDeleteActivity(activityId);
  },

  createCourse: async (course: Omit<Course, 'id'>) => {
    const id = await fbCreateCourse(course);
    return id;
  },

  createKanbanItem: async (item: Omit<KanbanItem, 'id'>) => {
    const id = await fbCreateKanbanItem(item);
    return id;
  },

  updateKanbanItem: async (itemId: string, updates: Partial<KanbanItem>) => {
    await fbUpdateKanbanItem(itemId, updates);
  },

  deleteKanbanItem: async (itemId: string) => {
    await fbDeleteKanbanItem(itemId);
  },

  generateSampleData: async (userId: string) => {
    await seedData(userId);
  },

  createKanbanColumn: async (column: Omit<KanbanColumn, 'id'>) => {
    const id = await fbCreateKanbanColumn(column);
    return id;
  },

  syncKanbanWithStatus: async (userId: string, activityId: string, status: ActivityStatus) => {
    const normalized = normalizeStatusByDueDate(status, getTodayMidnight());

    try {
      const colsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanColumnsCollection, where('userId', '==', userId)));
      let targetColumnId: string | undefined;

      colsSnap.forEach((d) => {
        const title = (d.data() as any).title?.toString?.() ?? '';
        const colStatus = getStatusForColumnTitle(title);
        if (colStatus === normalized) targetColumnId = d.id;
      });

      if (!targetColumnId) return;

      const itemsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanItemsCollection, where('userId', '==', userId), where('activityId', '==', activityId)));

      if (!itemsSnap.empty) {
        const docId = itemsSnap.docs[0].id;
        await fbUpdateKanbanItem(docId, { columnId: targetColumnId });
      } else {
        const columnItemsSnap = await getDocs(query((await import('@/lib/firebaseServices')).kanbanItemsCollection, where('userId', '==', userId), where('columnId', '==', targetColumnId)));
        const order = columnItemsSnap.size;
        await fbCreateKanbanItem({ userId, columnId: targetColumnId, activityId, order });
      }
    } catch (err) {
      console.warn('syncKanbanWithStatus failed', err);
    }
  },
};
/* Duplicate helper block removed — useActivities is implemented above once. */
