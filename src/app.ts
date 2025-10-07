import express from 'express';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
const cors = require('cors');


// Enum for credential status
enum CredentialStatus {
  ISSUED = 'issued',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

// DTO for incoming credential issue request
interface CredentialDTO {
  id: string;
  data: Record<string, any>;
  status?: CredentialStatus;
}

// Stored credential DB schema
interface StoredCredential {
  id: string;
  credential: string; // JSON string
  issuedAt: string;
  status: CredentialStatus;
}

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.FE_URL || 'https://your-frontend-domain.onrender.com', // your React frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // allowed HTTP methods
  credentials: true, // if you use cookies/auth headers
}));

const PORT = 5000;
const WORKER_ID = process.env.WORKER_ID || 'worker-1';

let db: Database<sqlite3.Database, sqlite3.Statement>;

async function initDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  const dbConnection = await open({
    filename: './credentials.db',
    driver: sqlite3.Database,
  });

  await dbConnection.exec(
    `CREATE TABLE IF NOT EXISTS credentials (
      id TEXT PRIMARY KEY,
      credential TEXT NOT NULL,
      issuedAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '${CredentialStatus.ISSUED}'
    )`
  );

  return dbConnection;
}

app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.post('/issue', async (req, res) => {
  try {
    const credential: CredentialDTO = req.body;

    if (!credential.id) {
      return res.status(400).json({ message: 'Credential must have an id field' });
    }

    credential.status = credential.status || CredentialStatus.ISSUED;

    const existing: StoredCredential | undefined = await db.get(
      'SELECT * FROM credentials WHERE id = ?',
      credential.id
    );

    if (existing) {
      return res.status(200).json({
        message: 'Credential already issued',
        issuedBy: WORKER_ID,
        credentialId: credential.id,
        status: existing.status,
      });
    }

    const issuedAt = new Date().toISOString();

    await db.run(
      'INSERT INTO credentials (id, credential, issuedAt, status) VALUES (?, ?, ?, ?)',
      credential.id,
      JSON.stringify(credential.data),
      issuedAt,
      credential.status
    );

    res.status(201).json({
      message: 'Credential issued',
      issuedBy: WORKER_ID,
      issuedAt,
      credentialId: credential.id,
      status: credential.status,
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal Server Error', error: (err as Error).message });
  }
});

// New endpoint to fetch credential by ID for verification service
app.get('/credentials/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const credentialRecord: StoredCredential | undefined = await db.get(
      'SELECT * FROM credentials WHERE id = ?',
      id
    );

    if (!credentialRecord) {
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Parse stored JSON string back to object
    const credentialData = JSON.parse(credentialRecord.credential);

    res.status(200).json({
      credentialId: credentialRecord.id,
      issuedAt: credentialRecord.issuedAt,
      status: credentialRecord.status,
      data: credentialData,
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

export { app, initDB, CredentialDTO, CredentialStatus, StoredCredential };
