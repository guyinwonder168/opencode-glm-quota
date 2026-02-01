/**
 * JSON Parse Error Handling Tests
 * Tests for invalid JSON responses and malformed content
 * Following TDD methodology with AAA pattern
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

// Import the parse error formatting function (will be created in client.ts)
import { formatParseError } from '../../src/api/client.js';

describe('JSON Parse Error Handling', () => {
  describe('formatParseError', () => {
    it('should format parse error with boxed message', () => {
      // Arrange
      const responseBody = 'This is not JSON';
      const authToken = 'test-token';

      // Act
      const formatted = formatParseError(responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Invalid JSON'), 'Should mention invalid JSON');
      assert.ok(formatted.message.includes('╔'), 'Should have top border');
      assert.ok(formatted.message.includes('║'), 'Should have side borders');
      assert.ok(formatted.message.includes('╚'), 'Should have bottom border');
    });

    it('should create 60-character wide boxed error', () => {
      // Arrange
      const responseBody = '<html>Not JSON</html>';
      const authToken = 'test-token';

      // Act
      const formatted = formatParseError(responseBody, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL, 'Top border should be 60 chars');
      assert.strictEqual(lines[lines.length - 1].length, BOX_WIDTH.TOTAL, 'Bottom border should be 60 chars');
      
      // All lines should be exactly 60 characters
      for (const line of lines) {
        assert.strictEqual(line.length, BOX_WIDTH.TOTAL, 'All lines should be 60 chars');
      }
    });

    it('should sanitize token from parse error response body', () => {
      // Arrange
      const authToken = 'sk-secret-parse-123';
      const responseBody = `Invalid JSON with token ${authToken} exposed`;

      // Act
      const formatted = formatParseError(responseBody, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken), 'Should not contain raw token');
      assert.ok(formatted.message.includes('***'), 'Should contain sanitization marker');
    });

    it('should truncate very long invalid response bodies', () => {
      // Arrange
      const longResponse = 'A'.repeat(500) + ' not JSON';
      const authToken = 'test-token';

      // Act
      const formatted = formatParseError(longResponse, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      
      // All lines should be exactly 60 characters
      for (const line of lines) {
        assert.strictEqual(line.length, BOX_WIDTH.TOTAL, 'All lines should be 60 chars');
      }
      
      // Should mention invalid JSON
      assert.ok(formatted.message.includes('Invalid JSON'), 'Should mention invalid JSON');
    });

    it('should handle empty response body', () => {
      // Arrange
      const responseBody = '';
      const authToken = 'test-token';

      // Act
      const formatted = formatParseError(responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Invalid JSON'), 'Should mention invalid JSON');
      assert.ok(formatted.message.includes('╔'), 'Should be boxed');
    });

    it('should handle malformed JSON with syntax errors', () => {
      // Arrange
      const responseBody = '{"incomplete": "json"';
      const authToken = 'test-token';

      // Act
      const formatted = formatParseError(responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Invalid JSON'), 'Should mention invalid JSON');
      assert.ok(formatted.message.includes('╔'), 'Should be boxed');
    });
  });
});
