jest.mock('child_process');
jest.mock('util', () => {
  const actual = jest.requireActual<typeof import('util')>('util');
  const mockFn = jest.fn();
  return {
    ...actual,
    promisify: () => mockFn,
    _execAsyncMock: mockFn,
  };
});

import { searchFiles } from '../../src/tools/search-files';

// Access the mock function created inside the factory above
const mockExecAsync: jest.Mock = (jest.requireMock('util') as any)._execAsyncMock;

describe('searchFiles', () => {
  beforeEach(() => {
    mockExecAsync.mockReset();
  });

  it('returns matches on success', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'src/index.ts:1:  hello world\n', stderr: '' });

    const result = await searchFiles('hello world');

    expect(result.success).toBe(true);
    expect(result.output).toContain('src/index.ts');
  });

  it('returns no-matches message when stdout is empty', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '', stderr: '' });

    const result = await searchFiles('notfound');

    expect(result.success).toBe(true);
    expect(result.output).toBe('No matches found for pattern: "notfound"');
  });

  it('returns no-matches message when stdout is whitespace only', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: '   \n', stderr: '' });

    const result = await searchFiles('notfound');

    expect(result.success).toBe(true);
    expect(result.output).toBe('No matches found for pattern: "notfound"');
  });

  it('returns no-matches message when grep exits with code 1', async () => {
    const err = Object.assign(new Error('no matches'), { code: 1 });
    mockExecAsync.mockRejectedValueOnce(err);

    const result = await searchFiles('pattern');

    expect(result.success).toBe(true);
    expect(result.output).toBe('No matches found for pattern: "pattern"');
  });

  it('returns error when grep exits with non-1 error code', async () => {
    const err = Object.assign(new Error('grep crashed'), { code: 2 });
    mockExecAsync.mockRejectedValueOnce(err);

    const result = await searchFiles('pattern');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Search failed');
  });

  it('uses -E flag when useRegex is true', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'match\n', stderr: '' });

    await searchFiles('foo.*bar', '.', true);

    const calledCmd = mockExecAsync.mock.calls[0][0] as string;
    expect(calledCmd).toContain('-E');
    expect(calledCmd).not.toContain('-F');
  });

  it('uses -F flag when useRegex is false', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'match\n', stderr: '' });

    await searchFiles('literal string', '.', false);

    const calledCmd = mockExecAsync.mock.calls[0][0] as string;
    expect(calledCmd).toContain('-F');
    expect(calledCmd).not.toContain('-E');
  });

  it('includes | head -50 and 2>/dev/null in command', async () => {
    mockExecAsync.mockResolvedValueOnce({ stdout: 'line\n', stderr: '' });

    await searchFiles('test');

    const calledCmd = mockExecAsync.mock.calls[0][0] as string;
    expect(calledCmd).toContain('| head -50');
    expect(calledCmd).toContain('2>/dev/null');
  });
});
