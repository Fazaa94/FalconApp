import { formatTime } from '../src/utils/parser';

describe('formatTime', () => {
  test('should format zero milliseconds', () => {
    expect(formatTime(0)).toBe('00:00.00');
  });

  test('should format seconds without minutes', () => {
    expect(formatTime(1000)).toBe('00:01.00');
    expect(formatTime(30000)).toBe('00:30.00');
    expect(formatTime(59000)).toBe('00:59.00');
  });

  test('should format minutes and seconds', () => {
    expect(formatTime(60000)).toBe('01:00.00');
    expect(formatTime(125000)).toBe('02:05.00');
    expect(formatTime(599000)).toBe('09:59.00');
  });

  test('should format centiseconds correctly', () => {
    expect(formatTime(100)).toBe('00:00.10');
    expect(formatTime(150)).toBe('00:00.15');
    expect(formatTime(999)).toBe('00:00.99');
    expect(formatTime(1050)).toBe('00:01.05');
  });

  test('should handle edge cases at boundaries', () => {
    expect(formatTime(1999)).toBe('00:01.99');
    expect(formatTime(2000)).toBe('00:02.00');
    expect(formatTime(59999)).toBe('00:59.99');
    expect(formatTime(60000)).toBe('01:00.00');
  });

  test('should format large times correctly', () => {
    expect(formatTime(3661000)).toBe('61:01.00');
    expect(formatTime(359999000)).toBe('5999:59.99');
  });

  test('should handle negative values gracefully', () => {
    expect(formatTime(-1000)).toBe('00:00.00');
    expect(formatTime(-100000)).toBe('00:00.00');
  });

  test('should handle null and undefined', () => {
    expect(formatTime(null)).toBe('00:00.00');
    expect(formatTime(undefined)).toBe('00:00.00');
  });

  test('should round centiseconds down', () => {
    expect(formatTime(1005)).toBe('00:01.00');
    expect(formatTime(1009)).toBe('00:01.00');
    expect(formatTime(1014)).toBe('00:01.01');
  });
});
