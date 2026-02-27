import * as fs from 'fs/promises';
import * as path from 'path';
import { createPatch } from 'diff';
import { showDiff } from '../utils/display';
import { ToolResult } from './types';

export async function editFile(filePath: string, oldString: string, newString: string): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(filePath);
    const original = await fs.readFile(absolutePath, 'utf-8');

    if (!original.includes(oldString)) {
      return {
        success: false,
        output: '',
        error: `old_string not found in file: ${filePath}`,
      };
    }

    const updated = original.replace(oldString, newString);
    await fs.writeFile(absolutePath, updated, 'utf-8');

    const patch = createPatch(filePath, original, updated, '', '');
    showDiff(patch);

    return {
      success: true,
      output: `File edited successfully: ${filePath}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      error: `Failed to edit file: ${message}`,
    };
  }
}
