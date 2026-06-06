export const priorities = ['baixa', 'media', 'alta', 'urgente'] as const;
export const taskStatuses = ['pendente', 'fazendo', 'concluida'] as const;
export const recurrences = ['nenhuma', 'diaria', 'semanal', 'mensal'] as const;
export const eventTypes = ['aula', 'prova', 'reuniao', 'compromisso'] as const;

export type Priority = (typeof priorities)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type EventType = (typeof eventTypes)[number];
export type Recurrence = (typeof recurrences)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  teacher?: string;
  color: string;
}

export interface AcademicTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  subjectId?: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  recurrence: Recurrence;
  reminderMinutesBefore: number;
  createdAt: string;
}

export interface AcademicEvent {
  id: string;
  userId: string;
  title: string;
  type: EventType;
  subjectId?: string;
  startsAt: string;
  location?: string;
  notes?: string;
  reminderMinutesBefore: number;
}

export interface Grade {
  id: string;
  userId: string;
  subjectId: string;
  title: string;
  score: number;
  weight: number;
  date: string;
}

export interface ReminderSettings {
  userId: string;
  enabled: boolean;
  defaultMinutesBefore: number;
  quietHoursStart: string;
  quietHoursEnd: string;
}

export interface Database {
  users: User[];
  subjects: Subject[];
  tasks: AcademicTask[];
  events: AcademicEvent[];
  grades: Grade[];
  reminders: ReminderSettings[];
}

export const emptyDb: Database = {
  users: [],
  subjects: [],
  tasks: [],
  events: [],
  grades: [],
  reminders: [],
};
