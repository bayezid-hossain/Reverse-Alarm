/**
 * Custom lightweight ID generator to avoid 'uuid' and 'crypto' dependencies
 * that can fail in certain React Native / Expo environments.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
}
