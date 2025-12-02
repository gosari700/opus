/**
 * UI Module - Handles all DOM manipulation and UI updates
 */

const UI = {
    // DOM Elements (cached on init)
    elements: {},
    
    /**
     * Initialize UI module and cache DOM elements
     */
    init() {
        this.elements = {
            apiModal: document.getElementById('apiModal'),
            apiKeyInput: document.getElementById('apiKeyInput'),
            startScreen: document.getElementById('startScreen'),
            mainScreen: document.getElementById('mainScreen'),
            bottomNav: document.getElementById('bottomNav'),
            statusBar: document.getElementById('statusBar'),
            errorBox: document.getElementById('errorBox'),
            suggestionsList: document.getElementById('suggestionsList'),
            conversationBox: document.getElementById('conversationBox'),
            imageUploadArea: document.getElementById('imageUploadArea'),
            uploadPlaceholder: document.getElementById('uploadPlaceholder'),
            uploadedImageContainer: document.getElementById('uploadedImageContainer'),
            uploadedImage: document.getElementById('uploadedImage'),
            imageInput: document.getElementById('imageInput'),
            micBtn: document.getElementById('micBtn'),
            micHint: document.getElementById('micHint'),
            micStateIcon: document.getElementById('micStateIcon'),
            micStateText: document.getElementById('micStateText')
        };
    },
    
    /**
     * Show/hide API key modal
     * @param {boolean} show
     */
    showApiModal(show) {
        if (show) {
            this.elements.apiModal.classList.remove('hidden');
        } else {
            this.elements.apiModal.classList.add('hidden');
        }
    },
    
    /**
     * Get API key input value
     * @returns {string}
     */
    getApiKeyInput() {
        return this.elements.apiKeyInput.value.trim();
    },
    
    /**
     * Switch to main screen
     */
    showMainScreen() {
        this.elements.startScreen.style.display = 'none';
        this.elements.mainScreen.classList.add('active');
        this.elements.bottomNav.classList.remove('hidden');
    },
    
    /**
     * Update status bar message
     * @param {string} message
     */
    updateStatus(message) {
        this.elements.statusBar.textContent = message;
    },
    
    /**
     * Show error message
     * @param {string} message
     */
    showError(message) {
        this.elements.errorBox.textContent = message;
        this.elements.errorBox.classList.remove('hidden');
    },
    
    /**
     * Hide error message
     */
    hideError() {
        this.elements.errorBox.classList.add('hidden');
    },
    
    /**
     * Update conversation display
     * @param {Array} messages
     */
    updateConversation(messages) {
        const box = this.elements.conversationBox;
        box.innerHTML = '';
        
        // Show last N messages
        const recentMessages = messages.slice(-CONFIG.MAX_DISPLAY_MESSAGES);
        
        recentMessages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = 'chat-message';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = `chat-label ${msg.role === 'user' ? 'you' : 'ai'}`;
            labelDiv.textContent = msg.role === 'user' ? 'You' : 'AI';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'chat-text';
            textDiv.textContent = msg.text;
            
            messageDiv.appendChild(labelDiv);
            messageDiv.appendChild(textDiv);
            box.appendChild(messageDiv);
        });
    },
    
    /**
     * Display suggestions
     * @param {Array} suggestions
     * @param {Function} onSpeak - Callback when speak button clicked
     */
    showSuggestions(suggestions, onSpeak) {
        const list = this.elements.suggestionsList;
        list.innerHTML = '';
        
        const colors = [
            'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)',
            'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)',
            'linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)'
        ];
        
        suggestions.forEach((suggestion, index) => {
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.style.background = colors[index % colors.length];
            
            const number = document.createElement('div');
            number.className = 'suggestion-number';
            number.textContent = index + 1;
            
            const text = document.createElement('div');
            text.className = 'suggestion-text';
            text.textContent = suggestion.text;
            
            const btn = document.createElement('button');
            btn.className = 'suggestion-speak-btn';
            btn.innerHTML = `<svg class="speaker-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>`;
            btn.onclick = (e) => {
                e.stopPropagation();
                if (onSpeak) onSpeak(suggestion.text);
            };
            
            card.appendChild(number);
            card.appendChild(text);
            card.appendChild(btn);
            list.appendChild(card);
        });
    },
    
    /**
     * Update microphone button state
     * @param {boolean} listening
     * @param {boolean} enabled
     */
    updateMicButton(listening, enabled = true) {
        const micBtn = this.elements.micBtn;
        const micHint = this.elements.micHint;
        
        if (listening) {
            micBtn.classList.add('listening');
            micBtn.classList.remove('off');
            if (micHint) micHint.textContent = '듣는 중...';
        } else if (!enabled) {
            micBtn.classList.remove('listening');
            micBtn.classList.add('off');
            if (micHint) micHint.textContent = '마이크 꺼짐';
        } else {
            micBtn.classList.remove('listening');
            micBtn.classList.remove('off');
            if (micHint) micHint.textContent = '탭하여 말하기';
        }
    },
    
    /**
     * Update mic enabled state UI
     * @param {boolean} enabled
     */
    updateMicEnabledState(enabled) {
        const icon = this.elements.micStateIcon;
        const text = this.elements.micStateText;
        const micBtn = this.elements.micBtn;
        
        if (enabled) {
            text.textContent = 'Mic On';
            icon.innerHTML = '<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V21c0 .55.45 1 1 1s1-.45 1-1v-3.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>';
            micBtn.classList.remove('off');
        } else {
            text.textContent = 'Mic Off';
            icon.innerHTML = '<path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>';
            micBtn.classList.add('off');
        }
    },
    
    /**
     * Show uploaded image
     * @param {string} src
     */
    showUploadedImage(src) {
        this.elements.uploadedImage.src = src;
        this.elements.uploadPlaceholder.classList.add('hidden');
        this.elements.uploadedImageContainer.classList.remove('hidden');
        this.elements.imageUploadArea.classList.add('has-image');
    },
    
    /**
     * Clear uploaded image
     */
    clearUploadedImage() {
        this.elements.uploadedImage.src = '';
        this.elements.uploadPlaceholder.classList.remove('hidden');
        this.elements.uploadedImageContainer.classList.add('hidden');
        this.elements.imageUploadArea.classList.remove('has-image');
        this.elements.imageInput.value = '';
    }
};
