/**
 * Authentication Error Handling Tests
 * Tests for HTTP 401/403 authentication errors
 * Following TDD methodology with AAA pattern
 */

import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { formatAuthError } from '../../src/api/client.js';

describe('Authentication Error Handling', () => {
  describe('formatAuthError - 401 Unauthorized', () => {
    it('should format 401 error with boxed message', () => {
      // Arrange
      const statusCode = 401;
      const responseBody = 'Unauthorized';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Authentication failed'));
      assert.ok(formatted.message.includes('╔')); // Has box drawing chars
      assert.ok(formatted.message.includes('║'));
      assert.ok(formatted.message.includes('╚'));
    });

    it('should include helpful message for 401 errors', () => {
      // Arrange
      const statusCode = 401;
      const responseBody = 'Unauthorized';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Authentication failed'));
      assert.ok(formatted.message.includes('Please check your credentials'));
    });

    it('should sanitize token from 401 error messages', () => {
      // Arrange
      const authToken = 'sk-secret-123';
      const statusCode = 401;
      const responseBody = `Unauthorized: Invalid token ${authToken}`;

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken));
      assert.ok(formatted.message.includes('***'));
    });

    it('should create 60-character wide boxed error for 401', () => {
      // Arrange
      const statusCode = 401;
      const responseBody = 'Unauthorized';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      assert.strictEqual(lines[0].length, 60); // Top border
      assert.strictEqual(lines[lines.length - 1].length, 60); // Bottom border
    });
  });

  describe('formatAuthError - 403 Forbidden', () => {
    it('should format 403 error with boxed message', () => {
      // Arrange
      const statusCode = 403;
      const responseBody = 'Forbidden';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Access denied'));
      assert.ok(formatted.message.includes('╔')); // Has box drawing chars
      assert.ok(formatted.message.includes('║'));
      assert.ok(formatted.message.includes('╚'));
    });

    it('should include helpful message for 403 errors', () => {
      // Arrange
      const statusCode = 403;
      const responseBody = 'Forbidden';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(formatted.message.includes('Access denied'));
      assert.ok(formatted.message.includes("You don't have permission"));
    });

    it('should sanitize token from 403 error messages', () => {
      // Arrange
      const authToken = 'sk-secret-456';
      const statusCode = 403;
      const responseBody = `Forbidden: Token ${authToken} lacks required permissions`;

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      assert.ok(!formatted.message.includes(authToken));
      assert.ok(formatted.message.includes('***'));
    });

    it('should create 60-character wide boxed error for 403', () => {
      // Arrange
      const statusCode = 403;
      const responseBody = 'Forbidden';
      const authToken = 'test-token';

      // Act
      const formatted = formatAuthError(statusCode, responseBody, authToken);

      // Assert
      const lines = formatted.message.split('\n');
      assert.strictEqual(lines[0].length, 60); // Top border
      assert.strictEqual(lines[lines.length - 1].length, 60); // Bottom border
    });
  });
});
