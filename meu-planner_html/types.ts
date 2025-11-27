

export type Tab = 'dashboard' | 'annual' | 'monthly' | 'weekly' | 'daily' | 'work' | 'finance' | 'home' | 'personal' | 'daughter' | 'tools' | 'travel';

export interface User {
  id: string;
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  description?: string;
  location?: string;
}

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  description?: string;
}

export interface FinanceEntry {
  id: string;
  type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  description: string;
  paymentMethod?: string;
}

export interface WheelSegment {
  label: string;
  value: number; // 1-10
}

export interface AppState {
  activeTab: Tab;
  currentDate: Date;
}

export interface Subtask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  name: string;
  client?: string;
  status: 'open' | 'in_progress' | 'on_hold' | 'validated' | 'completed';
  progress: number;
  nextAction: string;
  deadline: string;
  deadlineReminder?: boolean;
  nextActionReminder?: boolean;
  nextActionDate?: string;
  subtasks?: Subtask[];
}

export interface OKR {
  id: string;
  objective: string;
  keyResult: string;
  progress: number;
  subtasks?: Subtask[];
}