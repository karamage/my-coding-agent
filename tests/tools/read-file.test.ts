import * as fs from 'fs/promises';
import * as path from 'path';
import { readFile } from '../../src/tools/read-file';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('readFile', () => {
  it('returns file content on success', async () => {
    mockFs.readFile.mockResolvedValue('hello world' as any);

    const result = await readFile('test.txt');

    expect(result.success).toBe(true);
    expect(result.output).toBe('hello world');
  });

  it('resolves relative path to absolute', async () => {
    mockFs.readFile.mockResolvedValue('content' as any);

    await readFile('relative/path.txt');

    const expectedPath = path.resolve('relative/path.txt');
    expect(mockFs.readFile).toHaveBeenCalledWith(expectedPath, 'utf-8');
  });

  it('returns error on ENOENT', async () => {
    const err = Object.assign(new Error('no such file'), { code: 'ENOENT' });
    mockFs.readFile.mockRejectedValue(err);

    const result = await readFile('missing.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to read file');
    expect(result.error).toContain('no such file');
  });

  it('returns error on EACCES', async () => {
    const err = Object.assign(new Error('permission denied'), { code: 'EACCES' });
    mockFs.readFile.mockRejectedValue(err);

    const result = await readFile('/root/secret.txt');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to read file');
    expect(result.error).toContain('permission denied');
  });

  it('returns empty output on error', async () => {
    mockFs.readFile.mockRejectedValue(new Error('some error'));

    const result = await readFile('bad.txt');

    expect(result.output).toBe('');
  });
});
