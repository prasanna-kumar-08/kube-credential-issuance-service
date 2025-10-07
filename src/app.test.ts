import request from 'supertest';
import express from 'express';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { AddressInfo } from 'net';
import { app, initDB } from './app'; // Modify app.ts exports accordingly

let server: any;
let db: any;

beforeAll(async () => {
  db = await open({ filename: ':memory:', driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, credential JSON NOT NULL, issuedAt TEXT NOT NULL)`);
  app.locals.db = db;  // Modify app.ts to use app.locals.db or similar for testability

  server = app.listen();
});

afterAll(async () => {
  await db.close();
  server.close();
});

describe('POST /issue', () => {
  it('should issue a new credential', async () => {
    const credential = { id: '1234', name: 'Test User' };
    const res = await request(server).post('/issue').send(credential);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Credential issued');
    expect(res.body).toHaveProperty('issuedBy');
    expect(res.body).toHaveProperty('credentialId', '1234');
  });

  it('should not issue the same credential twice', async () => {
    const credential = { id: '1234', name: 'Test User' };
    const res = await request(server).post('/issue').send(credential);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Credential already issued');
  });

  it('should return 400 if credential id missing', async () => {
    const res = await request(server).post('/issue').send({ name: 'No ID' });
    expect(res.status).toBe(400);
  });
});
