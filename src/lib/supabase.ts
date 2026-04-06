import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);
export const supabase = isCloudConfigured ? createClient(url!, anonKey!) : null;

export type FridgeRow = {
  id: number;
  name: string;
  category: string;
  quantity: string;
  status: 'in' | 'buy';
  updated_at: string;
};

export type ShoppingRow = {
  id: number;
  text: string;
  done: boolean;
  created_at: string;
};

export type CalendarRow = {
  id: number;
  title: string;
  event_date: string;
  comment: string;
};

export type NoteRow = {
  id: number;
  content: string;
  updated_at: string;
};
