import * as readline from 'readline';
import chalk from 'chalk';
import { CodingAgent } from '../agent/agent';
import { showBanner, showInfo, showError } from '../utils/display';

export async function startREPL(apiKey: string): Promise<void> {
  showBanner();
  showInfo('Type your message and press Enter. Commands: /exit, /clear, /help');

  const agent = new CodingAgent(apiKey);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  const prompt = () => {
    rl.question(chalk.bold.green('\nYou: '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      // Handle slash commands
      if (trimmed.startsWith('/')) {
        const command = trimmed.toLowerCase();

        if (command === '/exit' || command === '/quit') {
          showInfo('\nGoodbye!');
          rl.close();
          process.exit(0);
        } else if (command === '/clear') {
          agent.clearHistory();
          console.clear();
          showBanner();
          showInfo('Conversation history cleared.');
          prompt();
          return;
        } else if (command === '/help') {
          console.log(chalk.cyan('\nAvailable commands:'));
          console.log(chalk.gray('  /exit  — Exit the agent'));
          console.log(chalk.gray('  /clear — Clear conversation history'));
          console.log(chalk.gray('  /help  — Show this help message'));
          console.log(chalk.gray('\nJust type naturally to chat with the agent.'));
          prompt();
          return;
        } else {
          showError(`Unknown command: ${trimmed}. Type /help for available commands.`);
          prompt();
          return;
        }
      }

      // Send to agent
      try {
        await agent.chat(trimmed);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        showError(`Unexpected error: ${message}`);
      }

      prompt();
    });
  };

  // Handle Ctrl+C gracefully
  rl.on('SIGINT', () => {
    showInfo('\nGoodbye!');
    rl.close();
    process.exit(0);
  });

  prompt();
}
