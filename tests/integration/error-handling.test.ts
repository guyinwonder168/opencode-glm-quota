import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { GlmQuotaPlugin } from '../../src/index.js';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

type PluginContext = Parameters<typeof GlmQuotaPlugin>[0];
type ToolExecutor = {
  execute: (args?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<string> | string;
};

describe('Integration: Error Handling in src/index.ts', () => {
  test('should return boxed error message when Date constructor throws', async () => {
    // Setup credentials to reach queryAllUsage
    process.env.ZAI_API_KEY = 'test-token';

    // Mock Date to throw
    const originalDate = global.Date;

    try {
      class ThrowingDate extends Date {
        constructor(...args: ConstructorParameters<typeof Date>) {
          super(...args);
          throw new Error('Date failure');
        }
      }

      global.Date = ThrowingDate as DateConstructor;

      // Create plugin instance
      const plugin = await GlmQuotaPlugin({} as unknown as PluginContext);
      const tool = plugin.tool!.glm_quota;

      const result = await (tool as unknown as ToolExecutor).execute();

      const lines = result.split('\n');
      assert.ok(result.includes('╔'), 'Output should contain top border');
      assert.ok(result.includes('╚'), 'Output should contain bottom border');
      assert.ok(result.includes('Date failure'), `Output should contain error message. Got: ${result}`);
      assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL, 'Box width should match');
    } finally {
      // Cleanup
      global.Date = originalDate;
      delete process.env.ZAI_API_KEY;
    }
  });
});
