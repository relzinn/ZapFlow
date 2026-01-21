export interface Contact {
  id: string;
  raw: string;
  phone: string;
  name?: string;
  status: 'pending' | 'sent' | 'skipped' | 'error';
}

export interface Template {
  id: string;
  name: string;
  content: string;
}

export enum AppStep {
  SETUP = 'SETUP',
  SETTINGS = 'SETTINGS',
  PROCESS = 'PROCESS'
}

export type SendMode = 'web' | 'socket';

export interface AppConfig {
  mode: SendMode;
  socketUrl: string;
}