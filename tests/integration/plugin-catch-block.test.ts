import { describe, test } from 'node:test';
import * as assert from 'node:assert';
import { GlmQuotaPlugin } from '../../src/index.js';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

describe('Integration: Plugin Error Catch Block', () => {
  describe('Global Error Catch Behavior', () => {
    test('should box generic Error objects', async () => {
      // Set up credentials to bypass credential check
      process.env.ZAI_API_KEY = 'test-token';

      try {
        // Create plugin instance
        const plugin = await GlmQuotaPlugin({} as any);
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

          global.Date = ThrowingDate as any;

          const result = await (tool as any).execute();

          // Verify boxed error format
          const lines = result.split('\n');
          assert.ok(result.includes('╔'), 'Output should contain top border');
          assert.ok(result.includes('╚'), 'Output should contain bottom border');
          assert.ok(result.includes('Date constructor failed'), 'Error message should be present');
          assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL, 'Box width should match');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });

    test('should box string errors', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as any);
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

          global.Date = ThrowingDate as any;

          const result = await (tool as any).execute();

          const lines = result.split('\n');
          assert.ok(result.includes('╔'), 'Output should contain top border');
          assert.ok(result.includes('╚'), 'Output should contain bottom border');
          assert.ok(result.includes('String error message'), 'String error should be boxed');
          assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL, 'Box width should match');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });

    test('should handle error with newlines', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as any);
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

          global.Date = ThrowingDate as any;

          const result = await (tool as any).execute();

          const lines = result.split('\n');
          assert.ok(result.includes('╔'), 'Output should contain top border');
          assert.ok(result.includes('╚'), 'Output should contain bottom border');
          assert.ok(result.includes('Line 1 error'), 'First line should be present');
          assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL, 'Box width should match');
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });
  });

  describe('Box Width Consistency', () => {
    test('should maintain 60-character box width for all errors', async () => {
      process.env.ZAI_API_KEY = 'test-token';

      try {
        const plugin = await GlmQuotaPlugin({} as any);
        const tool = plugin.tool!.glm_quota;

        const originalDate = global.Date;

        try {
          class ThrowingDate extends Date {
            constructor() {
              super();
              throw new Error('Test error message');
            }
          }

          global.Date = ThrowingDate as any;

          const result = await (tool as any).execute();

          const lines = result.split('\n');

          // Check that all border lines have correct width
          const borderLines = lines.filter(
            line => line.startsWith('╔') || line.startsWith('╚') || line.startsWith('║')
          );

          for (const borderLine of borderLines) {
            assert.strictEqual(
              borderLine.length,
              BOX_WIDTH.TOTAL,
              `Border line should be ${BOX_WIDTH.TOTAL} chars: "${borderLine}"`
            );
          }
        } finally {
          global.Date = originalDate;
        }
      } finally {
        delete process.env.ZAI_API_KEY;
      }
    });
  });
});
