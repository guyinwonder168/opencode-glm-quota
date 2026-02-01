import { describe, test, mock } from 'node:test';
import * as assert from 'node:assert';
import { GlmQuotaPlugin } from '../../src/index.js';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

describe('Integration: Error Handling in src/index.ts', () => {
  test('should return boxed error message when Date constructor throws', async () => {
    // Setup credentials to reach queryAllUsage
    process.env.ZAI_API_KEY = 'test-token';

    // Mock Date to throw
    const originalDate = global.Date;
    
    try {
        // We overwrite global.Date. 
        // Note: We must ensure it's still a constructor.
        global.Date = class extends originalDate {
            constructor(...args: any[]) {
                super(...args);
                throw new Error('Date failure');
            }
        } as any;

        // Create plugin instance
        const plugin = await GlmQuotaPlugin({} as any);
        const tool = plugin.tool!.glm_quota;

        const result = await (tool as any).execute();
        
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
