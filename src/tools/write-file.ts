import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolResult } from './types';

export async function writeFile(filePath: string, content: string): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(filePath);
    const dir = path.dirname(absolutePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(absolutePath, content, 'utf-8');
    return {
      success: true,
      output: `File written successfully: ${filePath}`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      error: `Failed to write file: ${message}`,
    };
  }
}
