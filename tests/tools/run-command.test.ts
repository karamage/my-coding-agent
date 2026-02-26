import { exec } from 'child_process';
import { confirm } from '../../src/utils/confirm';
import { runCommand } from '../../src/tools/run-command';

jest.mock('child_process');
jest.mock('../../src/utils/confirm');

const mockExec = exec as jest.MockedFunction<typeof exec>;
const mockConfirm = confirm as jest.MockedFunction<typeof confirm>;

describe('runCommand', () => {
  beforeEach(() => {
    mockConfirm.mockResolvedValue(true);
  });

  it('runs a safe command successfully', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, cb: any) => {
      cb(null, 'output text', '');
      return { pid: 123 } as any;
    });

    const result = await runCommand('echo hello');

    expect(result.success).toBe(true);
    expect(result.output).toBe('output text');
  });

  it('prompts confirmation with the command', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, cb: any) => {
      cb(null, '', '');
      return { pid: 1 } as any;
    });

    await runCommand('ls -la');

    expect(mockConfirm).toHaveBeenCalledWith('Execute command: ls -la');
  });

  it('returns cancelled error when user denies', async () => {
    mockConfirm.mockResolvedValue(false);

    const result = await runCommand('ls');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Command execution cancelled by user');
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('appends STDERR to output when both present', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, cb: any) => {
      cb(null, 'stdout content', 'stderr content');
      return { pid: 1 } as any;
    });

    const result = await runCommand('cmd');

    expect(result.success).toBe(true);
    expect(result.output).toBe('stdout content\nSTDERR: stderr content');
  });

  it('returns error when command times out (error.killed = true)', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, cb: any) => {
      const err = Object.assign(new Error('killed'), { killed: true });
      cb(err, '', '');
      return { pid: 1 } as any;
    });

    const result = await runCommand('sleep 100');

    expect(result.success).toBe(false);
    expect(result.error).toContain('timed out');
  });

  it('returns stderr as error when command fails without kill', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, cb: any) => {
      const err = Object.assign(new Error('exit 1'), { killed: false });
      cb(err, '', 'command not found');
      return { pid: 1 } as any;
    });

    const result = await runCommand('badcmd');

    expect(result.success).toBe(false);
    expect(result.error).toBe('command not found');
  });

  it('returns Failed to start command when child.pid is falsy', async () => {
    mockExec.mockImplementationOnce((_cmd: any, _opts: any, _cb: any) => {
      return { pid: undefined } as any;
    });

    const result = await runCommand('unknown');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Failed to start command');
  });

  describe('blocked patterns', () => {
    const blocked = [
      'rm -rf /',
      'rm -rf / --no-preserve-root',
      ':(){:|:&};:',
      'dd if=/dev/zero of=/dev/sda',
      'mkfs.ext4 /dev/sdb',
      'echo foo > /dev/sda',
      'chmod -R 777 /',
      'chown -R root /',
    ];

    blocked.forEach((cmd) => {
      it(`blocks: ${cmd}`, async () => {
        const result = await runCommand(cmd);

        expect(result.success).toBe(false);
        expect(result.error).toContain('blocked');
        expect(mockConfirm).not.toHaveBeenCalled();
      });
    });
  });
});
