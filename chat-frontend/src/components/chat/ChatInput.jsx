import React, { useState, useRef } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image as ImageIcon, Clock, Square, File } from 'lucide-react';

const EMOJI_POPUP = ['😀', '😂', '😍', '🔥', '👍', '🎉', '❤️', '🙌', '😎', '🙏', '✨', '🚀'];

const ChatInput = ({
    onSendMessage,
    onUploadFile,
    replyingTo,
    onCancelReply,
    onStartTyping,
    onStopTyping
}) => {
    const [text, setText] = useState('');
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const handleTextChange = (e) => {
        setText(e.target.value);
        if (e.target.value.trim().length > 0) {
            onStartTyping?.();
        } else {
            onStopTyping?.();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitMessage();
        }
    };

    const submitMessage = () => {
        if (!text.trim()) return;
        onSendMessage(text.trim());
        setText('');
        onStopTyping?.();
        setShowEmojiPicker(false);
    };

    const handleEmojiClick = (emoji) => {
        setText(prev => prev + emoji);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUploadFile(file);
            e.target.value = '';
        }
    };

    // Voice recording logic
    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: 'audio/webm' });
                onUploadFile(audioFile);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (err) {
            console.error("Microphone access failed:", err);
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    return (
        <div style={{
            position: 'relative',
            padding: '12px 20px',
            backgroundColor: 'var(--bg-surface, #19142c)',
            borderTop: '1px solid var(--border-default, rgba(255, 255, 255, 0.08))'
        }}>
            {/* Replying Banner */}
            {replyingTo && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderLeft: '4px solid #6366f1',
                    marginBottom: '8px',
                    fontSize: '12px',
                    color: '#fff'
                }}>
                    <div>
                        <span style={{ fontWeight: '700', color: '#818cf8' }}>Replying to message: </span>
                        <span style={{ opacity: 0.8 }}>{replyingTo.content}</span>
                    </div>
                    <button onClick={onCancelReply} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div style={{
                    position: 'absolute',
                    bottom: '70px',
                    left: '20px',
                    backgroundColor: '#1a1640',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '12px',
                    padding: '10px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gap: '6px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                    zIndex: 30
                }}>
                    {EMOJI_POPUP.map(emoji => (
                        <button
                            key={emoji}
                            onClick={() => handleEmojiClick(emoji)}
                            style={{
                                fontSize: '20px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '6px',
                                transition: 'transform 0.1s ease'
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Input Controls */}
            {isRecording ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            animation: 'pulse 1s infinite'
                        }} />
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>
                            Recording audio: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                        </span>
                    </div>

                    <button
                        onClick={stopVoiceRecording}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            backgroundColor: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <Square size={14} /> Send Note
                    </button>
                </div>
            ) : (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '14px',
                    padding: '6px 12px'
                }}>
                    {/* File Attachment Button */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={inputIconBtnStyle}
                        title="Attach file or media"
                    >
                        <Paperclip size={18} />
                    </button>

                    {/* Emoji Button */}
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        style={inputIconBtnStyle}
                        title="Emoji"
                    >
                        <Smile size={18} />
                    </button>

                    {/* Text Input */}
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type encrypted message..."
                        rows={1}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '14px',
                            fontFamily: 'inherit',
                            resize: 'none',
                            maxHeight: '100px',
                            padding: '6px 0'
                        }}
                    />

                    {/* Mic Button (if empty text) or Send Button */}
                    {!text.trim() ? (
                        <button
                            onClick={startVoiceRecording}
                            style={inputIconBtnStyle}
                            title="Record voice note"
                        >
                            <Mic size={18} />
                        </button>
                    ) : (
                        <button
                            onClick={submitMessage}
                            style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                            }}
                            title="Send Message"
                        >
                            <Send size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const inputIconBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'rgba(255, 255, 255, 0.55)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s ease'
};

export default ChatInput;
