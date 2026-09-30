/** Usage: npm run create-admin   (prompts)  — or —  npm run create-admin -- email@example.com "Name" */
import readline from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { pool } from './pool.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
try {
  const [argEmail, argName] = process.argv.slice(2);
  const email = (argEmail || (await rl.question('Admin email: '))).trim().toLowerCase();
  const name = (argName || (await rl.question('Display name [Admin]: ')).trim() || 'Admin');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That does not look like an email address.');

  // Password is read from the terminal; for scripted use set ADMIN_PASSWORD in the environment.
  const password = process.env.ADMIN_PASSWORD || (await rl.question('Password (min 10 chars, visible while typing): '));
  if (password.length < 10) throw new Error('Password must be at least 10 characters.');

  const hash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admins (email, name, password_hash) VALUES ($1,$2,$3)
     ON CONFLICT (lower(email)) DO UPDATE SET password_hash = EXCLUDED.password_hash, name = EXCLUDED.name,
       token_version = admins.token_version + 1, failed_attempts = 0, locked_until = NULL`,
    [email, name, hash]
  );
  console.log(`✔ Admin saved: ${email}`);
} catch (err) {
  console.error('✖', err.message);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
