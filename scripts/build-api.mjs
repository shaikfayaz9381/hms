/**
 * Builds the Vercel serverless entry point for the MedPulse API.
 *
 * The server source uses ESM-style `.js` import specifiers that actually
 * resolve to `.ts` files (the convention used by tsx locally). esbuild does
 * not perform that substitution by default, so this script adds a small
 * resolver plugin and bundles `server/vercel-handler.ts` into a single
 * `api/index.js`, which Vercel deploys as one function.
 *
 * `@prisma/client` stays external so Node's file tracing picks up the
 * generated Prisma client and its query-engine binary.
 */
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import path from 'node:path';

/** Resolve `./x.js` to `./x.ts` when only the TypeScript file exists. */
const jsToTsPlugin = {
  name: 'js-to-ts',
  setup(build) {
    build.onResolve({ filter: /^\.{1,2}\/.*\.js$/ }, (args) => {
      const absolute = path.resolve(path.dirname(args.importer), args.path);
      if (existsSync(absolute)) {
        return undefined; // A real .js file exists — let esbuild handle it.
      }
      const tsFile = `${absolute.slice(0, -3)}.ts`;
      if (existsSync(tsFile)) {
        return { path: tsFile };
      }
      return undefined;
    });
  },
};

await build({
  entryPoints: ['server/vercel-handler.ts'],
  outfile: 'api/index.js',
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  external: ['@prisma/client'],
  banner: {
    js: [
      '/* AUTO-GENERATED from server/vercel-handler.ts by scripts/build-api.mjs — regenerate with `npm run build:api`. */',
      'import { createRequire } from "node:module";',
      'const require = createRequire(import.meta.url);',
    ].join('\n'),
  },
  logLevel: 'info',
});
