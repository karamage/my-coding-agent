import { exec } from 'child_process';
import { confirm } from '../utils/confirm';
import { ToolResult } from './types';

const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\/(?:\s|$)/,
  /:\(\)\s*\{\s*:\|:\s*&\s*\}/, // fork bomb
  /\bdd\b.*of=\/dev/,
  /mkfs/,
  />\s*\/dev\/sd/,
  /chmod\s+-R\s+777\s+\//,
  /chown\s+-R\s+.*\//,
];

export async function runCommand(command: string, cwd?: string): Promise<ToolResult> {
  // Safety check: block dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      return {
        success: false,
        output: '',
        error: `Command blocked for safety: matches dangerous pattern`,
      };
    }
  }

  // Always require user confirmation
  const approved = await confirm(`Execute command: ${command}`);
  if (!approved) {
    return {
      success: false,
      output: '',
      error: 'Command execution cancelled by user',
    };
  }

  return new Promise((resolve) => {
    const timeout = 30000;
    const child = exec(
      command,
      {
        cwd: cwd || process.cwd(),
        timeout,
        maxBuffer: 1024 * 1024 * 10,
      },
      (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            resolve({
              success: false,
              output: stdout || '',
              error: `Command timed out after ${timeout / 1000}s`,
            });
          } else {
            resolve({
              success: false,
              output: stdout || '',
              error: stderr || error.message,
            });
          }
        } else {
          resolve({
            success: true,
            output: stdout + (stderr ? `\nSTDERR: ${stderr}` : ''),
          });
        }
      }
    );

    if (!child.pid) {
      resolve({
        success: false,
        output: '',
        error: 'Failed to start command',
      });
    }
  });
}
