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
 * Handles fragmented JSON by waiting for complete braces
 * @param {object} bufferRef - Reference object with current buffer string
 * @param {boolean} flush - Force process incomplete messages (for timeout)
 * @returns {array} Array of parsed messages { kind, data, ts_received }
 */
export const processStream = (bufferRef, flush = false) => {
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
        // Incomplete JSON
        if (flush) {
          // Force parse what we have if timeout triggered
          const jsonStr = buffer.substring(start).trim();
          try {
            const data = JSON.parse(jsonStr);
            messages.push({ kind: 'json', data });
            i = buffer.length; // Consume all
          } catch (e) {
            // Can't parse even with forced flush, keep waiting
            console.warn('⏳ Incomplete JSON even after timeout:', jsonStr.substring(0, 50) + '...');
            // Don't advance i, keep the incomplete JSON in buffer for next chunk
            break;
          }
        } else {
          // Wait for more data
          break;
        }
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

  // Keep unconsumed data in buffer (only trim if we actually consumed something)
  // If we didn't consume anything and got no messages, keep the exact buffer as-is
  if (i > 0) {
    bufferRef.current = buffer.substring(i).trim();
  }
  // If i === 0 and messages.length === 0, keep bufferRef.current unchanged

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

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) {
    return null;
  }
  
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => deg * (Math.PI / 180);
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

/**
 * Format distance for display
 * @param {number} distanceM - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distanceM) => {
  if (distanceM == null || isNaN(distanceM)) {
    return '--';
  }
  
  if (distanceM < 1000) {
    return `${Math.round(distanceM)}m`;
  }
  
  return `${(distanceM / 1000).toFixed(2)}km`;
};
