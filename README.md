# My Coding Agent

A Claude Code-like terminal coding agent built with TypeScript and OpenAI GPT-4o-mini. It can read, write, and edit files, run shell commands, and search through codebases — all from an interactive REPL.

## Features

- **File operations** — read, write, and make targeted edits with diff preview
- **Directory browsing** — tree-style listing of your project structure
- **Code search** — grep-based search across `.ts`, `.js`, `.json`, and `.md` files
- **Shell execution** — run commands with safety checks and user confirmation
- **Streaming output** — responses stream token by token in real time
- **Conversation history** — full multi-turn context maintained across turns

## Requirements

- Node.js 18+
- An OpenAI API key

## Setup

```bash
git clone https://github.com/karamage/my-coding-agent.git
cd my-coding-agent
npm install
```

Create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-...
```

## Usage

```bash
npm run dev
```

Type naturally to chat with the agent. It will use tools autonomously to complete your request.

### REPL Commands

| Command  | Description                |
|----------|----------------------------|
| `/clear` | Clear conversation history |
| `/help`  | Show available commands    |
| `/exit`  | Quit the agent             |

## Available Tools

| Tool             | Description                                      |
|------------------|--------------------------------------------------|
| `read_file`      | Read file contents                               |
| `write_file`     | Create or overwrite a file                       |
| `edit_file`      | Make targeted string replacements with diff view |
| `list_directory` | Browse directory structure as a tree             |
| `search_files`   | Grep for patterns across source files            |
| `run_command`    | Execute shell commands (requires confirmation)   |

## Development

```bash
npm run build   # Compile TypeScript to dist/
npm start       # Run compiled output
```

## Testing

```bash
npm test               # Run all unit tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

Unit tests are written with [Jest](https://jestjs.io/) + [ts-jest](https://kulshekhar.github.io/ts-jest/) and cover all 6 tools and the `CodingAgent` class (57 tests across 7 suites).
