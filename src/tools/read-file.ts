import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolResult } from './types';

export async function readFile(filePath: string): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, 'utf-8');
    return {
      success: true,
      output: content,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      error: `Failed to read file: ${message}`,
    };
  }
}
