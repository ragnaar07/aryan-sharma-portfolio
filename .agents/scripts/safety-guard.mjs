#!/usr/bin/env node

async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  try {
    if (!input.trim()) {
      process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
      return;
    }

    const payload = JSON.parse(input);
    const cmd = payload?.toolCall?.args?.CommandLine || '';

    // Check for dangerous patterns
    const dangerousPatterns = [
      /git\s+push\s+.*(--force|-f\b)/i,
      /rm\s+-rf\s+(\/|~|\.\/src|\.\/public|\.\/config)/i,
      /git\s+reset\s+--hard/i,
      /(\.env\.local.*(rm|truncate|>|unlink))/i,
      /git\s+add\s+.*\.env/i,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cmd)) {
        process.stdout.write(
          JSON.stringify({
            decision: 'deny',
            reason: `Safety Guard: Command blocked by portfolio policy (${pattern.toString()}).`,
          }) + '\n'
        );
        return;
      }
    }

    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  } catch {
    // Failsafe allow
    process.stdout.write(JSON.stringify({ decision: 'allow' }) + '\n');
  }
}

main();
