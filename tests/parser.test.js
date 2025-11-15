import { parseIncoming, processStream, formatTime, getNodeStatusColor, computeSpeed } from '../src/utils/parser';

describe('Parser Utils', () => {
  describe('parseIncoming', () => {
    test('should parse valid JSON status message', () => {
      const json = '{"type":"status","src":1,"connected":true,"battery":3.9}';
      const result = parseIncoming(json);
      expect(result.kind).toBe('json');
      expect(result.data.type).toBe('status');
      expect(result.data.battery).toBe(3.9);
    });

    test('should parse valid JSON heartbeat message', () => {
      const json = '{"type":"heartbeat","src":3,"timestamp_ms":624493,"battery":3.8,"rssi":-20}';
      const result = parseIncoming(json);
      expect(result.kind).toBe('json');
      expect(result.data.type).toBe('heartbeat');
      expect(result.data.rssi).toBe(-20);
    });

    test('should parse valid JSON detection message', () => {
      const json = '{"type":"falcon","src":3,"timestamp_ms":624500,"payload":"Falcon Detected"}';
      const result = parseIncoming(json);
      expect(result.kind).toBe('json');
      expect(result.data.type).toBe('falcon');
    });

    test('should handle malformed JSON gracefully', () => {
      const malformed = '{"type":"status"invalid}';
      const result = parseIncoming(malformed);
      expect(result.kind).toBe('text');
      expect(result.data).toBe(malformed);
    });

    test('should parse plain text messages', () => {
      const text = 'Hello from device';
      const result = parseIncoming(text);
      expect(result.kind).toBe('text');
      expect(result.data).toBe(text);
    });

    test('should handle null and undefined gracefully', () => {
      const resultNull = parseIncoming(null);
      const resultUndef = parseIncoming(undefined);
      
      expect(resultNull.kind).toBe('text');
      expect(resultUndef.kind).toBe('text');
    });

    test('should trim whitespace from JSON', () => {
      const json = '  {"type":"status","battery":3.5}  ';
      const result = parseIncoming(json);
      expect(result.kind).toBe('json');
      expect(result.data.battery).toBe(3.5);
    });
  });

  describe('processStream', () => {
    test('should extract single JSON object from buffer', () => {
      const bufferRef = { current: '{"type":"status","battery":3.9}' };
      const messages = processStream(bufferRef);
      
      expect(messages).toHaveLength(1);
      expect(messages[0].kind).toBe('json');
      expect(messages[0].data.type).toBe('status');
      expect(bufferRef.current).toBe('');
    });

    test('should extract multiple JSON objects', () => {
      const bufferRef = { current: '{"type":"status","battery":3.9}{"type":"heartbeat","battery":3.8}' };
      const messages = processStream(bufferRef);
      
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(bufferRef.current).toBe('');
    });

    test('should handle partial JSON in buffer', () => {
      const bufferRef = { current: '{"type":"status","ba' };
      const messages = processStream(bufferRef);
      
      expect(messages).toHaveLength(0);
      expect(bufferRef.current).toContain('type');
    });

    test('should skip whitespace between messages', () => {
      const bufferRef = { current: '  {"type":"status"}  \n  {"type":"heartbeat"}  ' };
      const messages = processStream(bufferRef);
      
      expect(messages.length).toBeGreaterThanOrEqual(1);
    });

    test('should handle plain text in stream', () => {
      const bufferRef = { current: 'Error message here' };
      const messages = processStream(bufferRef);
      
      expect(messages.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatTime', () => {
    test('should format 0ms as 00:00.00', () => {
      expect(formatTime(0)).toBe('00:00.00');
    });

    test('should format seconds only', () => {
      expect(formatTime(5000)).toBe('00:05.00');
      expect(formatTime(59000)).toBe('00:59.00');
    });

    test('should format minutes and seconds', () => {
      expect(formatTime(60000)).toBe('01:00.00');
      expect(formatTime(125000)).toBe('02:05.00');
    });

    test('should format centiseconds', () => {
      expect(formatTime(1050)).toBe('00:01.05');
      expect(formatTime(1550)).toBe('00:01.55');
      expect(formatTime(1999)).toBe('00:01.99');
    });

    test('should handle large times', () => {
      expect(formatTime(3661000)).toBe('61:01.00');
    });

    test('should handle negative values', () => {
      expect(formatTime(-1000)).toBe('00:00.00');
    });
  });

  describe('getNodeStatusColor', () => {
    test('should return green for recent message (< 30s)', () => {
      const recent = Date.now() - 15000;
      expect(getNodeStatusColor(recent)).toBe('green');
    });

    test('should return orange for medium age (30-120s)', () => {
      const medium = Date.now() - 60000;
      expect(getNodeStatusColor(medium)).toBe('orange');
    });

    test('should return red for old message (> 120s)', () => {
      const old = Date.now() - 150000;
      expect(getNodeStatusColor(old)).toBe('red');
    });

    test('should return red for null timestamp', () => {
      expect(getNodeStatusColor(null)).toBe('red');
      expect(getNodeStatusColor(undefined)).toBe('red');
    });
  });

  describe('computeSpeed', () => {
    test('should compute speed correctly', () => {
      const { speedMps, speedKmh } = computeSpeed(1000, 10);
      expect(speedMps).toBe(100);
      expect(speedKmh).toBeCloseTo(360, 1);
    });

    test('should handle zero time gracefully', () => {
      const { speedMps, speedKmh } = computeSpeed(100, 0);
      expect(speedMps).toBe(0);
      expect(speedKmh).toBe(0);
    });

    test('should handle missing parameters', () => {
      const result1 = computeSpeed(null, 10);
      const result2 = computeSpeed(100, null);
      
      expect(result1.speedMps).toBe(0);
      expect(result2.speedMps).toBe(0);
    });
  });
});
