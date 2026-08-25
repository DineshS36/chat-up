import React, { useRef, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import MessageItem from './MessageItem';
import ChatInput from './ChatInput';
import { MessageSquare, Shield, Lock } from 'lucide-react';

const ChatArea = ({
    selectedChat,
    currentUser,
    messages,
    loadingMessages,
    loadingOlderMessages,
    hasMoreMessages,
    onLoadOlderMessages,
    isTyping,
    onlineStatuses,
    onSendMessage,
    onUploadFile,
    replyingTo,
    onCancelReply,
    onReactToMessage,
    onReplyToMessage,
    onDeleteMessage,
    onToggleGroupInfo,
    onStartCall,
    onStartTyping,
    onStopTyping
}) => {
    const messagesEndRef = useRef(null);
    const containerRef = useRef(null);

    // Auto-scroll to bottom on initial message load or new incoming messages
    useEffect(() => {
        if (!loadingOlderMessages) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, loadingOlderMessages]);

    // Handle scroll to top to load older messages
    const handleScroll = (e) => {
        const container = e.target;
        if (container.scrollTop < 50 && hasMoreMessages && !loadingOlderMessages && !loadingMessages) {
            const prevHeight = container.scrollHeight;
            onLoadOlderMessages().then(() => {
                requestAnimationFrame(() => {
                    container.scrollTop = container.scrollHeight - prevHeight;
                });
            });
        }
    };

    if (!selectedChat) {
        return (
            <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-space, #0b0813)',
                color: 'rgba(255, 255, 255, 0.4)',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '24px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '20px',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                }}>
                    <MessageSquare size={36} color="#818cf8" />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>
                    Welcome to ChatUp
                </h3>
                <p style={{ maxWidth: '360px', fontSize: '13px', lineHeight: '1.6', margin: '0 0 20px' }}>
                    Select a conversation from the sidebar or start a new encrypted group chat.
                </p>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '12px',
                    color: 'rgba(255, 255, 255, 0.5)'
                }}>
                    <Lock size={12} color="#10b981" />
                    End-to-End Encrypted Messaging
                </div>
            </div>
        );
    }

    return (
        <main style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: 'var(--bg-space, #0b0813)',
            position: 'relative'
        }}>
            {/* Header */}
            <ChatHeader
                selectedChat={selectedChat}
                user={currentUser}
                isTyping={isTyping}
                onlineStatuses={onlineStatuses}
                onToggleGroupInfo={onToggleGroupInfo}
                onStartCall={onStartCall}
            />

            {/* Messages Scroll Area */}
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="custom-scrollbar"
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px 0',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                {/* Older Messages Loading Spinner */}
                {loadingOlderMessages && (
                    <div style={{ textAlign: 'center', padding: '10px 0', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                        Loading older messages...
                    </div>
                )}

                {/* Messages List */}
                {loadingMessages ? (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
                        Decrypting conversation history...
                    </div>
                ) : messages.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                        No messages in this chat yet. Send a message to start!
                    </div>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {messages.map(msg => (
                            <MessageItem
                                key={msg._id}
                                message={msg}
                                currentUser={currentUser}
                                isGroup={selectedChat.isGroup}
                                onReact={onReactToMessage}
                                onReply={onReplyToMessage}
                                onDelete={onDeleteMessage}
                            />
                        ))}
                    </ul>
                )}

                {/* Typing Indicator */}
                {isTyping && (
                    <div style={{ padding: '4px 20px', fontSize: '12px', color: '#818cf8', fontStyle: 'italic' }}>
                        Someone is typing...
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <ChatInput
                onSendMessage={onSendMessage}
                onUploadFile={onUploadFile}
                replyingTo={replyingTo}
                onCancelReply={onCancelReply}
                onStartTyping={onStartTyping}
                onStopTyping={onStopTyping}
            />
        </main>
    );
};

export default ChatArea;
