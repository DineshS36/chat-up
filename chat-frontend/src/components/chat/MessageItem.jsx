import React, { useState } from 'react';
import { CheckCheck, Check, Smile, Reply, Pin, Trash2, Copy, FileText, Download, Play, Pause, CornerUpLeft } from 'lucide-react';

const EMOJI_LIST = ['❤️', '👍', '🔥', '😂', '😮', '😢', '👏'];

const MessageItem = ({
    message,
    currentUser,
    isGroup,
    onReact,
    onReply,
    onDelete,
    onPin,
    onForward
}) => {
    const [showActions, setShowActions] = useState(false);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);

    const isOwn = (message.senderId?._id || message.senderId) === currentUser?._id;
    const senderName = message.senderId?.name || "Unknown";
    const senderAvatar = message.senderId?.profilePic;

    // Decrypted message text
    const content = message.content || "";

    const handleCopyText = () => {
        navigator.clipboard.writeText(content);
    };

    return (
        <li
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwn ? 'flex-end' : 'flex-start',
                margin: '8px 0',
                position: 'relative',
                padding: '0 16px'
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: isOwn ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: '8px',
                maxWidth: '72%'
            }}>
                {/* Sender Avatar for group chat */}
                {!isOwn && isGroup && (
                    <div style={{ flexShrink: 0, marginBottom: '4px' }}>
                        {senderAvatar ? (
                            <img
                                src={senderAvatar}
                                alt={senderName}
                                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                        ) : (
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                backgroundColor: '#6366f1',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {senderName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                )}

                {/* Message Bubble Box */}
                <div style={{
                    position: 'relative',
                    borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    padding: '10px 14px',
                    background: isOwn
                        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                        : 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(8px)',
                    border: isOwn ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    boxShadow: isOwn
                        ? '0 4px 16px rgba(99, 102, 241, 0.25)'
                        : '0 2px 10px rgba(0, 0, 0, 0.15)',
                    fontSize: '14px',
                    lineHeight: '1.45'
                }}>
                    {/* Hover Reaction & Quick Actions Toolbar */}
                    {showActions && (
                        <div style={{
                            position: 'absolute',
                            top: '-36px',
                            [isOwn ? 'left' : 'right']: '0',
                            backgroundColor: 'rgba(25, 20, 44, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(12px)',
                            borderRadius: '24px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                            zIndex: 20
                        }}>
                            {/* Emoji reaction buttons */}
                            {EMOJI_LIST.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => onReact(message._id, emoji)}
                                    style={actionIconStyle}
                                >
                                    {emoji}
                                </button>
                            ))}
                            <div style={{ width: '1px', height: '16px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 2px' }} />
                            <button onClick={() => onReply(message)} style={actionIconStyle} title="Reply">
                                <Reply size={14} color="rgba(255,255,255,0.8)" />
                            </button>
                            <button onClick={handleCopyText} style={actionIconStyle} title="Copy">
                                <Copy size={14} color="rgba(255,255,255,0.8)" />
                            </button>
                            {isOwn && (
                                <button onClick={() => onDelete(message._id)} style={actionIconStyle} title="Delete">
                                    <Trash2 size={14} color="#ef4444" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Group Sender Name */}
                    {!isOwn && isGroup && (
                        <div style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            color: '#818cf8',
                            marginBottom: '4px'
                        }}>
                            {senderName}
                        </div>
                    )}

                    {/* Reply Preview inside Bubble */}
                    {message.replyTo && (
                        <div style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: isOwn ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                            borderLeft: '3px solid #818cf8',
                            marginBottom: '6px',
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.8)'
                        }}>
                            <div style={{ fontWeight: '600', color: '#a5b4fc', fontSize: '11px' }}>
                                Replying to message
                            </div>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {message.replyTo.content || "Media / Attachment"}
                            </div>
                        </div>
                    )}

                    {/* Media Attachments */}
                    {message.mediaUrl && (
                        <div style={{ marginBottom: '8px', borderRadius: '10px', overflow: 'hidden' }}>
                            {message.type === 'image' || message.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                    src={message.mediaUrl}
                                    alt="attachment"
                                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'cover' }}
                                />
                            ) : message.type === 'video' || message.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                    src={message.mediaUrl}
                                    controls
                                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                                />
                            ) : message.type === 'audio' || message.mediaUrl.match(/\.(mp3|wav|ogg)$/i) ? (
                                <audio src={message.mediaUrl} controls style={{ width: '240px' }} />
                            ) : (
                                <a
                                    href={message.mediaUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                        color: '#818cf8',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <FileText size={18} />
                                    <span style={{ fontSize: '13px', textDecoration: 'underline' }}>Download Attachment</span>
                                    <Download size={14} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Text Message Content */}
                    <div style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {content}
                    </div>

                    {/* Footer: Time & Status receipts */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '4px',
                        marginTop: '4px',
                        fontSize: '10px',
                        color: isOwn ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)'
                    }}>
                        <span>
                            {new Date(message.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOwn && (
                            message.status === 'read' ? (
                                <CheckCheck size={13} color="#93c5fd" />
                            ) : message.status === 'delivered' ? (
                                <CheckCheck size={13} color="rgba(255,255,255,0.7)" />
                            ) : (
                                <Check size={13} color="rgba(255,255,255,0.5)" />
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* Emoji Reactions Badges */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '4px',
                    marginTop: '4px',
                    marginLeft: isOwn ? '0' : '36px'
                }}>
                    {Object.entries(message.reactions).map(([emoji, userIds]) => {
                        if (!userIds || userIds.length === 0) return null;
                        return (
                            <span
                                key={emoji}
                                onClick={() => onReact(message._id, emoji)}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 6px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(25, 20, 44, 0.8)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    fontSize: '11px',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                {emoji} {userIds.length}
                            </span>
                        );
                    })}
                </div>
            )}
        </li>
    );
};

const actionIconStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '3px',
    borderRadius: '4px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.15s ease'
};

export default MessageItem;
