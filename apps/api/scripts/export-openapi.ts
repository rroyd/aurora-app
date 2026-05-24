import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from '../src/docs/openapi.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../../../docs/openapi.json');

async function main() {
  const doc = buildOpenApiDocument();
  await mkdir(dirname(OUT), { recursive: true });
  await writeFile(OUT, JSON.stringify(doc, null, 2) + '\n');
  console.log(`OpenAPI written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
