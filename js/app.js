/**
 * Main Application - Controls app flow and state
 */

const App = {
    // Application State
    conversationHistory: [],
    currentImageBase64: null,
    isProcessing: false,
    
    /**
     * Initialize the application
     */
    init() {
        // Initialize UI
        UI.init();
        
        // Initialize speech module
        SpeechModule.initVoices();
        
        // Setup speech callbacks
        SpeechModule.onResult = (text) => this.handleUserSpeech(text);
        SpeechModule.onInterim = (text) => UI.updateStatus(`🎤 듣는 중: "${text}"`);
        SpeechModule.onError = (error) => this.handleSpeechError(error);
        SpeechModule.onStateChange = (state) => this.handleSpeechStateChange(state);
        
        // Check API key
        if (!ApiKeyManager.exists()) {
            UI.showApiModal(true);
        } else {
            UI.showApiModal(false);
        }
        
        console.log('✅ App initialized');
    },
    
    /**
     * Handle speech state changes
     * @param {string} state
     */
    handleSpeechStateChange(state) {
        switch(state) {
            case 'listening':
                UI.updateMicButton(true, SpeechModule.isMicEnabled);
                break;
            case 'stopped':
                UI.updateMicButton(false, SpeechModule.isMicEnabled);
                if (!this.isProcessing) {
                    UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
                }
                break;
            case 'error':
                UI.updateMicButton(false, SpeechModule.isMicEnabled);
                break;
        }
    },
    
    /**
     * Handle speech recognition errors
     * @param {string} error
     */
    handleSpeechError(error) {
        switch(error) {
            case 'not-allowed':
                UI.showError('마이크 권한이 차단되었습니다. 브라우저 주소창 왼쪽의 🔒 아이콘을 클릭하여 마이크를 허용해주세요.');
                break;
            case 'no-speech':
                UI.updateStatus('🎤 음성이 감지되지 않았습니다. 다시 시도해주세요.');
                break;
            case 'audio-capture':
                UI.showError('마이크를 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
                break;
            case 'network':
                UI.showError('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
                break;
            case 'aborted':
                // 사용자가 중단한 경우 - 무시
                break;
            default:
                if (error !== 'aborted') {
                    UI.updateStatus('⚠️ 오류: ' + error + '. 다시 시도해주세요.');
                }
        }
    },
    
    /**
     * Handle user speech input
     * @param {string} text
     */
    async handleUserSpeech(text) {
        if (!text.trim() || this.isProcessing) return;
        
        this.isProcessing = true;
        SpeechModule.stopListening();
        UI.updateMicButton(false);
        UI.updateStatus('⏳ AI가 생각 중...');
        UI.hideError();
        
        // Add user message
        this.addMessage('user', text);
        
        try {
            // Get AI response
            const response = await GeminiAPI.generateResponse(
                text, 
                this.conversationHistory,
                this.currentImageBase64
            );
            
            // Add AI message
            this.addMessage('ai', response.aiResponse);
            UI.updateStatus('🎤 AI가 말하고 있습니다...');
            
            // Speak the response
            await SpeechModule.speak(response.aiResponse);
            
            // Show suggestions
            UI.showSuggestions(response.suggestions, (text) => this.speakSuggestion(text));
            UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
            
        } catch (error) {
            console.error('API Error:', error);
            UI.showError('API 오류: ' + error.message);
            
            // Use fallback response
            const fallback = GeminiAPI.getFallbackResponse(text);
            this.addMessage('ai', fallback.aiResponse);
            await SpeechModule.speak(fallback.aiResponse);
            UI.showSuggestions(fallback.suggestions, (text) => this.speakSuggestion(text));
            UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
        }
        
        this.isProcessing = false;
    },
    
    /**
     * Add message to conversation
     * @param {string} role - 'user' or 'ai'
     * @param {string} text
     */
    addMessage(role, text) {
        this.conversationHistory.push({ role, text });
        UI.updateConversation(this.conversationHistory);
    },
    
    /**
     * Speak a suggestion (without triggering AI response)
     * @param {string} text
     */
    async speakSuggestion(text) {
        UI.updateStatus('🔊 문장을 읽어드립니다...');
        await SpeechModule.speak(text);
        UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
    }
};

// ===================================
// Global Functions (called from HTML)
// ===================================

/**
 * Save API key and close modal
 */
function saveApiKey() {
    const key = UI.getApiKeyInput();
    if (key) {
        ApiKeyManager.set(key);
        UI.showApiModal(false);
    } else {
        alert('API 키를 입력해주세요.');
    }
}

/**
 * Start conversation
 */
async function startConversation() {
    // 1. 마이크 권한 요청
    UI.updateStatus('🎤 마이크 권한을 요청합니다...');
    const hasPermission = await SpeechModule.requestMicPermission();
    if (!hasPermission) {
        UI.showError('마이크 권한이 필요합니다. 브라우저 설정에서 마이크를 허용해주세요.');
        return;
    }
    
    // 2. 음성 인식 초기화
    if (!SpeechModule.initRecognition()) {
        UI.showError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
        return;
    }
    
    // 3. UI 전환
    UI.showMainScreen();
    UI.updateStatus('🎤 AI가 말하고 있습니다...');
    
    // 4. 환영 메시지
    const welcomeMessage = "Hi there! It's so nice to meet you! I'm here to help you practice English. How's your day going so far?";
    
    App.addMessage('ai', welcomeMessage);
    await SpeechModule.speak(welcomeMessage);
    
    // 5. 초기 제안
    const suggestions = [
        { text: "I'm good!", level: 'beginner', age: 5 },
        { text: "My day is going pretty well, thanks for asking.", level: 'intermediate', age: 10 },
        { text: "I'm having a wonderful day! I've been looking forward to practicing my English.", level: 'advanced', age: 20 }
    ];
    
    UI.showSuggestions(suggestions, (text) => App.speakSuggestion(text));
    UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
    console.log('✅ 대화 시작 완료. 마이크 버튼을 눌러주세요.');
}

/**
 * Toggle microphone
 */
function toggleMic() {
    console.log('🎤 toggleMic 호출됨, isListening:', SpeechModule.isListening, 'isSpeaking:', SpeechModule.isSpeaking, 'isProcessing:', App.isProcessing);
    
    if (App.isProcessing || SpeechModule.isSpeaking) {
        UI.updateStatus('⏳ 잠시 기다려주세요...');
        return;
    }
    
    if (!SpeechModule.isMicEnabled) {
        UI.updateStatus('🔇 마이크가 꺼져있습니다.');
        return;
    }
    
    if (SpeechModule.isListening) {
        SpeechModule.stopListening();
        UI.updateStatus('🎤 마이크 버튼을 눌러 말해보세요!');
    } else {
        SpeechModule.startListening();
    }
}

/**
 * Toggle microphone enabled state
 */
function toggleMicEnabled() {
    SpeechModule.isMicEnabled = !SpeechModule.isMicEnabled;
    SpeechModule.setMicEnabled(SpeechModule.isMicEnabled);
    UI.updateMicEnabledState(SpeechModule.isMicEnabled);
    UI.updateMicButton(SpeechModule.isListening, SpeechModule.isMicEnabled);
    
    UI.updateStatus(SpeechModule.isMicEnabled ? '🎤 마이크 버튼을 눌러 말해보세요!' : '🔇 마이크가 꺼졌습니다.');
}

/**
 * Handle image upload
 * @param {Event} event
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > CONFIG.MAX_IMAGE_SIZE) {
        alert('이미지 크기는 10MB 이하여야 합니다.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const result = e.target.result;
        UI.showUploadedImage(result);
        App.currentImageBase64 = result.split(',')[1];
        UI.updateStatus('🖼️ 이미지가 업로드되었습니다. 이미지에 대해 말해보세요!');
    };
    reader.readAsDataURL(file);
}

/**
 * Remove uploaded image
 * @param {Event} event
 */
function removeImage(event) {
    event.stopPropagation();
    App.currentImageBase64 = null;
    UI.clearUploadedImage();
}

/**
 * Share conversation
 */
function shareConversation() {
    const text = App.conversationHistory.map(m => 
        `${m.role === 'user' ? 'Me' : 'AI'}: ${m.text}`
    ).join('\n\n');
    
    if (navigator.share) {
        navigator.share({
            title: 'My English Practice',
            text: text
        });
    } else {
        navigator.clipboard.writeText(text).then(() => {
            alert('대화 내용이 클립보드에 복사되었습니다!');
        });
    }
}

// ===================================
// Initialize on page load
// ===================================
window.onload = () => {
    App.init();
};
