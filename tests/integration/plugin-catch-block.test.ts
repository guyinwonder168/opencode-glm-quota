import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { GlmQuotaPlugin } from '../../src/index.js';

type PluginContext = Parameters<typeof GlmQuotaPlugin>[0];
type ToolExecutor = {
  execute: (args?: Record<string, unknown>, context?: Record<string, unknown>) => Promise<string> | string;
};

describe('Integration: Plugin Error Catch Block', () => {
  describe('Global Error Catch Behavior', () => {
    test('should return Markdown for generic Error objects', async () => {
      // Set up credentials to bypass credential check
      process.env.ZAI_API_KEY = 'test-token';

      try {
        // Create plugin instance
        const plugin = await GlmQuotaPlugin({} as unknown as PluginContext);
        const tool = plugin.tool!.glm_quota;

        // Mock Date constructor to throw an error
        const originalDate = global.Date;

        try {
          class ThrowingDate extends Date {
            constructor() {
              super();
              throw new Error('Date constructor failed');
            }
          }

          global.Date = ThrowingDate as unknown as DateConstructor;

          const result = await (tool as unknown as ToolExecutor).execute();

          assert.ok(result.startsWith('### ⚠️ '), 'Output should start with a Markdown error title');
          assert.ok(!result.includes('╔'), 'Output should not contain box borders');
          assert.ok(result.includes('Date constructor failed'), 'Error message should be present');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });

    test('should return Markdown for string errors', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as unknown as PluginContext);
        const tool = plugin.tool!.glm_quota;

        const originalDate = global.Date;

        try {
          // Throw a string instead of Error
          class ThrowingDate extends Date {
            constructor() {
              super();
              throw 'String error message';
            }
          }

          global.Date = ThrowingDate as unknown as DateConstructor;

          const result = await (tool as unknown as ToolExecutor).execute();

          assert.ok(result.startsWith('### ⚠️ '), 'Output should start with a Markdown error title');
          assert.ok(!result.includes('╚'), 'Output should not contain box borders');
          assert.ok(result.includes('String error message'), 'String error should be present');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });

    test('should handle error with newlines in Markdown output', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as unknown as PluginContext);
        const tool = plugin.tool!.glm_quota;

        const originalDate = global.Date;

        try {
          // Throw error with multiline message
          class ThrowingDate extends Date {
            constructor() {
              super();
              throw new Error('Line 1 error\nLine 2 error\nLine 3 error');
            }
          }

          global.Date = ThrowingDate as unknown as DateConstructor;

          const result = await (tool as unknown as ToolExecutor).execute();

          assert.ok(result.startsWith('### ⚠️ '), 'Output should start with a Markdown error title');
          assert.ok(!result.includes('╔'), 'Output should not contain box borders');
          assert.ok(result.includes('Line 1 error'), 'First line should be present');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });
  });

  describe('Markdown Error Consistency', () => {
    test('should keep Markdown title and message structure for all errors', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as unknown as PluginContext);
        const tool = plugin.tool!.glm_quota;

        const originalDate = global.Date;

        try {
          class ThrowingDate extends Date {
            constructor() {
              super();
              throw new Error('Test error message');
            }
          }

          global.Date = ThrowingDate as unknown as DateConstructor;

          const result = await (tool as unknown as ToolExecutor).execute();

          assert.ok(result.startsWith('### ⚠️ '), 'Markdown error title should be present');
          assert.ok(result.includes('Test error message'), 'Error description should be present');
          assert.ok(!result.includes('╔') && !result.includes('╚'), 'Box borders should be absent');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });
  });
});
