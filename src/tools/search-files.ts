import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { ToolResult } from './types';

const execAsync = promisify(exec);

export async function searchFiles(pattern: string, searchPath = '.', useRegex = false): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(searchPath);
    const escapedPath = absolutePath.replace(/'/g, "'\\''");

    let command: string;
    if (useRegex) {
      command = `grep -rn --include="*.ts" --include="*.js" --include="*.json" --include="*.md" -E '${pattern.replace(/'/g, "'\\''")}' '${escapedPath}' 2>/dev/null | head -50`;
    } else {
      command = `grep -rn --include="*.ts" --include="*.js" --include="*.json" --include="*.md" -F '${pattern.replace(/'/g, "'\\''")}' '${escapedPath}' 2>/dev/null | head -50`;
    }

    const { stdout } = await execAsync(command);

    if (!stdout.trim()) {
      return {
        success: true,
        output: `No matches found for pattern: "${pattern}"`,
      };
    }

    return {
      success: true,
      output: stdout,
    };
  } catch (err) {
    // grep returns exit code 1 when no matches found — that's OK
    const execErr = err as { code?: number; stdout?: string };
    if (execErr.code === 1) {
      return {
        success: true,
        output: `No matches found for pattern: "${pattern}"`,
      };
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      error: `Search failed: ${message}`,
    };
  }
}
