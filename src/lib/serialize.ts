/**
 * Safely converts an object with non-serializable data (like Firestore Timestamps)
 * into a plain JavaScript object that can be passed to Next.js Server Actions.
 */
export function toPlainObject<T>(obj: T): T {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
}
