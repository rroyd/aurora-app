// Vitest globalSetup — runs once before the whole integration suite.
// Ensures the test DB exists and matches the current Prisma schema.
import { execSync } from 'node:child_process';
import { createConnection } from 'mysql2/promise';
import './env.js';

const DATABASE_URL = process.env.DATABASE_URL!;

function parseUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.replace(/^\//, ''),
  };
}

export async function setup(): Promise<void> {
  const { host, port, user, password, database } = parseUrl(DATABASE_URL);

  // 1. Connect WITHOUT a target DB and create it if missing.
  const conn = await createConnection({ host, port, user, password });
  try {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  } finally {
    await conn.end();
  }

  // 2. Sync schema (no migrations history needed for the test DB).
  execSync('pnpm prisma db push --force-reset --skip-generate --accept-data-loss', {
    stdio: 'inherit',
    env: process.env,
  });
}
