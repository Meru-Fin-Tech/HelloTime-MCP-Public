/**
 * Single source of truth for the server's published identity.
 *
 * Read from package.json at load time so the version (and description) can never
 * drift across the three places that surface it: the MCP handshake (server.ts),
 * the HTTP /info probe (http.ts), and the npm package manifest itself.
 *
 * We use createRequire rather than a static `import '../package.json'` because
 * package.json lives outside `rootDir` (src/) and a static import would violate
 * the tsconfig rootDir constraint. The relative path resolves correctly under
 * both tsx (src/version.ts -> ../package.json) and the compiled build
 * (dist/version.js -> ../package.json), since dist/ sits at the repo root.
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string; description: string };

export const SERVER_VERSION: string = pkg.version;
export const SERVER_DESCRIPTION: string = pkg.description;
