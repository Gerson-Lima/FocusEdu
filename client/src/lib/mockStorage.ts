/**
 * DEPRECATED: mockStorage
 *
 * This module implemented a localStorage-backed mock dataset for development.
 * The project has been migrated to use Firebase (Firestore) as the source of
 * truth for activities and kanban data (collection: `activity`).
 *
 * Keep this file only for developers who want to generate local mock data or
 * for offline testing. New production code should use the Firestore-based
 * services in `lib/firebaseServices.ts` and the hooks `useActivities` /
 * `useKanban` instead.
 */
import type { Activity, Course, KanbanColumn, KanbanItem } from '@/types/firebase';

// Mock data storage using localStorage
const STORAGE_KEYS = {
  ACTIVITIES: 'focusedu_activities',
  COURSES: 'focusedu_courses',
  KANBAN_COLUMNS: 'focusedu_kanban_columns',
  KANBAN_ITEMS: 'focusedu_kanban_items',
};

// Helper to get data from localStorage
function getFromStorage<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

// Helper to save data to localStorage
function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Activities
export function getMockActivities(userId: string): Activity[] {
  return getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES).filter(a => a.userId === userId);
}

export function addMockActivity(activity: Activity): void {
  const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
  activities.push(activity);
  saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
}

export function updateMockActivity(activityId: string, updates: Partial<Activity>): void {
  const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
  const index = activities.findIndex(a => a.id === activityId);
  if (index !== -1) {
    activities[index] = { ...activities[index], ...updates };
    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);
  }
}

export function deleteMockActivity(activityId: string): void {
  const activities = getFromStorage<Activity>(STORAGE_KEYS.ACTIVITIES);
  const filtered = activities.filter(a => a.id !== activityId);
  saveToStorage(STORAGE_KEYS.ACTIVITIES, filtered);
}

// Courses
export function getMockCourses(userId: string): Course[] {
  return getFromStorage<Course>(STORAGE_KEYS.COURSES).filter(c => c.userId === userId);
}

export function addMockCourse(course: Course): void {
  const courses = getFromStorage<Course>(STORAGE_KEYS.COURSES);
  courses.push(course);
  saveToStorage(STORAGE_KEYS.COURSES, courses);
}

// Kanban Columns
export function getMockKanbanColumns(userId: string): KanbanColumn[] {
  return getFromStorage<KanbanColumn>(STORAGE_KEYS.KANBAN_COLUMNS).filter(c => c.userId === userId);
}

export function addMockKanbanColumn(column: KanbanColumn): void {
  const columns = getFromStorage<KanbanColumn>(STORAGE_KEYS.KANBAN_COLUMNS);
  columns.push(column);
  saveToStorage(STORAGE_KEYS.KANBAN_COLUMNS, columns);
}

export function updateMockKanbanColumn(columnId: string, updates: Partial<KanbanColumn>): void {
  const columns = getFromStorage<KanbanColumn>(STORAGE_KEYS.KANBAN_COLUMNS);
  const index = columns.findIndex(c => c.id === columnId);
  if (index !== -1) {
    columns[index] = { ...columns[index], ...updates };
    saveToStorage(STORAGE_KEYS.KANBAN_COLUMNS, columns);
  }
}

// Kanban Items
export function getMockKanbanItems(userId: string): KanbanItem[] {
  return getFromStorage<KanbanItem>(STORAGE_KEYS.KANBAN_ITEMS).filter(i => i.userId === userId);
}

export function addMockKanbanItem(item: KanbanItem): void {
  const items = getFromStorage<KanbanItem>(STORAGE_KEYS.KANBAN_ITEMS);
  items.push(item);
  saveToStorage(STORAGE_KEYS.KANBAN_ITEMS, items);
}

export function updateMockKanbanItem(itemId: string, updates: Partial<KanbanItem>): void {
  const items = getFromStorage<KanbanItem>(STORAGE_KEYS.KANBAN_ITEMS);
  const index = items.findIndex(i => i.id === itemId);
  if (index !== -1) {
    items[index] = { ...items[index], ...updates };
    saveToStorage(STORAGE_KEYS.KANBAN_ITEMS, items);
  }
}

export function deleteMockKanbanItem(itemId: string): void {
  const items = getFromStorage<KanbanItem>(STORAGE_KEYS.KANBAN_ITEMS);
  const filtered = items.filter(i => i.id !== itemId);
  saveToStorage(STORAGE_KEYS.KANBAN_ITEMS, filtered);
}

// Initialize default Kanban columns
export function initializeMockKanbanColumns(userId: string): void {
  const existing = getMockKanbanColumns(userId);
  if (existing.length === 0) {
    const defaultColumns: KanbanColumn[] = [
      { id: 'col-1', userId, title: 'Por fazer', order: 0 },
      { id: 'col-2', userId, title: 'Em andamento', order: 1 },
      { id: 'col-3', userId, title: 'Concluído', order: 2 },
    ];
    defaultColumns.forEach(col => addMockKanbanColumn(col));
  }
}

// Generate sample data
export function generateMockSampleData(userId: string): void {
  // Sample courses
  const courses = [
    'Lógica Matemática',
    'Álgebra Linear',
    'Cálculo I',
    'Programação I',
    'Estruturas de Dados',
  ];

  const courseIds: string[] = [];
  courses.forEach((name, index) => {
    const course: Course = {
      id: `course-${index + 1}`,
      userId,
      name,
      createdAt: Date.now(),
    };
    addMockCourse(course);
    courseIds.push(course.id);
  });

  // Sample activities
  const activityTemplates = [
    { title: 'Lista de Exercícios 1', description: 'Resolver exercícios do capítulo 1', category: 'atividade' as const },
    { title: 'Prova Parcial', description: 'Avaliação sobre os primeiros tópicos', category: 'prova' as const },
    { title: 'Trabalho em Grupo', description: 'Projeto em equipe', category: 'projeto' as const },
    { title: 'Leitura do Capítulo 3', description: 'Ler e fazer resumo', category: 'leitura' as const },
    { title: 'Revisão para Prova', description: 'Revisar todo o conteúdo', category: 'revisao' as const },
  ];

  const statuses: Array<'concluida' | 'pendente' | 'atrasada'> = ['concluida', 'pendente', 'atrasada'];

  let activityId = 1;
  courseIds.forEach(courseId => {
    activityTemplates.forEach(template => {
      const status = statuses[Math.floor(Math.random() * statuses.length)]!;
      const daysOffset = Math.floor(Math.random() * 60) - 30;
      const dueDate = Date.now() + daysOffset * 24 * 60 * 60 * 1000;

      const activity: Activity = {
        id: `activity-${activityId++}`,
        userId,
        courseId,
        title: template.title,
        description: template.description,
        category: template.category,
        status,
        dueDate,
        completedAt: status === 'concluida' ? dueDate - 2 * 24 * 60 * 60 * 1000 : undefined,
        createdAt: Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000,
      };
      addMockActivity(activity);
    });
  });

  // Initialize Kanban columns
  initializeMockKanbanColumns(userId);

  // Create Kanban items for all activities
  const columns = getMockKanbanColumns(userId);
  const activities = getMockActivities(userId);
  
  activities.forEach((activity, index) => {
    const columnId = columns[0]?.id || 'col-1';
    const item: KanbanItem = {
      id: `item-${index + 1}`,
      userId,
      columnId,
      activityId: activity.id,
      order: index,
    };
    addMockKanbanItem(item);
  });
}
