import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { prisma } from '@/db/prisma.js';
import { agent } from './helpers/agent';
import { truncateAll } from './helpers/db';

const ENDPOINT = '/v1/auth';
const validUser = () => ({
  email: `user-${Date.now()}@example.com`,
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
});

describe('POST /v1/auth/register', () => {
  beforeEach(truncateAll);
  afterAll(() => prisma.$disconnect());

  it('creates an account and returns the public user shape (no password hash)', async () => {
    const a = agent();
    const body = validUser();
    const res = await a.post(`${ENDPOINT}/register`).send(body);
    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      role: 'CUSTOMER',
    });
    expect(res.body.user).not.toHaveProperty('passwordHash');
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('sets httpOnly access_token and refresh_token cookies', async () => {
    const a = agent();
    const res = await a.post(`${ENDPOINT}/register`).send(validUser());
    const setCookies = res.headers['set-cookie'] as unknown as string[] | string;
    const all = Array.isArray(setCookies) ? setCookies.join(';') : (setCookies ?? '');
    expect(all).toMatch(/access_token=/);
    expect(all).toMatch(/refresh_token=/);
    expect(all).toMatch(/HttpOnly/i);
  });

  it('rejects duplicate emails with 409 CONFLICT', async () => {
    const a = agent();
    const body = validUser();
    await a.post(`${ENDPOINT}/register`).send(body).expect(201);
    const dup = await a.post(`${ENDPOINT}/register`).send(body);
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });

  it('rejects weak passwords with 400 VALIDATION_ERROR', async () => {
    const a = agent();
    const res = await a.post(`${ENDPOINT}/register`).send({ ...validUser(), password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects malformed emails with 400 VALIDATION_ERROR', async () => {
    const a = agent();
    const res = await a.post(`${ENDPOINT}/register`).send({ ...validUser(), email: 'not-an-email' });
    expect(res.status).toBe(400);
  });
});

describe('POST /v1/auth/login', () => {
  beforeEach(truncateAll);

  it('returns a session for valid credentials', async () => {
    const a = agent();
    const body = validUser();
    await a.post(`${ENDPOINT}/register`).send(body).expect(201);
    const res = await a.post(`${ENDPOINT}/login`).send({ email: body.email, password: body.password });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(body.email);
  });

  it('returns 401 for an unknown email', async () => {
    const a = agent();
    const res = await a.post(`${ENDPOINT}/login`).send({ email: 'nobody@x.com', password: 'Whatever123!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns 401 for a correct email with a wrong password', async () => {
    const a = agent();
    const body = validUser();
    await a.post(`${ENDPOINT}/register`).send(body).expect(201);
    const res = await a.post(`${ENDPOINT}/login`).send({ email: body.email, password: 'WrongPass99!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /v1/auth/me', () => {
  beforeEach(truncateAll);

  it('returns the current user when authenticated via cookie', async () => {
    const a = agent();
    const body = validUser();
    await a.post(`${ENDPOINT}/register`).send(body).expect(201);
    const res = await a.get(`${ENDPOINT}/me`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(body.email);
  });

  it('returns 401 with no token', async () => {
    const a = agent();
    const res = await a.get(`${ENDPOINT}/me`);
    expect(res.status).toBe(401);
  });
});

describe('POST /v1/auth/logout + /v1/auth/refresh', () => {
  beforeEach(truncateAll);

  it('refresh rotates the cookies and continues working', async () => {
    const a = agent();
    await a.post(`${ENDPOINT}/register`).send(validUser()).expect(201);
    const refresh = await a.post(`${ENDPOINT}/refresh`).send();
    expect(refresh.status).toBe(200);
    const me = await a.get(`${ENDPOINT}/me`);
    expect(me.status).toBe(200);
  });

  it('logout clears the session and subsequent /me is 401', async () => {
    const a = agent();
    await a.post(`${ENDPOINT}/register`).send(validUser()).expect(201);
    await a.post(`${ENDPOINT}/logout`).expect(204);
    const me = await a.get(`${ENDPOINT}/me`);
    expect(me.status).toBe(401);
  });
});
