import '../load-env.js';
import { copyFileSync, readdirSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MAX_BACKUPS = 30;

const DB_PATH = process.env.DB_PATH
  ? resolve(ROOT, process.env.DB_PATH)
  : join(ROOT, 'familjekalender.db');

const BACKUP_DIR = process.env.BACKUP_PATH
  ? resolve(ROOT, process.env.BACKUP_PATH)
  : join(ROOT, 'backups');

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19);
}
function log(msg) {
  console.log(`[${ts()}] ${msg}`);
}

if (!existsSync(DB_PATH)) {
  log(`FEL: Databasen hittades inte: ${DB_PATH}`);
  process.exit(1);
}

if (!existsSync(BACKUP_DIR)) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  log(`Skapade backup-mapp: ${BACKUP_DIR}`);
}

const date = new Date().toISOString().slice(0, 10);
const backupFile = `familjekalendern-${date}.sqlite`;
const backupPath = join(BACKUP_DIR, backupFile);

copyFileSync(DB_PATH, backupPath);
log(`Backup skapad: ${backupPath}`);

const files = readdirSync(BACKUP_DIR)
  .filter((f) => f.startsWith('familjekalendern-') && f.endsWith('.sqlite'))
  .sort();

if (files.length > MAX_BACKUPS) {
  const toDelete = files.slice(0, files.length - MAX_BACKUPS);
  for (const f of toDelete) {
    unlinkSync(join(BACKUP_DIR, f));
    log(`Raderade gammal backup: ${f}`);
  }
}

const remaining = Math.min(files.length, MAX_BACKUPS);
log(`Klart. ${remaining} backup(ar) sparade i ${BACKUP_DIR}`);
