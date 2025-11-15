/**
 * Defensive parser for BLE message streams
 * Safely extracts JSON and text messages from a buffered stream
 */

/**
 * Parse a single incoming message (JSON or plain text)
 * @param {string} raw - Raw message string
 * @returns {object} { kind: 'json' | 'text', data: object | string }
 */
export const parseIncoming = (raw) => {
  if (!raw || typeof raw !== 'string') {
    return { kind: 'text', data: String(raw) };
  }

  const trimmed = raw.trim();
  
  // Try JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed);
      return { kind: 'json', data };
    } catch (e) {
      // Malformed JSON, treat as text
      return { kind: 'text', data: trimmed };
    }
  }

  // Plain text
  return { kind: 'text', data: trimmed };
};

/**
 * Process a buffered stream of messages
 * Extracts complete JSON objects and remaining text
 * @param {object} bufferRef - Reference object with current buffer string
 * @returns {array} Array of parsed messages { kind, data, ts_received }
 */
export const processStream = (bufferRef) => {
  const messages = [];
  let buffer = bufferRef.current || '';
  let i = 0;

  while (i < buffer.length) {
    // Skip whitespace
    while (i < buffer.length && /\s/.test(buffer[i])) {
      i++;
    }

    if (i >= buffer.length) break;

    // Look for JSON object
    if (buffer[i] === '{') {
      let braceCount = 0;
      let start = i;
      let foundEnd = false;

      while (i < buffer.length) {
        if (buffer[i] === '{') braceCount++;
        if (buffer[i] === '}') braceCount--;

        if (braceCount === 0 && buffer[i] === '}') {
          i++;
          foundEnd = true;
          break;
        }
        i++;
      }

      if (foundEnd) {
        const jsonStr = buffer.substring(start, i).trim();
        const parsed = parseIncoming(jsonStr);
        if (parsed.kind === 'json') {
          messages.push(parsed);
        } else {
          // Even if JSON parsing failed, add as text message
          messages.push(parsed);
        }
      } else {
        // Incomplete JSON, wait for more data
        break;
      }
    } else {
      // Plain text message (until next newline or special char)
      let end = i;
      while (end < buffer.length && buffer[end] !== '\n' && buffer[end] !== '{') {
        end++;
      }

      if (end > i) {
        const text = buffer.substring(i, end).trim();
        if (text) {
          messages.push({ kind: 'text', data: text });
        }
        i = end;
      } else {
        i++;
      }
    }
  }

  // Keep unconsumed data in buffer
  bufferRef.current = buffer.substring(i).trim();

  return messages;
};

/**
 * Format time in mm:ss.SS format
 * @param {number} ms - Milliseconds since start
 * @returns {string} Formatted time string
 */
export const formatTime = (ms) => {
  if (!ms || ms < 0) return '00:00.00';

  const totalSeconds = Math.floor(ms / 1000);
  const centiseconds = Math.floor((ms % 1000) / 10);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
};

/**
 * Get node status color based on lastSeen timestamp
 * @param {number} lastSeenMs - Timestamp of last message
 * @returns {string} Color code: 'green' | 'orange' | 'red'
 */
export const getNodeStatusColor = (lastSeenMs) => {
  if (!lastSeenMs) return 'red';

  const ageMs = Date.now() - lastSeenMs;
  const ageSeconds = ageMs / 1000;

  if (ageSeconds < 30) return 'green';
  if (ageSeconds < 120) return 'orange';
  return 'red';
};

/**
 * Compute speed from distance and time
 * @param {number} distanceM - Distance in meters
 * @param {number} timeS - Time in seconds
 * @returns {object} { speedMps, speedKmh }
 */
export const computeSpeed = (distanceM, timeS) => {
  if (!distanceM || !timeS || timeS === 0) {
    return { speedMps: 0, speedKmh: 0 };
  }

  const speedMps = distanceM / timeS;
  const speedKmh = (speedMps * 3600) / 1000;

  return { speedMps, speedKmh };
};
