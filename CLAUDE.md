# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev    # Run with tsx (no build step needed)
npm run build  # Compile TypeScript to dist/
npm start      # Run compiled output
npm test       # Run unit tests (Jest)
npm run test:coverage  # Run tests with coverage report
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier auto-format
npm run format:check  # Prettier format check
```

Requires `.env` with `OPENAI_API_KEY=sk-...`.

## Architecture

This is a TypeScript CLI coding agent that wraps OpenAI's GPT-4o-mini with file manipulation and shell execution tools.

**Runtime flow:**
1. `src/index.ts` — loads `.env`, validates `OPENAI_API_KEY`, calls `startREPL()`
2. `src/cli/repl.ts` — readline REPL handling `/exit`, `/clear`, `/help` slash commands
3. `src/agent/agent.ts` — `CodingAgent` class using `openai.chat.completions.runTools()` with streaming; syncs `runner.messages` back to `this.messages` after each turn to capture tool call/result history
4. `src/tools/index.ts` — wires all 6 tools, wraps each with `withLogging()` for display
5. `src/tools/*.ts` — individual tool implementations, each returning `ToolResult { success, output, error? }`

**Tools:** `read_file`, `write_file`, `edit_file`, `list_directory`, `search_files`, `run_command`

## Key Implementation Details

**CommonJS only** — `"type"` is absent from package.json (defaults to CJS). Use `chalk@4`, `ora@5`, `boxen@5` (last CJS-compatible versions). ESM packages will break.

**`zodToJsonSchema` must use `require()` cast** — the OpenAI SDK types are too complex for tsc to resolve the import normally and cause OOM. Pattern:
```typescript
const { zodToJsonSchema } = require('zod-to-json-schema') as { zodToJsonSchema: (schema: z.ZodTypeAny) => object };
```

**`tsc --noEmit` OOMs** — do not run type checking via tsc. Use `tsx src/index.ts` directly to verify runtime behavior.

**`run_command` safety:**
- Always prompts user confirmation via `src/utils/confirm.ts` before execution
- Blocks a hardcoded list of dangerous patterns (`rm -rf /`, fork bombs, `mkfs`, `dd of=/dev`, etc.)
- 30s timeout, 10MB stdout buffer

**`edit_file`** uses exact string replacement (`String.replace()`). The `old_string` must match exactly or the tool returns an error. Shows a unified diff after successful edits.

**`search_files`** uses `grep -rn` and only searches `.ts`, `.js`, `.json`, `.md` files. Results capped at 50 lines.

**`list_directory`** builds a tree view, filters out `node_modules`, `.git`, and hidden files (`.`-prefixed), max depth 4.

## Linting & Formatting

**Stack:** ESLint v10 + typescript-eslint v8 (flat config) + Prettier v3.

**Config files:**
- `eslint.config.js` — flat config; extends `tseslint.configs.recommended` + `eslint-config-prettier`
- `.prettierrc` — singleQuote, semi, trailingComma: "es5", printWidth: 120

**Rules of note:**
- `@typescript-eslint/no-explicit-any` — `warn` (test mocks use `any` unavoidably)
- `@typescript-eslint/no-unused-vars` — `error`, `argsIgnorePattern: ^_`
- The `require()` cast in `src/tools/index.ts` is suppressed with `// eslint-disable-next-line @typescript-eslint/no-require-imports`

## Testing

**Stack:** Jest 29 + ts-jest with `isolatedModules: true` (avoids tsc OOM on OpenAI SDK types).

**Test files:**
```
tests/
  tools/
    read-file.test.ts
    write-file.test.ts
    edit-file.test.ts
    list-directory.test.ts
    search-files.test.ts
    run-command.test.ts
  agent/
    agent.test.ts
```

**Mock strategy:**
- `fs/promises` — mocked for all file-based tools
- `child_process` — mocked for `run-command` and `search-files`
- `util` factory mock — `search-files` calls `promisify(exec)` at module load time; `util` is mocked to return a controllable `jest.fn()` as `promisify`'s return value
- `../../src/utils/confirm` — mocked for `run-command`
- `../../src/utils/display` — mocked for `edit-file` and `agent`
- `openai` — mocked for `agent`

**Do not run `tsc --noEmit`** — use `npm test` instead; ts-jest handles compilation per-file.
