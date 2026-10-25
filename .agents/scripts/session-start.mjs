#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  const workspaceRoot = process.cwd();
  const envLocal = path.join(workspaceRoot, '.env.local');
  const envExample = path.join(workspaceRoot, '.env.example');

  let notice = 'Portfolio workspace ready: Next.js 15, Tailwind v4, and AI Chat Assistant active.';

  if (!fs.existsSync(envLocal) && fs.existsSync(envExample)) {
    try {
      fs.copyFileSync(envExample, envLocal);
      notice += ' Created local .env.local from .env.example template.';
    } catch {
      // Ignore
    }
  }

  const response = {
    injectSteps: [
      {
        ephemeralMessage: notice,
      },
    ],
  };

  process.stdout.write(JSON.stringify(response) + '\n');
}

main();
