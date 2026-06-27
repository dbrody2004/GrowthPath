import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { config } from 'dotenv';

let loaded = false;

export function loadProjectDotenv(): void {
  if (loaded) {
    return;
  }

  loaded = true;

  let dir = process.cwd();
  const root = resolve('/');

  while (dir !== root) {
    const envPath = resolve(dir, '.env');
    if (existsSync(envPath)) {
      config({ path: envPath });
      return;
    }
    dir = dirname(dir);
  }
}

export function resetProjectDotenvForTests(): void {
  loaded = false;
}
