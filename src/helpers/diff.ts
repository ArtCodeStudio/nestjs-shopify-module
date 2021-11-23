export type DiffType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'symbol'
  | 'undefined'
  | 'object'
  | 'function'
  | 'array'
  | 'date'
  | 'bigint';

export interface Change {
  path: string;
  operation: string;
  value?: any;
}

/**
 * Get diff of two objects
 */
export function getDiff(a: any, b: any): Array<Change> {
  const changes: Array<Change> = [];
  let bType: DiffType = typeof b;
  let aType: DiffType = typeof a;
  if (bType === 'object') {
    if (Array.isArray(b)) {
      bType = 'array';
    } else if (
      Object.prototype.toString.call(b) === '[object Date]' &&
      !isNaN(b.getTime())
    ) {
      bType = 'date';
    }
  }
  if (aType === 'object') {
    if (Array.isArray(a)) {
      aType = 'array';
      if (bType === 'array') {
        let aSmaller = false;
        let minLen, maxLen;
        if (a.length < b.length) {
          aSmaller = true;
          minLen = a.length;
          maxLen = b.length;
        } else {
          minLen = b.length;
          maxLen = a.length;
        }
        for (let key = 0; key < minLen; key++) {
          getDiff(a[key], b[key]).forEach((change) => {
            change.path =
              change.path !== '' ? key + '.' + change.path : key.toString();
            changes.push(change);
          });
        }
        if (aSmaller) {
          for (let key = minLen; key < maxLen; key++) {
            changes.push({
              path: key.toString(),
              operation: 'add',
              value: b[key],
            });
          }
        } else {
          for (let key = minLen; key < maxLen; key++) {
            changes.push({ path: key.toString(), operation: 'delete' });
          }
        }
        return changes;
      } else {
        return [{ path: '', operation: 'update', value: b }];
      }
    } else if (
      Object.prototype.toString.call(a) === '[object Date]' &&
      !isNaN(a.getTime())
    ) {
      aType = 'date';
      if (bType === 'date' && b.toISOString() === a.toISOString()) {
        return [];
      }
      return [{ path: '', operation: 'update', value: b }];
    } else if (a !== null && bType === 'object' && b !== null) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of keys) {
        if (key in a) {
          if (key in b) {
            getDiff(a[key], b[key]).forEach((change) => {
              change.path = change.path !== '' ? key + '.' + change.path : key;
              changes.push(change);
            });
          } else {
            changes.push({ path: key, operation: 'delete' });
          }
        } else if (key in b) {
          changes.push({ path: key, operation: 'add', value: b[key] });
        }
      }
      return changes;
    } else {
      return a === b ? [] : [{ path: '', operation: 'update', value: b }];
    }
  } else {
    return a === b ? [] : [{ path: '', operation: 'update', value: b }];
  }
  // console.error(`This should not be happening...`);
}
