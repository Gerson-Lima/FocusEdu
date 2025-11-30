export type ActivityStatus = 'concluida' | 'pendente' | 'atrasada' | 'nao_iniciada';

export type ActivityCategory = 
  | 'atividade'
  | 'prova'
  | 'tarefa'
  | 'mentoria'
  | 'leitura'
  | 'revisao'
  | 'projeto'
  | 'seminario'
  | 'orientacao';

export interface FirebaseUser {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

export interface Course {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
}

export interface Activity {
  id: string;
  userId: string;
  courseId: string; // Can be a free text discipline name or empty
  courseName?: string; // Display name for free text disciplines
  title: string;
  description: string;
  category: ActivityCategory;
  status: ActivityStatus;
  dueDate: number; // UTC timestamp
  completedAt?: number; // UTC timestamp
  createdAt: number; // UTC timestamp
}

export interface KanbanColumn {
  id: string;
  userId: string;
  title: string;
  order: number;
}

export interface KanbanItem {
  id: string;
  userId: string;
  columnId: string;
  activityId: string;
  order: number;
}
