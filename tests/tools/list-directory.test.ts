import * as fs from 'fs/promises';
import * as path from 'path';
import { listDirectory } from '../../src/tools/list-directory';

jest.mock('fs/promises');

const mockFs = fs as jest.Mocked<typeof fs>;

function makeDirent(name: string, isDir: boolean): fs.Dirent {
  return { name, isDirectory: () => isDir } as unknown as fs.Dirent;
}

describe('listDirectory', () => {
  it('returns success with absolutePath/ prefix in output', async () => {
    mockFs.readdir.mockResolvedValue([]);

    const result = await listDirectory('/tmp/mydir');

    expect(result.success).toBe(true);
    expect(result.output).toContain(`${path.resolve('/tmp/mydir')}/`);
  });

  it('lists files and directories in tree format', async () => {
    mockFs.readdir.mockImplementation(async (dirPath, _opts) => {
      if (dirPath === path.resolve('/tmp/proj')) {
        return [
          makeDirent('src', true),
          makeDirent('README.md', false),
        ] as any;
      }
      return [];
    });

    const result = await listDirectory('/tmp/proj');

    expect(result.output).toContain('src/');
    expect(result.output).toContain('README.md');
  });

  it('filters out node_modules, .git, and dot-prefixed entries', async () => {
    mockFs.readdir.mockResolvedValue([
      makeDirent('node_modules', true),
      makeDirent('.git', true),
      makeDirent('.env', false),
      makeDirent('src', true),
    ] as any);

    const result = await listDirectory('.');

    expect(result.output).not.toContain('node_modules');
    expect(result.output).not.toContain('.git');
    expect(result.output).not.toContain('.env');
    expect(result.output).toContain('src/');
  });

  it('returns success:true even when readdir throws', async () => {
    mockFs.readdir.mockRejectedValue(new Error('permission denied'));

    const result = await listDirectory('/locked');

    expect(result.success).toBe(true);
    // buildTree returns '' on error, so output is just the path line
    expect(result.output).toContain(`${path.resolve('/locked')}/`);
  });

  it('uses "." as default path', async () => {
    mockFs.readdir.mockResolvedValue([]);

    const result = await listDirectory();

    expect(result.success).toBe(true);
    expect(result.output).toContain(`${path.resolve('.')}/`);
  });

  it('calls readdir with withFileTypes:true', async () => {
    mockFs.readdir.mockResolvedValue([]);

    await listDirectory('/some/dir');

    expect(mockFs.readdir).toHaveBeenCalledWith(
      expect.any(String),
      { withFileTypes: true }
    );
  });

  it('returns prefix + "..." when depth > 4', async () => {
    // Provide deeply nested directories to force depth > 4
    const deepDirent = makeDirent('deep', true);
    mockFs.readdir.mockResolvedValue([deepDirent] as any);

    const result = await listDirectory('.');

    // At depth 5 the tree returns '...' line
    expect(result.output).toContain('...');
  });
});
