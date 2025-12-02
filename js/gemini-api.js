/**
 * Gemini API Module - Handles AI response generation
 */

const GeminiAPI = {
    /**
     * Generate AI response using Gemini API
     * @param {string} userText - User's message
     * @param {Array} conversationHistory - Previous messages
     * @param {string|null} imageBase64 - Optional image in base64
     * @returns {Promise<Object>}
     */
    async generateResponse(userText, conversationHistory, imageBase64 = null) {
        const apiKey = ApiKeyManager.get();
        
        if (!apiKey) {
            throw new Error('API 키가 없습니다. 페이지를 새로고침하세요.');
        }
        
        const imageContext = imageBase64 ? 
            "\n\nThe user has uploaded an image. Please acknowledge it and ask about it naturally." : "";
        
        const recentHistory = conversationHistory.slice(-CONFIG.MAX_HISTORY_LENGTH).map(m => 
            `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`
        ).join('\n');
        
        const prompt = `You are a friendly, warm English conversation partner. Help the user practice speaking naturally.
${imageContext}

Recent conversation:
${recentHistory}

The user just said: "${userText}"

Instructions:
1. Respond naturally and engagingly in 1-2 sentences
2. Ask a follow-up question to keep the conversation going
3. Be encouraging and friendly

Then provide 3 suggested responses for the user at different levels:
- Level 1 (5-year-old): Very simple, 3-5 words
- Level 2 (10-year-old): Natural sentence, 8-12 words  
- Level 3 (20-year-old): More sophisticated, 15+ words

IMPORTANT: Respond ONLY with this exact JSON format, no other text:
{"aiResponse":"your response here","suggestions":[{"text":"simple response","level":"beginner","age":5},{"text":"medium response","level":"intermediate","age":10},{"text":"advanced response","level":"advanced","age":20}]}`;

        const requestBody = {
            contents: [{
                parts: imageBase64 ? [
                    { text: prompt },
                    { inline_data: { mime_type: "image/jpeg", data: imageBase64 } }
                ] : [
                    { text: prompt }
                ]
            }],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 400,
                topP: 0.9
            }
        };

        console.log('Calling Gemini API...');
        
        const response = await fetch(
            `${CONFIG.GEMINI_API_URL}?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            }
        );

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('API Error Response:', errorData);
            throw new Error(`API 요청 실패 (${response.status}): ${errorData.error?.message || '알 수 없는 오류'}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('API 응답 형식이 올바르지 않습니다.');
        }
        
        let responseText = data.candidates[0].content.parts[0].text;
        console.log('Raw response:', responseText);
        
        // Clean up the response - remove markdown code blocks
        responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        
        // Try to find JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        }
        
        try {
            const parsed = JSON.parse(responseText);
            
            // Validate the response structure
            if (!parsed.aiResponse || !Array.isArray(parsed.suggestions)) {
                throw new Error('Invalid response structure');
            }
            
            return parsed;
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError, 'Text:', responseText);
            throw new Error('AI 응답을 파싱할 수 없습니다.');
        }
    },
    
    /**
     * Get smart fallback response based on user input
     * @param {string} userText
     * @returns {Object}
     */
    getFallbackResponse(userText) {
        const lower = userText.toLowerCase();
        
        // Greeting responses
        if (lower.match(/hello|hi|hey|good morning|good afternoon|good evening/)) {
            return {
                aiResponse: "Hello! It's great to hear from you! How are you doing today?",
                suggestions: [
                    { text: "I'm fine!", level: 'beginner', age: 5 },
                    { text: "I'm doing well, thank you for asking.", level: 'intermediate', age: 10 },
                    { text: "I'm feeling great today! Thanks for asking. How about yourself?", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Feeling/mood responses
        if (lower.match(/good|great|fine|well|happy|excited/)) {
            return {
                aiResponse: "That's wonderful to hear! What made your day so good?",
                suggestions: [
                    { text: "I had fun!", level: 'beginner', age: 5 },
                    { text: "I did something interesting today.", level: 'intermediate', age: 10 },
                    { text: "I accomplished something I've been working on for a while.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Negative mood
        if (lower.match(/bad|sad|tired|sick|not good|not well/)) {
            return {
                aiResponse: "Oh, I'm sorry to hear that. What happened? Would you like to talk about it?",
                suggestions: [
                    { text: "I'm just tired.", level: 'beginner', age: 5 },
                    { text: "I didn't sleep well last night.", level: 'intermediate', age: 10 },
                    { text: "It's been a challenging day, but I'm managing. Thanks for asking.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Movie/watch responses
        if (lower.match(/movie|watch|film|show|series|netflix|youtube/)) {
            return {
                aiResponse: "Oh, you watched something! What kind of movie or show was it?",
                suggestions: [
                    { text: "It was fun!", level: 'beginner', age: 5 },
                    { text: "It was an action movie. Very exciting!", level: 'intermediate', age: 10 },
                    { text: "It was a thought-provoking drama that really made me think.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Food responses
        if (lower.match(/eat|food|lunch|dinner|breakfast|hungry|delicious|cook/)) {
            return {
                aiResponse: "Food is always a great topic! What's your favorite thing to eat?",
                suggestions: [
                    { text: "I like pizza!", level: 'beginner', age: 5 },
                    { text: "I really enjoy Korean food, especially bibimbap.", level: 'intermediate', age: 10 },
                    { text: "I'm quite adventurous with food. I love trying new cuisines from different cultures.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Work/study responses
        if (lower.match(/work|job|study|school|office|busy|meeting/)) {
            return {
                aiResponse: "I see! How is your work or study going these days?",
                suggestions: [
                    { text: "It's okay.", level: 'beginner', age: 5 },
                    { text: "It's been pretty busy lately.", level: 'intermediate', age: 10 },
                    { text: "It's challenging but rewarding. I'm learning a lot every day.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Weather responses
        if (lower.match(/weather|rain|sun|cold|hot|snow/)) {
            return {
                aiResponse: "The weather really affects our mood, doesn't it? What do you like to do on days like this?",
                suggestions: [
                    { text: "I stay home.", level: 'beginner', age: 5 },
                    { text: "I usually watch movies at home.", level: 'intermediate', age: 10 },
                    { text: "I enjoy cozying up with a good book and a cup of tea.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Hobby responses
        if (lower.match(/hobby|play|game|music|sport|read|travel/)) {
            return {
                aiResponse: "That sounds like a great hobby! How long have you been doing that?",
                suggestions: [
                    { text: "Not long.", level: 'beginner', age: 5 },
                    { text: "I've been doing it for a few years.", level: 'intermediate', age: 10 },
                    { text: "I've been passionate about it since I was young. It's become a big part of my life.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Weekend/plans responses
        if (lower.match(/weekend|plan|tomorrow|vacation|holiday/)) {
            return {
                aiResponse: "Sounds interesting! What are you planning to do?",
                suggestions: [
                    { text: "I'll rest.", level: 'beginner', age: 5 },
                    { text: "I'm planning to meet some friends.", level: 'intermediate', age: 10 },
                    { text: "I have a few things planned, including catching up with old friends and maybe trying a new restaurant.", level: 'advanced', age: 20 }
                ]
            };
        }
        
        // Default/generic response
        return {
            aiResponse: "That's interesting! Tell me more about it. What happened next?",
            suggestions: [
                { text: "It was nice.", level: 'beginner', age: 5 },
                { text: "Well, let me explain a bit more about it.", level: 'intermediate', age: 10 },
                { text: "There's actually quite an interesting story behind it. Let me tell you.", level: 'advanced', age: 20 }
            ]
        };
    }
};
