import React, { useState } from 'react';
import { Search, Plus, Users, User, MessageSquare, LogOut, CheckCheck, Check, ShieldCheck, Circle } from 'lucide-react';

const ChatSidebar = ({
    user,
    chats,
    selectedChatId,
    onSelectChat,
    searchQuery,
    onSearchChange,
    onlineStatuses,
    onOpenCreateGroup,
    onLogout,
    unreadFilter,
    setUnreadFilter
}) => {
    const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'group'

    // Filter chats based on tab and search
    const filteredChats = chats.filter(chat => {
        // Tab filter
        if (activeTab === 'direct' && chat.isGroup) return false;
        if (activeTab === 'group' && !chat.isGroup) return false;
        if (unreadFilter) {
            const unreadCount = chat.unreadCounts?.[user?._id] || 0;
            if (unreadCount === 0) return false;
        }

        // Search filter
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        
        if (chat.isGroup) {
            return chat.name?.toLowerCase().includes(q);
        } else {
            const otherUser = chat.participants?.find(p => p._id !== user?._id);
            return (
                otherUser?.name?.toLowerCase().includes(q) ||
                otherUser?.email?.toLowerCase().includes(q)
            );
        }
    });

    const getChatDisplayName = (chat) => {
        if (chat.isGroup) return chat.name || "Group Chat";
        const otherUser = chat.participants?.find(p => p._id !== user?._id);
        return otherUser?.name || "Direct Message";
    };

    const getChatDisplayAvatar = (chat) => {
        if (chat.isGroup) return chat.avatar || null;
        const otherUser = chat.participants?.find(p => p._id !== user?._id);
        return otherUser?.profilePic || null;
    };

    const isUserOnline = (chat) => {
        if (chat.isGroup) return false;
        const otherUser = chat.participants?.find(p => p._id !== user?._id);
        if (!otherUser) return false;
        return onlineStatuses[otherUser._id] === 'online' || otherUser.status === 'online';
    };

    return (
        <aside className="chat-sidebar-container" style={{
            width: '360px',
            minWidth: '320px',
            height: '100%',
            backgroundColor: 'var(--bg-sidebar, #120e20)',
            borderRight: '1px solid var(--border-default, rgba(255, 255, 255, 0.08))',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            zIndex: 10
        }}>
            {/* ── Header Branding ── */}
            <div style={{
                padding: '18px 20px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                    }}>
                        <MessageSquare size={20} color="#fff" />
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            color: '#fff',
                            margin: 0,
                            letterSpacing: '-0.3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}>
                            ChatUp
                            <ShieldCheck size={14} color="#6366f1" />
                        </h2>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
                            End-to-End Encrypted
                        </span>
                    </div>
                </div>

                <button
                    onClick={onOpenCreateGroup}
                    title="Create Group Chat"
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        color: '#818cf8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* ── Search Input ── */}
            <div style={{ padding: '14px 16px 10px' }}>
                <div style={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <Search size={16} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '12px' }} />
                    <input
                        type="text"
                        placeholder="Search chats or messages..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px 12px 10px 36px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.06)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            fontSize: '13px',
                            outline: 'none',
                            transition: 'all 0.2s ease'
                        }}
                    />
                </div>
            </div>

            {/* ── Filter Tabs ── */}
            <div style={{
                display: 'flex',
                gap: '6px',
                padding: '4px 16px 12px',
                borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                overflowX: 'auto'
            }}>
                {[
                    { id: 'all', label: 'All', icon: MessageSquare },
                    { id: 'direct', label: 'Direct', icon: User },
                    { id: 'group', label: 'Groups', icon: Users },
                ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id && !unreadFilter;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setUnreadFilter(false);
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: isActive ? '600' : '400',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                                border: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Icon size={13} />
                            {tab.label}
                        </button>
                    );
                })}

                <button
                    onClick={() => setUnreadFilter(!unreadFilter)}
                    style={{
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: unreadFilter ? '600' : '400',
                        color: unreadFilter ? '#4ade80' : 'rgba(255,255,255,0.5)',
                        backgroundColor: unreadFilter ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
                        border: unreadFilter ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid transparent',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                    }}
                >
                    Unread
                </button>
            </div>

            {/* ── Chat List ── */}
            <div className="custom-scrollbar" style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px 10px'
            }}>
                {filteredChats.length === 0 ? (
                    <div style={{
                        padding: '40px 20px',
                        textAlign: 'center',
                        color: 'rgba(255,255,255,0.4)',
                        fontSize: '13px'
                    }}>
                        No conversations found
                    </div>
                ) : (
                    filteredChats.map(chat => {
                        const isSelected = chat._id === selectedChatId;
                        const isOnline = isUserOnline(chat);
                        const displayName = getChatDisplayName(chat);
                        const avatarUrl = getChatDisplayAvatar(chat);
                        const unreadCount = chat.unreadCounts?.[user?._id] || 0;
                        const lastMsg = chat.lastMessage;
                        const isSentByMe = lastMsg?.senderId === user?._id || lastMsg?.senderId?._id === user?._id;

                        return (
                            <div
                                key={chat._id}
                                onClick={() => onSelectChat(chat._id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 12px',
                                    borderRadius: '12px',
                                    backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                                    border: isSelected ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                                    marginBottom: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                            >
                                {/* Avatar */}
                                <div style={{ position: 'relative', flexShrink: 0 }}>
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={displayName}
                                            style={{
                                                width: '44px',
                                                height: '44px',
                                                borderRadius: '50%',
                                                objectFit: 'cover'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: chat.isGroup
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

                                    {/* Online dot indicator */}
                                    {isOnline && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '2px',
                                            right: '2px',
                                            width: '11px',
                                            height: '11px',
                                            borderRadius: '50%',
                                            backgroundColor: '#10b981',
                                            border: '2px solid var(--bg-sidebar, #120e20)',
                                            boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)'
                                        }} />
                                    )}
                                </div>

                                {/* Chat Details */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        marginBottom: '3px'
                                    }}>
                                        <span style={{
                                            fontSize: '14px',
                                            fontWeight: unreadCount > 0 ? '700' : '600',
                                            color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {displayName}
                                        </span>

                                        {lastMsg?.createdAt && (
                                            <span style={{
                                                fontSize: '11px',
                                                color: unreadCount > 0 ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                                fontWeight: unreadCount > 0 ? '600' : '400'
                                            }}>
                                                {new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '6px'
                                    }}>
                                        <span style={{
                                            fontSize: '12px',
                                            color: unreadCount > 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
                                            fontWeight: unreadCount > 0 ? '500' : '400',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {isSentByMe && (
                                                lastMsg?.status === 'read' ? (
                                                    <CheckCheck size={13} color="#60a5fa" />
                                                ) : lastMsg?.status === 'delivered' ? (
                                                    <CheckCheck size={13} color="rgba(255,255,255,0.5)" />
                                                ) : (
                                                    <Check size={13} color="rgba(255,255,255,0.4)" />
                                                )
                                            )}
                                            {lastMsg?.content || (chat.isGroup ? "Group created" : "No messages yet")}
                                        </span>

                                        {unreadCount > 0 && (
                                            <span style={{
                                                padding: '2px 7px',
                                                borderRadius: '10px',
                                                backgroundColor: '#6366f1',
                                                color: '#fff',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                minWidth: '18px',
                                                textAlign: 'center'
                                            }}>
                                                {unreadCount}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* ── User Footer ── */}
            <div style={{
                padding: '14px 16px',
                borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.05))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: '700',
                        fontSize: '14px'
                    }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                            {user?.name || 'User'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Circle size={8} fill="#10b981" color="#10b981" />
                            Online
                        </div>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    title="Logout"
                    style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                >
                    <LogOut size={16} />
                </button>
            </div>
        </aside>
    );
};

export default ChatSidebar;
