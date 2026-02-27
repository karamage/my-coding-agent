import * as fs from 'fs/promises';
import * as diff from 'diff';
import * as display from '../../src/utils/display';
import { editFile } from '../../src/tools/edit-file';

jest.mock('fs/promises');
jest.mock('diff');
jest.mock('../../src/utils/display');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockDiff = diff as jest.Mocked<typeof diff>;
const mockDisplay = display as jest.Mocked<typeof display>;

describe('editFile', () => {
  beforeEach(() => {
    mockFs.writeFile.mockResolvedValue(undefined as any);
    mockDiff.createPatch.mockReturnValue('--- patch ---');
  });

  it('replaces old_string and returns success', async () => {
    mockFs.readFile.mockResolvedValue('hello world' as any);

    const result = await editFile('test.ts', 'hello', 'goodbye');

    expect(result.success).toBe(true);
    expect(result.output).toContain('File edited successfully');
    expect(result.output).toContain('test.ts');
  });

  it('calls writeFile with replaced content', async () => {
    mockFs.readFile.mockResolvedValue('foo bar baz' as any);

    await editFile('file.ts', 'bar', 'qux');

    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.any(String), 'foo qux baz', 'utf-8');
  });

  it('calls createPatch with filePath and original/updated', async () => {
    mockFs.readFile.mockResolvedValue('original content' as any);

    await editFile('my/file.ts', 'original', 'updated');

    expect(mockDiff.createPatch).toHaveBeenCalledWith('my/file.ts', 'original content', 'updated content', '', '');
  });

  it('calls showDiff with the patch output', async () => {
    mockFs.readFile.mockResolvedValue('abc' as any);
    mockDiff.createPatch.mockReturnValue('patch output');

    await editFile('f.ts', 'abc', 'xyz');

    expect(mockDisplay.showDiff).toHaveBeenCalledWith('patch output');
  });

  it('returns error when old_string not found', async () => {
    mockFs.readFile.mockResolvedValue('some content' as any);

    const result = await editFile('myfile.ts', 'missing string', 'new');

    expect(result.success).toBe(false);
    expect(result.error).toBe('old_string not found in file: myfile.ts');
  });

  it('returns error when readFile fails', async () => {
    mockFs.readFile.mockRejectedValue(new Error('read error'));

    const result = await editFile('bad.ts', 'x', 'y');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to edit file');
    expect(result.error).toContain('read error');
  });

  it('returns error when writeFile fails', async () => {
    mockFs.readFile.mockResolvedValue('hello world' as any);
    mockFs.writeFile.mockRejectedValue(new Error('write error'));

    const result = await editFile('file.ts', 'hello', 'hi');

    expect(result.success).toBe(false);
    expect(result.error).toContain('Failed to edit file');
    expect(result.error).toContain('write error');
  });

  it('only replaces the first occurrence', async () => {
    mockFs.readFile.mockResolvedValue('abc abc abc' as any);

    await editFile('f.ts', 'abc', 'xyz');

    expect(mockFs.writeFile).toHaveBeenCalledWith(expect.any(String), 'xyz abc abc', 'utf-8');
  });
});
