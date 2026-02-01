/**
 * API Error Handling Tests
 * Tests for HTTP 429 rate limiting and 500+ server errors
 * Following TDD methodology with AAA pattern
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatApiError } from '../../src/api/client.js';
import { BOX_WIDTH } from '../../src/utils/box-constants.js';

describe('API Error Handling', () => {
  describe('formatApiError - 429 Rate Limit', () => {
    it('should format 429 error with boxed message', () => {
      // Arrange
      const statusCode = 429;
      const responseBody = 'Too Many Requests';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Too many requests'));
      assert.ok(formatted.message.includes('╔')); // Has box drawing chars
      assert.ok(formatted.message.includes('║'));
      assert.ok(formatted.message.includes('╚'));
    });

    it('should include helpful message for 429 errors', () => {
      // Arrange
      const statusCode = 429;
      const responseBody = 'Rate limit exceeded';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Too many requests'));
      assert.ok(formatted.message.includes('Please try again later'));
    });

    it('should sanitize token from 429 error messages', () => {
      // Arrange
      const authToken = 'sk-secret-789';
      const statusCode = 429;
      const responseBody = `Rate limit exceeded for token ${authToken}`;

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken));
      assert.ok(formatted.message.includes('***'));
    });

    it('should create 60-character wide boxed error for 429', () => {
      // Arrange
      const statusCode = 429;
      const responseBody = 'Rate limit exceeded';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL); // Top border
      assert.strictEqual(lines[lines.length - 1].length, BOX_WIDTH.TOTAL); // Bottom border
    });
  });

  describe('formatApiError - 500+ Server Errors', () => {
    it('should format 500 error with boxed message', () => {
      // Arrange
      const statusCode = 500;
      const responseBody = 'Internal Server Error';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Server error'));
      assert.ok(formatted.message.includes('╔')); // Has box drawing chars
      assert.ok(formatted.message.includes('║'));
      assert.ok(formatted.message.includes('╚'));
    });

    it('should include helpful message for 500+ errors', () => {
      // Arrange
      const statusCode = 503;
      const responseBody = 'Service Unavailable';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Server error'));
      assert.ok(formatted.message.includes('Please try again later'));
    });

    it('should sanitize token from 500+ error messages', () => {
      // Arrange
      const authToken = 'sk-secret-999';
      const statusCode = 502;
      const responseBody = `Bad Gateway: authentication with token ${authToken} failed`;

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken));
      assert.ok(formatted.message.includes('***'));
    });

    it('should create 60-character wide boxed error for 500+', () => {
      // Arrange
      const statusCode = 500;
      const responseBody = 'Internal Server Error';
      const authToken = 'test-token';

      // Act
      const formatted = formatApiError(statusCode, responseBody, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      assert.strictEqual(lines[0].length, BOX_WIDTH.TOTAL); // Top border
      assert.strictEqual(lines[lines.length - 1].length, BOX_WIDTH.TOTAL); // Bottom border
    });
  });
});
