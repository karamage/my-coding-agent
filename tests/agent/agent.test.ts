import OpenAI from 'openai';
import * as display from '../../src/utils/display';
import { CodingAgent } from '../../src/agent/agent';

jest.mock('openai');
jest.mock('../../src/utils/display');
jest.mock('../../src/tools/index', () => ({ allTools: [] }));

const MockOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;
const mockDisplay = display as jest.Mocked<typeof display>;

describe('CodingAgent', () => {
  let mockRunTools: jest.Mock;
  let mockRunner: {
    on: jest.Mock;
    finalChatCompletion: jest.Mock;
    messages: any[];
  };

  beforeEach(() => {
    mockRunner = {
      on: jest.fn(),
      finalChatCompletion: jest.fn().mockResolvedValue({}),
      messages: [],
    };

    mockRunTools = jest.fn().mockReturnValue(mockRunner);

    MockOpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          runTools: mockRunTools,
        },
      },
    } as any));
  });

  it('initializes with 1 system message', () => {
    const agent = new CodingAgent('test-key');
    expect(agent.getMessageCount()).toBe(0);
  });

  it('sends user message and calls runTools', async () => {
    const agent = new CodingAgent('test-key');
    mockRunner.messages = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ];

    await agent.chat('hello');

    expect(mockRunTools).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        tools: [],
      })
    );
  });

  it('syncs runner.messages back to agent messages', async () => {
    const agent = new CodingAgent('test-key');
    mockRunner.messages = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'test' },
      { role: 'assistant', content: 'response' },
    ];

    await agent.chat('test');

    // getMessageCount = messages.length - 1 (exclude system)
    // runner.messages has 3 items, so messages.length = 3, count = 2
    expect(agent.getMessageCount()).toBe(mockRunner.messages.length - 1);
  });

  it('calls showAssistantLabel before running tools', async () => {
    const agent = new CodingAgent('test-key');
    mockRunner.messages = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hi' },
    ];

    await agent.chat('hi');

    expect(mockDisplay.showAssistantLabel).toHaveBeenCalled();
  });

  it('registers content event handler on runner', async () => {
    const agent = new CodingAgent('test-key');
    mockRunner.messages = [{ role: 'system', content: 'sys' }];

    await agent.chat('ping');

    expect(mockRunner.on).toHaveBeenCalledWith('content', expect.any(Function));
  });

  it('calls showError and does not throw when runTools throws', async () => {
    mockRunTools.mockImplementation(() => {
      throw new Error('API error');
    });

    const agent = new CodingAgent('test-key');

    await expect(agent.chat('oops')).resolves.toBeUndefined();
    expect(mockDisplay.showError).toHaveBeenCalledWith(
      expect.stringContaining('API error')
    );
  });

  it('calls showError and does not throw when finalChatCompletion rejects', async () => {
    mockRunner.finalChatCompletion.mockRejectedValue(new Error('network error'));
    mockRunner.messages = [];

    const agent = new CodingAgent('test-key');

    await expect(agent.chat('test')).resolves.toBeUndefined();
    expect(mockDisplay.showError).toHaveBeenCalledWith(
      expect.stringContaining('network error')
    );
  });

  it('clearHistory resets to 1 system message only', async () => {
    const agent = new CodingAgent('test-key');
    mockRunner.messages = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
    ];

    await agent.chat('hi');
    expect(agent.getMessageCount()).toBe(2);

    agent.clearHistory();
    expect(agent.getMessageCount()).toBe(0);
  });
});
