// Conversation History Configuration
export const CONVERSATION_CONFIG = {
    // Maximum number of messages to store
    MAX_HISTORY_MESSAGES: 50,

    // Storage key for localStorage
    STORAGE_KEY: 'trainboost_conversation_history',

    // Whether to clear history on logout
    CLEAR_ON_LOGOUT: true,

    // Maximum age of messages in days (0 = no expiration)
    MAX_MESSAGE_AGE_DAYS: 7,

    // Maximum context messages to send to AI (from recent history)
    MAX_CONTEXT_MESSAGES: 10,

    // Whether to persist history across browser sessions
    PERSIST_ACROSS_SESSIONS: true,
};

// Helper function to check if a message is expired
export const isMessageExpired = (timestamp, maxAgeDays) => {
    if (maxAgeDays === 0) return false;
    const messageDate = new Date(timestamp);
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - maxAgeDays);
    return messageDate < expirationDate;
};

// Helper function to clean expired messages
export const cleanExpiredMessages = (messages, maxAgeDays) => {
    if (maxAgeDays === 0) return messages;
    return messages.filter(msg => !isMessageExpired(msg.timestamp, maxAgeDays));
};