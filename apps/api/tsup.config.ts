import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  bundle: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  external: [
    // Native modules — keep in node_modules
    'argon2',
    // Prisma generated client + engines
    '@prisma/client',
    '.prisma/client',
    // Optional peer of express
    'fsevents',
  ],
});
