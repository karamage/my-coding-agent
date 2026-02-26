import dotenv from 'dotenv';
import { startREPL } from './cli/repl';
import { showError } from './utils/display';

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey || apiKey === 'your_api_key_here') {
  showError('OPENAI_API_KEY is not set. Please add it to your .env file.');
  process.exit(1);
}

startREPL(apiKey).catch((err) => {
  showError(`Fatal error: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
