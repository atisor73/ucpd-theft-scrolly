import { mkdir, readFile, writeFile } from 'node:fs/promises';
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
const FIRE_HOSE_CAP_PATTERN = /(brass caps of fire hose|steel caps of fire hoses),Tools,/g;

await mkdir(targetDir, { recursive: true });
const sourceText = await readFile(sourcePath, 'utf8');
const normalizedText = sourceText.replace(FIRE_HOSE_CAP_PATTERN, '$1,Miscellaneous,');
await writeFile(targetPath, normalizedText);

console.log(`Copied ${sourcePath} -> ${targetPath} with fire-hose-cap thefts recategorized as Miscellaneous`);
