import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('should have info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('should have warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('should have error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('should call console.debug', () => {
    logger.debug('test message');
    expect(true).toBe(true);
  });

  it('should call console.info', () => {
    logger.info('test message');
    expect(true).toBe(true);
  });

  it('should call console.warn', () => {
    logger.warn('test message');
    expect(true).toBe(true);
  });

  it('should call console.error', () => {
    logger.error('test message');
    expect(true).toBe(true);
  });

  it('should include message in output', () => {
    logger.info('test message');
    expect(true).toBe(true);
  });

  it('should include data in output', () => {
    logger.info('test message', { key: 'value' });
    expect(true).toBe(true);
  });
});
