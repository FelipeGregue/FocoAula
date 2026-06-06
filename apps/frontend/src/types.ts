import type { FunctionalComponent } from 'vue'

export type Priority = 'baixa' | 'media' | 'alta' | 'urgente'
export type TaskStatus = 'pendente' | 'fazendo' | 'concluida'
export type Recurrence = 'nenhuma' | 'diaria' | 'semanal' | 'mensal'
export type EventType = 'aula' | 'prova' | 'reuniao' | 'compromisso'
export type Tab = 'painel' | 'tarefas' | 'calendario' | 'pomodoro' | 'notas' | 'ajustes'
export type ApiStatus = 'local' | 'online' | 'offline'
export type AuthMode = 'login' | 'register'
export type PomodoroMode = 'foco' | 'pausa'

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Subject {
  id: string
  name: string
  teacher?: string
  color: string
}

export interface AcademicTask {
  id: string
  title: string
  description?: string
  subjectId?: string
  dueDate: string
  priority: Priority
  status: TaskStatus
  recurrence: Recurrence
  reminderMinutesBefore: number
  createdAt: string
}

export interface AcademicEvent {
  id: string
  title: string
  type: EventType
  subjectId?: string
  startsAt: string
  location?: string
  notes?: string
  reminderMinutesBefore: number
}

export interface Grade {
  id: string
  subjectId: string
  title: string
  score: number
  weight: number
  date: string
}

export interface Average {
  subjectId: string
  subjectName: string
  color: string
  average: number
  assessments: number
}

export interface GradeGroup extends Average {
  grades: Grade[]
}

export interface ReminderSettings {
  userId?: string
  enabled: boolean
  defaultMinutesBefore: number
  quietHoursStart: string
  quietHoursEnd: string
}

export interface AuthForm {
  name: string
  email: string
  password: string
}

export interface TaskForm {
  title: string
  description: string
  subjectId: string
  dueDate: string
  priority: Priority
  status: TaskStatus
  recurrence: Recurrence
  reminderMinutesBefore: number
}

export interface EventForm {
  title: string
  type: EventType
  subjectId: string
  startsAt: string
  location: string
  notes: string
  reminderMinutesBefore: number
}

export interface GradeForm {
  subjectId: string
  title: string
  score: number
  weight: number
  date: string
}

export interface SubjectForm {
  name: string
  teacher: string
  color: string
}

export interface NavTab {
  id: Tab
  label: string
  icon: FunctionalComponent
}
