import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import pc from 'picocolors';
import * as cli from './index';

describe('CLI UI Spacing', () => {
  let logSpy: any;

  beforeEach(() => {
    logSpy = spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  test('printWatchingMessage(false) should NOT have trailing newline (standard watch)', () => {
    cli.printWatchingMessage(false);
    expect(logSpy).toHaveBeenCalledWith(`\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)`);
  });

  test('printWatchingMessage(true) SHOULD have trailing newline (server mode)', () => {
    cli.printWatchingMessage(true);
    expect(logSpy).toHaveBeenCalledWith(`\n${pc.cyan(pc.bold('Watching for changes...'))} (Press Ctrl+C to stop)\n`);
  });
});
