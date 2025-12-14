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

export type ActivityPriority = 'alta' | 'media' | 'baixa';

export interface ActivityTag {
  id: string;
  label: string;
  color: string;
}

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
  courseId: string;
  courseName?: string;
  title: string;
  description: string;
  category: ActivityCategory;
  status: ActivityStatus;
  dueDate: number;
  completedAt?: number;
  createdAt: number;
  priority?: ActivityPriority;   
  tags?: ActivityTag[];          
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
