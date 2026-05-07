import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');
const sourcePath = path.resolve(
  appRoot,
  '../data/ucpd-incident-data.05-06-2026_THEFT_CATEGORIZED.csv'
);
const targetDir = path.resolve(appRoot, 'public/data');
const targetPath = path.join(targetDir, 'ucpd-theft-categorized.csv');

await mkdir(targetDir, { recursive: true });
await copyFile(sourcePath, targetPath);

console.log(`Copied ${sourcePath} -> ${targetPath}`);

