/**
 * Speech Module - Handles speech recognition and text-to-speech
 * Uses Gemini TTS API for natural, emotional voice
 */

const SpeechModule = {
    recognition: null,
    synthesis: window.speechSynthesis,
    mediaStream: null,
    audioContext: null,
    currentAudio: null,

    // State
    isListening: false,
    isSpeaking: false,
    isMicEnabled: true,

    // Callbacks
    onResult: null,
    onInterim: null,
    onError: null,
    onStateChange: null,

    // Gemini TTS Settings
    GEMINI_TTS_MODEL: 'gemini-2.0-flash-exp',
    GEMINI_VOICE: 'Aoede', // Female voice options: Kore, Aoede, Leda, Zephyr

    /**
     * Initialize audio context for Gemini TTS
     */
    initVoices() {
        // Initialize Web Audio API context
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Audio context initialized for Gemini TTS');
        } catch (e) {
            console.log('⚠️ Web Audio API not available, falling back to browser TTS');
        }
    },

    /**
     * Request microphone permission
     * @returns {Promise<boolean>}
     */
    async requestMicPermission() {
        try {
            console.log('🎤 마이크 권한 요청 시작...');
            console.log('- HTTPS:', window.location.protocol === 'https:');
            console.log('- getUserMedia available:', !!navigator.mediaDevices?.getUserMedia);

            if (this.mediaStream) {
                console.log('✅ 이미 마이크 권한 있음');
                return true;
            }

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                console.error('❌ getUserMedia not supported');
                throw new Error('이 브라우저는 마이크를 지원하지 않습니다');
            }

            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            console.log('✅ 마이크 권한 획득 성공');
            console.log('- Audio tracks:', this.mediaStream.getAudioTracks().length);
            return true;
        } catch (err) {
            console.error('❌ 마이크 권한 거부:', err.name, err.message);
            return false;
        }
    },

    /**
     * Initialize speech recognition
     * @returns {boolean}
     */
    initRecognition() {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            console.error('Speech recognition not supported');
            return false;
        }

        // 기존 recognition이 있으면 정리
        if (this.recognition) {
            try { this.recognition.abort(); } catch (e) { }
            this.recognition = null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = CONFIG.SPEECH_LANG;
        this.recognition.continuous = false; // Auto-stop after silence
        this.recognition.interimResults = true;
        this.recognition.maxAlternatives = 1;

        console.log('🔧 Recognition settings:');
        console.log('- Browser:', navigator.userAgent);
        console.log('- HTTPS:', window.location.protocol === 'https:');
        console.log('- lang:', this.recognition.lang);
        console.log('- continuous:', this.recognition.continuous);
        console.log('- interimResults:', this.recognition.interimResults);

        this.recognition.onstart = () => {
            console.log('🎤 음성 인식 시작됨');
            this.isListening = true;
            if (this.onStateChange) this.onStateChange('listening');
        };

        this.recognition.onresult = (event) => {
            console.log('🎤 onresult 이벤트 발생, results.length:', event.results.length);
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                console.log(`- Result[${i}]: "${transcript}", isFinal:`, event.results[i].isFinal);
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript && this.onInterim) {
                console.log('📝 임시 텍스트:', interimTranscript);
                this.onInterim(interimTranscript);
            }

            if (finalTranscript && this.onResult) {
                console.log('✅ 최종 인식:', finalTranscript);
                this.onResult(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('❌ 음성 인식 오류:', event.error);
            console.error('- Error details:', event);
            console.error('- isListening before error:', this.isListening);
            console.error('- mediaStream:', !!this.mediaStream);
            this.isListening = false;

            if (this.onError) {
                this.onError(event.error);
            }

            if (this.onStateChange) {
                this.onStateChange('error', event.error);
            }
        };

        this.recognition.onend = () => {
            console.log('🎤 음성 인식 종료됨');
            this.isListening = false;
            if (this.onStateChange) this.onStateChange('stopped');
        };

        console.log('✅ 음성 인식 초기화 완료');
        return true;
    },

    /**
     * Start listening
     */
    startListening() {
        console.log('🎤 startListening 호출됨');
        console.log('- recognition:', !!this.recognition);
        console.log('- isMicEnabled:', this.isMicEnabled);
        console.log('- isListening:', this.isListening);
        console.log('- mediaStream:', !!this.mediaStream);

        if (!this.recognition) {
            console.log('🔧 Recognition 초기화 중...');
            if (!this.initRecognition()) {
                console.error('❌ Recognition 초기화 실패');
                return;
            }
        }

        if (!this.isMicEnabled) {
            console.log('❌ 마이크가 비활성화됨');
            return;
        }

        if (this.isListening) {
            console.log('⚠️ 이미 듣는 중...');
            return;
        }

        try {
            console.log('🚀 recognition.start() 호출 시도...');
            this.recognition.start();
            console.log('✅ recognition.start() 호출 성공');
        } catch(e) {
            console.error('❌ 시작 실패:', e.name, e.message);
            if (e.name === 'InvalidStateError') {
                console.log('🔄 재초기화 시도...');
                this.initRecognition();
                setTimeout(() => {
                    try {
                        console.log('🔄 재시도 중...');
                        this.recognition.start();
                        console.log('✅ 재시도 성공');
                    } catch(e2) {
                        console.error('❌ 재시도 실패:', e2);
                    }
                }, 100);
            }
        }
    },

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
                console.log('🎤 recognition.stop() 호출됨');
            } catch (e) {
                console.log('stop 오류:', e);
            }
        }
        this.isListening = false;
    },

    /**
     * Toggle microphone on/off
     */
    toggleMic() {
        console.log('🎤 toggleMic 호출됨, isListening:', this.isListening);
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    },

    /**
     * Enable/disable microphone
     * @param {boolean} enabled
     */
    setMicEnabled(enabled) {
        this.isMicEnabled = enabled;
        if (!enabled && this.isListening) {
            this.stopListening();
        }
    },

    /**
     * Speak text using Gemini TTS API (natural human-like voice)
     * @param {string} text
     * @returns {Promise<void>}
     */
    async speak(text) {
        const apiKey = ApiKeyManager.get();

        // Try Gemini TTS first
        if (apiKey && this.audioContext) {
            try {
                return await this.speakWithGeminiTTS(text, apiKey);
            } catch (error) {
                console.log('⚠️ Gemini TTS failed, falling back to browser TTS:', error.message);
                // Silently fall back to browser TTS without showing error to user
            }
        }

        // Fallback to browser TTS
        return this.speakWithBrowserTTS(text);
    },

    /**
     * Speak using Gemini TTS API
     * @param {string} text
     * @param {string} apiKey
     * @returns {Promise<void>}
     */
    /**
     * Speak using Google Cloud TTS API
     * @param {string} text
     * @param {string} apiKey
     * @returns {Promise<void>}
     */
    async speakWithGeminiTTS(text, apiKey) {
        this.isSpeaking = true;

        // Stop any currently playing audio
        if (this.currentAudio) {
            this.currentAudio.pause();
            this.currentAudio = null;
        }

        // Use Google Cloud TTS API
        const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

        const requestBody = {
            input: { text: text },
            voice: {
                languageCode: 'en-US',
                name: 'en-US-Neural2-F' // High quality Neural voice
            },
            audioConfig: {
                audioEncoding: 'MP3',
                pitch: 0,
                speakingRate: 1.0
            }
        };

        console.log('🎤 Calling Google Cloud TTS...');

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorMsg = `Google TTS API error: ${response.status}`;
            try {
                const errorText = await response.text();
                errorMsg += ` - ${errorText}`;
            } catch (e) {
                errorMsg += ' (Could not read error body)';
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (!data.audioContent) {
            throw new Error('No audio content in response');
        }

        console.log('✅ Google TTS audio received, playing...');

        // Convert and play the audio
        await this.playGeminiAudio(data.audioContent, 'audio/mp3');

        this.isSpeaking = false;
    },

    /**
     * Play audio from Gemini TTS response
     * @param {string} base64Data - Base64 encoded audio
     * @param {string} mimeType - Audio mime type
     * @returns {Promise<void>}
     */
    async playGeminiAudio(base64Data, mimeType) {
        return new Promise((resolve, reject) => {
            try {
                // Decode base64 to binary
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                // Check if it's PCM audio (L16)
                if (mimeType.includes('L16') || mimeType.includes('pcm')) {
                    // Convert PCM to WAV
                    const wavData = this.pcmToWav(bytes, 24000, 1, 16);
                    const blob = new Blob([wavData], { type: 'audio/wav' });
                    const audioUrl = URL.createObjectURL(blob);

                    this.currentAudio = new Audio(audioUrl);
                    this.currentAudio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        this.currentAudio = null;
                        resolve();
                    };
                    this.currentAudio.onerror = (e) => {
                        URL.revokeObjectURL(audioUrl);
                        reject(e);
                    };
                    this.currentAudio.play();
                } else {
                    // Assume it's already a playable format
                    const blob = new Blob([bytes], { type: mimeType });
                    const audioUrl = URL.createObjectURL(blob);

                    this.currentAudio = new Audio(audioUrl);
                    this.currentAudio.onended = () => {
                        URL.revokeObjectURL(audioUrl);
                        this.currentAudio = null;
                        resolve();
                    };
                    this.currentAudio.onerror = (e) => {
                        URL.revokeObjectURL(audioUrl);
                        reject(e);
                    };
                    this.currentAudio.play();
                }
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Convert PCM audio to WAV format
     * @param {Uint8Array} pcmData - Raw PCM data
     * @param {number} sampleRate - Sample rate (e.g., 24000)
     * @param {number} numChannels - Number of channels (1 for mono)
     * @param {number} bitsPerSample - Bits per sample (16)
     * @returns {Uint8Array} - WAV file data
     */
    pcmToWav(pcmData, sampleRate, numChannels, bitsPerSample) {
        const byteRate = sampleRate * numChannels * bitsPerSample / 8;
        const blockAlign = numChannels * bitsPerSample / 8;
        const dataSize = pcmData.length;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        // WAV header
        // "RIFF" chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        this.writeString(view, 8, 'WAVE');

        // "fmt " sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
        view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitsPerSample, true);

        // "data" sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, dataSize, true);

        // Write PCM data
        const wavBytes = new Uint8Array(buffer);
        wavBytes.set(pcmData, 44);

        return wavBytes;
    },

    /**
     * Write string to DataView
     */
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    },

    /**
     * Fallback: Speak using browser's built-in TTS
     * @param {string} text
     * @returns {Promise<void>}
     */
    speakWithBrowserTTS(text) {
        return new Promise((resolve) => {
            this.isSpeaking = true;
            this.synthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = CONFIG.SPEECH_LANG;
            utterance.rate = CONFIG.TTS_RATE;
            utterance.pitch = CONFIG.TTS_PITCH;
            utterance.volume = CONFIG.TTS_VOLUME;

            // Try to find a good voice
            const voices = this.synthesis.getVoices();
            const femaleVoice = voices.find(v =>
                v.lang.startsWith('en') &&
                (v.name.includes('Google US English') ||
                    v.name.includes('Samantha') ||
                    v.name.includes('Female'))
            ) || voices.find(v => v.lang.startsWith('en-US'));

            if (femaleVoice) {
                utterance.voice = femaleVoice;
            }

            utterance.onend = () => {
                this.isSpeaking = false;
                resolve();
            };

            utterance.onerror = () => {
                this.isSpeaking = false;
                resolve();
            };

            this.synthesis.speak(utterance);
        });
    },

    /**
     * Check if currently speaking
     * @returns {boolean}
     */
    isBusy() {
        return this.isSpeaking;
    }
};
