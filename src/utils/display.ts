import chalk from 'chalk';
import boxen from 'boxen';

export function showBanner(): void {
  const banner = boxen(chalk.bold.cyan('My Coding Agent') + '\n' + chalk.gray('Powered by OpenAI GPT-4o-mini'), {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
  });
  console.log(banner);
}

export function showToolCall(toolName: string, args: Record<string, unknown>): void {
  console.log(chalk.yellow(`\n[Tool Call] ${chalk.bold(toolName)}`));
  const summary = formatArgsSummary(toolName, args);
  if (summary) {
    console.log(chalk.gray(`  ${summary}`));
  }
}

export function showToolResult(toolName: string, result: string, isError = false): void {
  if (isError) {
    console.log(chalk.red(`[Tool Error] ${toolName}: ${result}`));
  } else {
    const preview = result.length > 200 ? result.slice(0, 200) + '...' : result;
    console.log(chalk.green(`[Tool Result] ${toolName}`) + chalk.gray(` → ${preview}`));
  }
}

export function showDiff(diff: string): void {
  const lines = diff.split('\n');
  for (const line of lines) {
    if (line.startsWith('+') && !line.startsWith('+++')) {
      process.stdout.write(chalk.green(line) + '\n');
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      process.stdout.write(chalk.red(line) + '\n');
    } else {
      process.stdout.write(chalk.gray(line) + '\n');
    }
  }
}

export function showError(message: string): void {
  console.error(chalk.red(`\nError: ${message}`));
}

export function showInfo(message: string): void {
  console.log(chalk.blue(message));
}

export function showAssistantLabel(): void {
  process.stdout.write(chalk.cyan('\nAssistant: '));
}

function formatArgsSummary(toolName: string, args: Record<string, unknown>): string {
  switch (toolName) {
    case 'read_file':
      return `path: ${args.path}`;
    case 'write_file':
      return `path: ${args.path}`;
    case 'edit_file':
      return `path: ${args.path}`;
    case 'list_directory':
      return `path: ${args.path || '.'}`;
    case 'search_files':
      return `pattern: "${args.pattern}" in ${args.path || '.'}`;
    case 'run_command':
      return `command: ${args.command}`;
    default:
      return JSON.stringify(args).slice(0, 100);
  }
}
