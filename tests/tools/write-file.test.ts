import * as fs from 'fs/promises';
import { writeFile } from '../../src/tools/write-file';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

describe('writeFile', () => {
  beforeEach(() => {
    mockFs.mkdir.mockResolvedValue(undefined as any);
    mockFs.writeFile.mockResolvedValue(undefined as any);
  });

  it('returns success with message on successful write', async () => {
    const result = await writeFile('output/test.txt', 'hello');

    expect(result.success).toBe(true);
    expect(result.output).toContain('File written successfully');
    expect(result.output).toContain('output/test.txt');
  });

  it('calls mkdir with recursive:true before writing', async () => {
    await writeFile('some/nested/file.txt', 'content');

    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
  });

  it('calls writeFile with utf-8 encoding', async () => {
    await writeFile('file.txt', 'my content');

    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.any(String), 'my content', 'utf-8');
  });

  it('returns error when mkdir fails', async () => {
    mockFs.mkdir.mockRejectedValue(new Error('mkdir failed'));

    const result = await writeFile('bad/path.txt', 'data');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to write file');
    expect(result.error).toContain('mkdir failed');
  });

  it('returns error when writeFile fails', async () => {
    mockFs.writeFile.mockRejectedValue(new Error('disk full'));

    const result = await writeFile('file.txt', 'data');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to write file');
    expect(result.error).toContain('disk full');
  });

  it('writes empty string content', async () => {
    const result = await writeFile('empty.txt', '');

    expect(result.success).toBe(true);
    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.any(String), '', 'utf-8');
  });
});
