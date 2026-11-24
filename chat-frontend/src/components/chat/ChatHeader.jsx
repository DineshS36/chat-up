import React from 'react';
import { Phone, Video, Info, Search, Pin, ShieldCheck, MoreVertical, User, Users } from 'lucide-react';

const ChatHeader = ({
    selectedChat,
    user,
    isTyping,
    onlineStatuses,
    onToggleGroupInfo,
    onStartCall,
    onToggleSearchInChat,
    pinnedMessagesCount
}) => {
    if (!selectedChat) return null;

    const isGroup = selectedChat.isGroup;
    const otherUser = !isGroup ? selectedChat.participants?.find(p => p._id !== user?._id) : null;
    const displayName = isGroup ? (selectedChat.name || "Group Chat") : (otherUser?.name || "Direct Message");
    const avatarUrl = isGroup ? selectedChat.avatar : otherUser?.profilePic;
    
    const isOnline = !isGroup && otherUser && (onlineStatuses[otherUser._id] === 'online' || otherUser.status === 'online');

    const renderStatusSubtext = () => {
        if (isTyping) {
            return (
                <span style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span className="typing-dots">typing...</span>
                </span>
            );
        }
        if (isGroup) {
            return (
                <span style={{ color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Users size={12} />
                    {selectedChat.participants?.length || 0} members
                </span>
            );
        }
        if (isOnline) {
            return (
                <span style={{ color: '#10b981', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                    Active Now
                </span>
            );
        }
        return (
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                Offline
            </span>
        );
    };

    return (
        <header style={{
            height: '68px',
            padding: '0 24px',
            backgroundColor: 'var(--bg-surface, #19142c)',
            borderBottom: '1px solid var(--border-default, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 9
        }}>
            {/* Left: Chat info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={displayName}
                            style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '50%',
                                objectFit: 'cover'
                            }}
                        />
                    ) : (
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: isGroup
                                ? 'linear-gradient(135deg, #ec4899, #8b5cf6)'
                                : 'linear-gradient(135deg, #3b82f6, #06b6d4)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: '600',
                            fontSize: '16px'
                        }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {isOnline && (
                        <span style={{
                            position: 'absolute',
                            bottom: '1px',
                            right: '1px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#10b981',
                            border: '2px solid #19142c'
                        }} />
                    )}
                </div>

                <div>
                    <h3 style={{
                        fontSize: '16px',
                        fontWeight: '700',
                        color: '#fff',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}>
                        {displayName}
                        {!isGroup && <ShieldCheck size={14} color="#6366f1" title="Encrypted session" />}
                    </h3>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                        {renderStatusSubtext()}
                    </div>
                </div>
            </div>

            {/* Right: Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                    onClick={onToggleSearchInChat}
                    title="Search in conversation"
                    style={actionBtnStyle}
                >
                    <Search size={18} />
                </button>

                {!isGroup && (
                    <>
                        <button
                            onClick={() => onStartCall('audio')}
                            title="Start Audio Call"
                            style={actionBtnStyle}
                        >
                            <Phone size={18} />
                        </button>

                        <button
                            onClick={() => onStartCall('video')}
                            title="Start Video Call"
                            style={actionBtnStyle}
                        >
                            <Video size={18} />
                        </button>
                    </>
                )}

                {isGroup && (
                    <button
                        onClick={onToggleGroupInfo}
                        title="Group Info & Members"
                        style={actionBtnStyle}
                    >
                        <Info size={18} />
                    </button>
                )}
            </div>
        </header>
    );
};

const actionBtnStyle = {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    color: 'rgba(255, 255, 255, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
};

export default ChatHeader;
