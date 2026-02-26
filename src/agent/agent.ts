import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { allTools } from '../tools/index';
import { SYSTEM_PROMPT } from './system-prompt';
import { showAssistantLabel, showError } from '../utils/display';

export class CodingAgent {
  private client: OpenAI;
  private messages: ChatCompletionMessageParam[] = [];

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
    this.messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];
  }

  async chat(userMessage: string): Promise<void> {
    this.messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      showAssistantLabel();

      const runner = this.client.chat.completions.runTools({
        model: 'gpt-4o-mini',
        messages: this.messages,
        tools: allTools,
      });

      // Stream the assistant's response token by token
      runner.on('content', (delta: string) => {
        process.stdout.write(delta);
      });

      // Wait for the full run to complete
      await runner.finalChatCompletion();

      // Sync all messages (including tool_call + tool_result) back to history
      this.messages = runner.messages as ChatCompletionMessageParam[];

      process.stdout.write('\n');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      showError(`Agent error: ${message}`);
    }
  }

  clearHistory(): void {
    this.messages = [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
    ];
  }

  getMessageCount(): number {
    // Exclude the system message
    return this.messages.length - 1;
  }
}
