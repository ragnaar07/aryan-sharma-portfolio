#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    if (!input.trim()) {
      process.stdout.write('{}\n');
      return;
    }

    const payload = JSON.parse(input);
    const filePath = payload?.toolCall?.args?.Path;

    if (filePath && typeof filePath === 'string' && fs.existsSync(filePath)) {
      const isFormattable = /\.(ts|tsx|js|jsx|json|md|css|mjs)$/i.test(filePath);
      if (isFormattable) {
        try {
          execSync(`npx --no-install prettier --write "${filePath}"`, {
            stdio: 'ignore',
            timeout: 5000,
          });
        } catch {
          // Ignore if prettier is not locally installed yet
        }
      }
    }
  } catch {
    // Failsafe
  }

  process.stdout.write('{}\n');
}

main();
