/**
 * Firebase Cloud Functions for MindScape - Secure API Key Management
 * 
 * These functions handle encrypted storage and usage of custom Gemini API keys.
 * Uses AES-256-GCM encryption with a server-side secret.
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");

admin.initializeApp();
const db = admin.firestore();

// Define the encryption key as a secret parameter
// Set this using: firebase functions:secrets:set ENCRYPTION_KEY
const ENCRYPTION_KEY = defineString("ENCRYPTION_KEY", {
    description: "32-byte hex string for AES-256 encryption of API keys",
});

/**
 * Encrypts plaintext using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {string} keyHex - 32-byte hex string key
 * @returns {{iv: string, encryptedData: string, authTag: string}}
 */
function encrypt(plaintext, keyHex) {
    const key = Buffer.from(keyHex, "hex");
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return {
        iv: iv.toString("hex"),
        encryptedData: encrypted,
        authTag: authTag,
    };
}

/**
 * Decrypts ciphertext using AES-256-GCM
 * @param {{iv: string, encryptedData: string, authTag: string}} encrypted
 * @param {string} keyHex - 32-byte hex string key
 * @returns {string} - Decrypted plaintext
 */
function decrypt(encrypted, keyHex) {
    const key = Buffer.from(keyHex, "hex");
    const iv = Buffer.from(encrypted.iv, "hex");
    const authTag = Buffer.from(encrypted.authTag, "hex");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted.encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

/**
 * Validates Gemini API key format
 * @param {string} apiKey 
 * @returns {boolean}
 */
function isValidApiKeyFormat(apiKey) {
    // Gemini API keys typically start with 'AIza' and are ~39 characters
    return apiKey &&
        typeof apiKey === "string" &&
        apiKey.length >= 30 &&
        apiKey.length <= 50;
}

/**
 * Store user's custom API key (encrypted)
 * 
 * Called when user saves their API key in the profile settings.
 */
exports.storeUserApiKey = onCall({ cors: true }, async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const uid = request.auth.uid;
    const apiKey = (request.data.apiKey || "").trim();

    // Validate API key format
    if (!isValidApiKeyFormat(apiKey)) {
        throw new HttpsError(
            "invalid-argument",
            "Invalid API key format. Please check your Gemini API key."
        );
    }

    try {
        // Encrypt the API key
        const encryptionKey = ENCRYPTION_KEY.value();
        const encrypted = encrypt(apiKey, encryptionKey);

        // Store encrypted key in Firestore
        await db.doc(`users/${uid}/secrets/apiKey`).set({
            ...encrypted,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update user settings to enable custom key
        await db.doc(`users/${uid}`).set({
            apiSettings: {
                useCustomApiKey: true,
                hasStoredKey: true,
            },
        }, { merge: true });

        return { success: true, message: "API key stored securely." };
    } catch (error) {
        console.error("Error storing API key:", error);
        throw new HttpsError("internal", "Failed to store API key. Please try again.");
    }
});

/**
 * Delete user's custom API key
 * 
 * Called when user wants to remove their stored API key.
 */
exports.deleteUserApiKey = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const uid = request.auth.uid;

    try {
        // Delete the encrypted key
        await db.doc(`users/${uid}/secrets/apiKey`).delete();

        // Update user settings
        await db.doc(`users/${uid}`).set({
            apiSettings: {
                useCustomApiKey: false,
                hasStoredKey: false,
                customApiKey: admin.firestore.FieldValue.delete(), // Remove old plain text key if exists
            },
        }, { merge: true });

        return { success: true, message: "API key deleted." };
    } catch (error) {
        console.error("Error deleting API key:", error);
        throw new HttpsError("internal", "Failed to delete API key.");
    }
});

/**
 * Get user's decrypted API key (internal use only, returns to trusted server context)
 * 
 * This function retrieves and decrypts the user's API key.
 * Should only be called from other Cloud Functions, not directly from client.
 */
exports.getUserApiKey = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const uid = request.auth.uid;

    try {
        // Check if user has custom key enabled
        const userDoc = await db.doc(`users/${uid}`).get();
        const userData = userDoc.data();

        if (!userData?.apiSettings?.useCustomApiKey) {
            return { hasCustomKey: false, apiKey: null };
        }

        // Get encrypted key
        const secretDoc = await db.doc(`users/${uid}/secrets/apiKey`).get();
        if (!secretDoc.exists) {
            return { hasCustomKey: false, apiKey: null };
        }

        const encrypted = secretDoc.data();
        const encryptionKey = ENCRYPTION_KEY.value();
        const decryptedKey = decrypt(encrypted, encryptionKey);

        return { hasCustomKey: true, apiKey: decryptedKey };
    } catch (error) {
        console.error("Error retrieving API key:", error);
        throw new HttpsError("internal", "Failed to retrieve API key.");
    }
});

/**
 * Toggle custom API key usage on/off
 * (Allows user to switch between custom and default key without deleting)
 */
exports.toggleCustomApiKey = onCall({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be signed in.");
    }

    const uid = request.auth.uid;
    const useCustom = Boolean(request.data.useCustomKey);

    try {
        // Check if user has a stored key when trying to enable
        if (useCustom) {
            const secretDoc = await db.doc(`users/${uid}/secrets/apiKey`).get();
            if (!secretDoc.exists) {
                throw new HttpsError(
                    "failed-precondition",
                    "No API key stored. Please save an API key first."
                );
            }
        }

        await db.doc(`users/${uid}`).set({
            apiSettings: {
                useCustomApiKey: useCustom,
            },
        }, { merge: true });

        return { success: true, useCustomKey: useCustom };
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        console.error("Error toggling API key:", error);
        throw new HttpsError("internal", "Failed to update settings.");
    }
});
