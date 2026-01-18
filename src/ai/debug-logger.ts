// This file will be imported to add logging
const fs = require('fs');

export function logDebug(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;

    try {
        fs.appendFileSync('C:\\Users\\Suraj\\OneDrive\\Desktop\\MindScape\\quiz-debug.log', logMessage);
        console.log('📝', message);
    } catch (e) {
        console.error('Failed to write log:', e);
    }
}
