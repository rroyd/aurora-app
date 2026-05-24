import './env';
import request, { type SuperAgentTest } from 'supertest';
import { createApp } from '@/app.js';

export type Agent = SuperAgentTest;

let app: ReturnType<typeof createApp> | null = null;

export function getApp() {
  if (!app) app = createApp();
  return app;
}

export function agent(): Agent {
  return request.agent(getApp());
}
