import express from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const WORKER_ID = process.env.WORKER_ID || 'worker-1';

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  const dbConnection = await open({
    filename: './credentials.db',
    driver: sqlite3.Database
  });

  await dbConnection.exec(
    `CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      credential JSON NOT NULL,
      issuedAt TEXT NOT NULL
    )`
  );

  return dbConnection;
}

app.post('/issue', async (req, res) => {
  try {
    const credential = req.body;

    if (!credential.id) {
      return res.status(400).json({ message: 'Credential must have an id field' });
    }

    // Check if credential already issued
    const existing = await db.get('SELECT * FROM credentials WHERE id = ?', credential.id);
    if (existing) {
      return res.status(200).json({
        message: 'Credential already issued',
        issuedBy: WORKER_ID,
        credentialId: credential.id
      });
    }

    // Issue new credential
    const issuedAt = new Date().toISOString();
    await db.run(
      'INSERT INTO credentials (id, credential, issuedAt) VALUES (?, ?, ?)',
      credential.id,
      JSON.stringify(credential),
      issuedAt
    );

    res.status(201).json({
      message: 'Credential issued',
      issuedBy: WORKER_ID,
      issuedAt,
      credentialId: credential.id
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: (err as Error).message });
  }
});

(async () => {
  db = await initDB();

  app.listen(PORT, () => {
    console.log(`Credential Issuance Service running on port ${PORT}, worker: ${WORKER_ID}`);
  });
})();

export { app, initDB };
