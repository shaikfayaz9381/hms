/**
 * Vercel serverless entry point for the MedPulse API.
 *
 * Deployed shape:
 *   - The React client is built to `dist/` and served by Vercel's CDN.
 *   - Every `/api/*` request is rewritten to a single Vercel Function built
 *     from this file (see `vercel.json`). The function delegates to the same
 *     Express app used by the local server (`server/app.ts`), so the API is
 *     identical in both environments — it simply scales to zero between
 *     requests instead of running a long-lived process.
 *
 * Vercel is created from a bundle of this module via `npm run build:api`
 * (see `scripts/build-api.mjs`); the generated file is `api/index.js`.
 */
import { app } from './app.js';

/**
 * Normalises the request URL back to its original `/api/...` form.
 *
 * The rewrite in `vercel.json` forwards the remainder of the path as a
 * `vpath` query parameter, but depending on Vercel's routing behaviour the
 * original path may already be intact — both shapes are handled here.
 */
export default function handler(req: any, res: any): void {
  const url: string = req.url || '/api';
  const queryStart = url.indexOf('?');
  let pathname = queryStart === -1 ? url : url.slice(0, queryStart);
  const params = new URLSearchParams(queryStart === -1 ? '' : url.slice(queryStart + 1));

  if (pathname === '/api' || pathname === '/api/index') {
    const remainder = params.get('vpath');
    if (remainder) {
      pathname = `/api/${remainder}`;
    }
  }
  params.delete('vpath');

  const query = params.toString();
  req.url = query ? `${pathname}?${query}` : pathname;

  app(req, res);
}
