/**
 * Network Error Handling Tests
 * Tests for network-related errors (timeout, connection refused, etc.)
 * Following TDD methodology with AAA pattern
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatNetworkError, createBoxedError } from '../../src/api/client.js';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

/**
 * Network error with code property
 */
interface NetworkError extends Error {
  code?: string;
}

describe('Network Error Handling', () => {
  describe('formatNetworkError', () => {
    it('should format ETIMEDOUT error with boxed message', () => {
      // Arrange
      const mockError = Object.assign(new Error('Request timeout'), {
        code: 'ETIMEDOUT'
      });
      const authToken = 'test-token';

      // Act
      const formatted = formatNetworkError(mockError, authToken);

      // Assert
      assert.ok(formatted.message.includes('Request timed out'));
      assert.strictEqual((formatted as NetworkError).code, 'ETIMEDOUT');
    });

    it('should format ECONNREFUSED error with boxed message', () => {
      // Arrange
      const mockError = Object.assign(new Error('Connection refused'), {
        code: 'ECONNREFUSED'
      });
      const authToken = 'test-token';

      // Act
      const formatted = formatNetworkError(mockError, authToken);

      // Assert
      assert.ok(formatted.message.includes('Unable to connect to server'));
      assert.strictEqual((formatted as NetworkError).code, 'ECONNREFUSED');
    });

    it('should sanitize token for other error types', () => {
      // Arrange
      const authToken = 'sk-secret-123';
      const mockError = Object.assign(new Error(`Error with token ${authToken}`), {
        code: 'ENOTFOUND'
      });

      // Act
      const formatted = formatNetworkError(mockError, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken));
      assert.ok(formatted.message.includes('***'));
    });

    it('should preserve error code in formatted errors', () => {
      // Arrange
      const mockError = Object.assign(new Error('Some error'), {
        code: 'ETIMEDOUT'
      });

      // Act
      const formatted = formatNetworkError(mockError, 'token');

      // Assert
      assert.strictEqual((formatted as NetworkError).code, 'ETIMEDOUT');
    });
  });

  describe('createBoxedError', () => {
    it('should create boxed error with 60-character width', () => {
      // Arrange
      const message = 'Request timed out. Please try again.';

      // Act
      const boxed = createBoxedError(message);

      // Assert
      const lines = boxed.split('\n');
      assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL); // Top border
      assert.strictEqual(lines[lines.length - 1].length, BOX_WIDTH.TOTAL); // Bottom border
    });

    it('should include box drawing characters', () => {
      // Arrange
      const message = 'Test message';

      // Act
      const boxed = createBoxedError(message);

      // Assert
      assert.ok(boxed.includes('╔'));
      assert.ok(boxed.includes('║'));
      assert.ok(boxed.includes('╚'));
    });

    it('should wrap long messages across multiple lines', () => {
      // Arrange
      const message = 'This is a very long error message that should wrap across multiple lines in the boxed format';

      // Act
      const boxed = createBoxedError(message);

      // Assert
      const lines = boxed.split('\n');
      assert.ok(lines.length > 3); // Top + content lines + bottom
      lines.forEach(line => {
        assert.strictEqual(line.length, BOX_WIDTH.TOTAL);
      });
    });
  });
});
