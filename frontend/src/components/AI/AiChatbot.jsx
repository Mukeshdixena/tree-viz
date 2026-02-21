import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import './AiChatbot.css';

const AiChatbot = () => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your personal AI assistant. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await api.aiChat([...messages, userMessage]);
            if (response && response.content) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.content }]);
            } else if (response && response.message) {
                setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${response.message}` }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an unknown error.' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error communicating with AI service. Please ensure your backend is restarted.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className="ai-chat-container">
            <div className="ai-chat-header">
                <div className="ai-status-dot"></div>
                <h2>AI Assistant</h2>
            </div>

            <div className="ai-chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        {msg.content}
                    </div>
                ))}
                {isLoading && (
                    <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="ai-chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default AiChatbot;
