import * as fs from 'fs/promises';
import type { Dirent } from 'fs';
import * as path from 'path';
import { ToolResult } from './types';

async function buildTree(dirPath: string, prefix = '', depth = 0): Promise<string> {
  if (depth > 4) return prefix + '...\n';

  let result = '';
  let entries: Dirent[];

  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return '';
  }

  // Filter out node_modules and .git
  const filtered = entries.filter((e) => e.name !== 'node_modules' && e.name !== '.git' && !e.name.startsWith('.'));

  for (let i = 0; i < filtered.length; i++) {
    const entry = filtered[i];
    const isLast = i === filtered.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const childPrefix = prefix + (isLast ? '    ' : '│   ');

    if (entry.isDirectory()) {
      result += prefix + connector + entry.name + '/\n';
      result += await buildTree(path.join(dirPath, entry.name), childPrefix, depth + 1);
    } else {
      result += prefix + connector + entry.name + '\n';
    }
  }

  return result;
}

export async function listDirectory(dirPath = '.'): Promise<ToolResult> {
  try {
    const absolutePath = path.resolve(dirPath);
    const tree = await buildTree(absolutePath);
    const output = `${absolutePath}/\n${tree}`;

    return {
      success: true,
      output,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      output: '',
      error: `Failed to list directory: ${message}`,
    };
  }
}
