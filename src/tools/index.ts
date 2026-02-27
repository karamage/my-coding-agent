import { z } from 'zod';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { zodToJsonSchema } = require('zod-to-json-schema') as { zodToJsonSchema: (schema: z.ZodTypeAny) => object };
import { readFile } from './read-file';
import { writeFile } from './write-file';
import { editFile } from './edit-file';
import { listDirectory } from './list-directory';
import { searchFiles } from './search-files';
import { runCommand } from './run-command';
import { webSearch } from './web-search';
import { showToolCall, showToolResult } from '../utils/display';

// Zod schemas for tool parameters
const ReadFileParams = z.object({
  path: z.string().describe('Path to the file to read'),
});

const WriteFileParams = z.object({
  path: z.string().describe('Path to the file to write'),
  content: z.string().describe('Content to write to the file'),
});

const EditFileParams = z.object({
  path: z.string().describe('Path to the file to edit'),
  old_string: z.string().describe('The exact string to replace'),
  new_string: z.string().describe('The string to replace it with'),
});

const ListDirectoryParams = z.object({
  path: z.string().optional().describe('Directory path to list (defaults to current directory)'),
});

const SearchFilesParams = z.object({
  pattern: z.string().describe('The string or regex pattern to search for'),
  path: z.string().optional().describe('Directory to search in (defaults to current directory)'),
  use_regex: z.boolean().optional().describe('Whether to use regex matching (default: false)'),
});

const RunCommandParams = z.object({
  command: z.string().describe('The shell command to execute'),
  cwd: z.string().optional().describe('Working directory for the command'),
});

const WebSearchParams = z.object({
  query: z.string().describe('Search query to look up on the web'),
  max_results: z.number().int().min(1).max(10).optional().default(5).describe('Number of results (1-10, default: 5)'),
});

// Helper to wrap a tool function with logging
function withLogging<TParams extends Record<string, unknown>, TReturn>(
  name: string,
  fn: (args: TParams) => Promise<TReturn>
): (args: TParams) => Promise<TReturn> {
  return async (args: TParams) => {
    showToolCall(name, args as Record<string, unknown>);
    const result = await fn(args);
    const resultStr = typeof result === 'string' ? result : JSON.stringify(result);
    const isError =
      typeof result === 'object' && result !== null && 'success' in result && !(result as { success: boolean }).success;
    showToolResult(name, resultStr, isError);
    return result;
  };
}

// Tool definitions for OpenAI runTools
export const allTools = [
  {
    type: 'function' as const,
    function: {
      name: 'read_file',
      description: 'Read the contents of a file',
      parameters: zodToJsonSchema(ReadFileParams),
      function: withLogging('read_file', async (args: z.infer<typeof ReadFileParams>) => {
        const result = await readFile(args.path);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => ReadFileParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'write_file',
      description: 'Write content to a file, creating it or overwriting it',
      parameters: zodToJsonSchema(WriteFileParams),
      function: withLogging('write_file', async (args: z.infer<typeof WriteFileParams>) => {
        const result = await writeFile(args.path, args.content);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => WriteFileParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'edit_file',
      description: 'Edit a file by replacing old_string with new_string',
      parameters: zodToJsonSchema(EditFileParams),
      function: withLogging('edit_file', async (args: z.infer<typeof EditFileParams>) => {
        const result = await editFile(args.path, args.old_string, args.new_string);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => EditFileParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'list_directory',
      description: 'List files and directories in a tree format',
      parameters: zodToJsonSchema(ListDirectoryParams),
      function: withLogging('list_directory', async (args: z.infer<typeof ListDirectoryParams>) => {
        const result = await listDirectory(args.path);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => ListDirectoryParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_files',
      description: 'Search for a pattern in files using grep',
      parameters: zodToJsonSchema(SearchFilesParams),
      function: withLogging('search_files', async (args: z.infer<typeof SearchFilesParams>) => {
        const result = await searchFiles(args.pattern, args.path, args.use_regex);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => SearchFilesParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'run_command',
      description: 'Execute a shell command (requires user confirmation)',
      parameters: zodToJsonSchema(RunCommandParams),
      function: withLogging('run_command', async (args: z.infer<typeof RunCommandParams>) => {
        const result = await runCommand(args.command, args.cwd);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => RunCommandParams.parse(JSON.parse(args)),
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web for current information using DuckDuckGo',
      parameters: zodToJsonSchema(WebSearchParams),
      function: withLogging('web_search', async (args: z.infer<typeof WebSearchParams>) => {
        const result = await webSearch(args.query, args.max_results);
        return result.success ? result.output : `Error: ${result.error}`;
      }),
      parse: (args: string) => WebSearchParams.parse(JSON.parse(args)),
    },
  },
];
