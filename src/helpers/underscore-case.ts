/**
 * E.g. converts `smartCollections` to `smart_collections`
 */
export function underscoreCase(str: string) {
  return str.split(/(?=[A-Z])/).join('_').toLowerCase();
}