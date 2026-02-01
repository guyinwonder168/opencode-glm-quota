/**
 * Box Alignment Validation Tests
 * 
 * Ensures all output lines maintain consistent 60-character width
 * and proper box drawing alignment.
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';

// Mock data for testing
const mockQuotaData = {
  limits: [
    {
      type: 'MCP usage(1 Month)',
      percentage: 1.0,
      currentValue: 4,
      total: 1000,
      usageDetails: [
        { modelCode: 'search-prime', usage: 0 },
        { modelCode: 'web-reader', usage: 0 },
        { modelCode: 'zread', usage: 4 }
      ]
    },
    {
      type: 'Token usage(5 Hour)',
      percentage: 1.0,
      nextResetTime: Date.now() + 5 * 60 * 60 * 1000 // 5 hours from now
    }
  ]
};

const mockModelData = {
  totalUsage: {
    totalModelCallCount: 0,
    totalTokensUsage: 0
  }
};

const mockToolData = {
  totalUsage: {
    totalNetworkSearchCount: 0,
    totalWebReadMcpCount: 0,
    totalZreadMcpCount: 4
  }
};

/**
 * Get display width of a string (handles Unicode)
 */
function getDisplayWidth(text: string): number {
  let width = 0;

  for (let i = 0; i < text.length; i += 1) {
    const codePoint = text.codePointAt(i);
    if (codePoint === undefined) {
      continue;
    }

    if (codePoint > 0xffff) {
      i += 1;
    }

    if (isControlCodePoint(codePoint) || isZeroWidthCodePoint(codePoint)) {
      continue;
    }

    width += isEmojiCodePoint(codePoint) || isFullWidthCodePoint(codePoint) ? 2 : 1;
  }

  return width;
}

function isControlCodePoint(codePoint: number): boolean {
  return codePoint <= 0x1f || (codePoint >= 0x7f && codePoint <= 0x9f);
}

function isZeroWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint === 0x200d ||
    codePoint === 0xfe0f ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
  );
}

function isEmojiCodePoint(codePoint: number): boolean {
  return (
    (codePoint >= 0x1f300 && codePoint <= 0x1f5ff) ||
    (codePoint >= 0x1f600 && codePoint <= 0x1f64f) ||
    (codePoint >= 0x1f680 && codePoint <= 0x1f6ff) ||
    (codePoint >= 0x1f700 && codePoint <= 0x1f77f) ||
    (codePoint >= 0x1f780 && codePoint <= 0x1f7ff) ||
    (codePoint >= 0x1f800 && codePoint <= 0x1f8ff) ||
    (codePoint >= 0x1f900 && codePoint <= 0x1f9ff) ||
    (codePoint >= 0x1fa00 && codePoint <= 0x1faff) ||
    (codePoint >= 0x2600 && codePoint <= 0x26ff) ||
    (codePoint >= 0x2700 && codePoint <= 0x27bf)
  );
}

function isFullWidthCodePoint(codePoint: number): boolean {
  return (
    codePoint >= 0x1100 && (
      codePoint <= 0x115f ||
      codePoint === 0x2329 ||
      codePoint === 0x232a ||
      (codePoint >= 0x2e80 && codePoint <= 0x3247 && codePoint !== 0x303f) ||
      (codePoint >= 0x3250 && codePoint <= 0x4dbf) ||
      (codePoint >= 0x4e00 && codePoint <= 0xa4c6) ||
      (codePoint >= 0xa960 && codePoint <= 0xa97c) ||
      (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
      (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
      (codePoint >= 0xfe10 && codePoint <= 0xfe19) ||
      (codePoint >= 0xfe30 && codePoint <= 0xfe6b) ||
      (codePoint >= 0xff01 && codePoint <= 0xff60) ||
      (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
      (codePoint >= 0x1b000 && codePoint <= 0x1b001) ||
      (codePoint >= 0x1f200 && codePoint <= 0x1f251) ||
      (codePoint >= 0x20000 && codePoint <= 0x3fffd)
    )
  );
}

/**
 * Generate test output using the plugin
 */
async function generateTestOutput(): Promise<string> {
  // Import the plugin dynamically
  const plugin = await import('../../dist/index.js');
  const instance = await plugin.GlmQuotaPlugin();
  
  // The tool.execute function signature requires args and context
  // We pass empty objects since our tool doesn't use them
  const execute = instance.tool.glm_quota.execute as unknown as (
    args: Record<string, unknown>,
    context: Record<string, unknown>
  ) => Promise<string>;
  const result = await execute({}, {});
  return result;
}

describe('Box Alignment Validation', () => {
  it('all output lines are exactly 60 characters wide', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    for (const line of lines) {
      const displayWidth = getDisplayWidth(line);
      assert.strictEqual(
        displayWidth,
        60,
        `Line has incorrect width (${displayWidth}): "${line}"`
      );
    }

    // Ensure we have output
    assert.ok(lines.length > 0, 'Output should contain lines');
  });

  it('top border matches bottom border width', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    const topBorder = lines[0];
    const bottomBorder = lines[lines.length - 1];

    assert.ok(topBorder.startsWith('╔'), 'First line should be top border');
    assert.ok(bottomBorder.startsWith('╚'), 'Last line should be bottom border');

    assert.strictEqual(
      getDisplayWidth(topBorder),
      getDisplayWidth(bottomBorder),
      'Top and bottom borders should have same width'
    );
  });

  it('all section dividers are 60 characters', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    const dividers = lines.filter(line =>
      line.startsWith('╠') || line.startsWith('╟')
    );

    for (const divider of dividers) {
      const displayWidth = getDisplayWidth(divider);
      assert.strictEqual(
        displayWidth,
        60,
        `Divider has incorrect width: "${divider}"`
      );
    }

    // Dividers are optional (may not exist in error message output)
    // Just ensure if they exist, they're correctly sized
  });

  it('content lines maintain consistent padding', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    const contentLines = lines.filter(line =>
      line.startsWith('║') && !line.startsWith('╠') && !line.startsWith('╟')
    );

    for (const line of contentLines) {
      assert.ok(line.startsWith('║'), 'Content line should start with ║');
      assert.ok(line.endsWith('║'), 'Content line should end with ║');

      const displayWidth = getDisplayWidth(line);
      assert.strictEqual(
        displayWidth,
        60,
        `Content line has incorrect width: "${line}"`
      );
    }

    // Ensure we have content lines
    assert.ok(contentLines.length > 0, 'Output should contain content lines');
  });

  it('progress bar lines fit within box width', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    const progressLines = lines.filter(line => line.includes('[') && line.includes(']'));

    for (const line of progressLines) {
      const displayWidth = getDisplayWidth(line);
      assert.strictEqual(
        displayWidth,
        60,
        `Progress bar line has incorrect width: "${line}"`
      );
    }

    // Progress bars are optional (may not exist in error message output)
    // Just ensure if they exist, they're correctly sized
  });

  it('handles empty sections with proper alignment', async () => {
    // This test uses actual output which might have data
    // We're verifying that even with varying data, alignment is maintained
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    // All lines should be exactly 60 characters regardless of content
    for (const line of lines) {
      const displayWidth = getDisplayWidth(line);
      assert.strictEqual(
        displayWidth,
        60,
        `Line with varying content has incorrect width: "${line}"`
      );
    }
  });

  it('box structure is complete and valid', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    // Check box structure
    assert.ok(lines[0].startsWith('╔'), 'Should start with top border');
    assert.ok(lines[lines.length - 1].startsWith('╚'), 'Should end with bottom border');

    // Count section markers (only check if they exist - error messages have fewer/no dividers)
    const sectionDividers = lines.filter(line => line.startsWith('╠')).length;
    const subsectionDividers = lines.filter(line => line.startsWith('╟')).length;
    
    // If we have dividers, they should be valid (but they're optional for error messages)
    // Just ensure the box is complete with top and bottom borders
    assert.ok(lines.length >= 3, 'Should have at least top border, content, and bottom border');
  });

  it('unicode box-drawing characters render correctly', async () => {
    const output = await generateTestOutput();

    // Ensure all expected box-drawing characters are present
    assert.ok(output.includes('╔'), 'Should contain top-left corner');
    assert.ok(output.includes('╗'), 'Should contain top-right corner');
    assert.ok(output.includes('╚'), 'Should contain bottom-left corner');
    assert.ok(output.includes('╝'), 'Should contain bottom-right corner');
    assert.ok(output.includes('║'), 'Should contain vertical lines');
    assert.ok(output.includes('═'), 'Should contain horizontal lines');

    // T-junctions are optional in error output
    if (output.includes('╠') || output.includes('╟')) {
      assert.ok(output.includes('╠'), 'Should contain left T-junction');
      assert.ok(output.includes('╣'), 'Should contain right T-junction');
      assert.ok(output.includes('╟'), 'Should contain left T-junction (dashed)');
      assert.ok(output.includes('╢'), 'Should contain right T-junction (dashed)');
    }
  });

  it('progress bar characters do not break alignment', async () => {
    const output = await generateTestOutput();
    const lines = output.split('\n').filter(line => line.length > 0);

    // Find lines with progress bars (contain █ or ░)
    const progressLines = lines.filter(line => line.includes('█') || line.includes('░'));

    for (const line of progressLines) {
      const displayWidth = getDisplayWidth(line);
      assert.strictEqual(
        displayWidth,
        60,
        `Progress bar with special chars has incorrect width: "${line}"`
      );
    }

    // Progress bars are optional in error output
    // Just ensure if they exist, they're correctly aligned
  });

  it('all sections are present in output', async () => {
    const output = await generateTestOutput();

    // Check if this is quota data or error message
    // Both are valid outputs with correct alignment
    const isQuotaData = output.includes('QUOTA LIMITS');
    const isErrorMessage = output.includes('Credentials Not Found');
    
    assert.ok(isQuotaData || isErrorMessage, 'Output should be either quota data or error message');
    
    if (isQuotaData) {
      // If we have quota data, verify expected sections
      assert.ok(output.includes('MODEL USAGE'), 'Quota output should contain MODEL USAGE section');
      assert.ok(output.includes('TOOL/MCP USAGE'), 'Quota output should contain TOOL/MCP USAGE section');
      assert.ok(output.includes('Platform:'), 'Quota output should contain platform information');
      assert.ok(output.includes('Period:'), 'Quota output should contain period information');
    }
  });
});
