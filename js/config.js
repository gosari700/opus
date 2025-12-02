/**
 * Configuration - API keys and app settings
 */

const CONFIG = {
    // Gemini API Configuration
    GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    GEMINI_TTS_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
    
    // Available Gemini TTS Voices (Female: Kore, Aoede, Leda, Zephyr / Male: Puck, Charon, Fenrir)
    GEMINI_TTS_VOICE: 'Kore',
    
    // Speech Recognition Settings
    SPEECH_LANG: 'en-US',
    
    // Browser TTS Settings (fallback)
    TTS_RATE: 0.95,
    TTS_PITCH: 1.1,
    TTS_VOLUME: 1,
    
    // Image Upload Settings
    MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
    
    // Conversation Settings
    MAX_HISTORY_LENGTH: 6, // Number of messages to keep in context
    MAX_DISPLAY_MESSAGES: 2, // Number of messages to display in UI
};

// API Key Management
const ApiKeyManager = {
    STORAGE_KEY: 'geminiApiKey',
    
    get() {
        return localStorage.getItem(this.STORAGE_KEY) || '';
    },
    
    set(key) {
        localStorage.setItem(this.STORAGE_KEY, key);
    },
    
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    },
    
    exists() {
        return !!this.get();
    }
};
