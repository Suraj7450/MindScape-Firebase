/**
 * Represents a user of the application, mirroring the Firestore document schema.
 */
export interface User {
  id: string;
  email: string;
  username: string;
}
