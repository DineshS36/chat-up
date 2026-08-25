import React from 'react';
import { X, Users, UserPlus, LogOut, Shield, Crown } from 'lucide-react';

const GroupInfoModal = ({
    groupChat,
    currentUser,
    onClose,
    onAddUser,
    onRemoveUser,
    onLeaveGroup
}) => {
    if (!groupChat) return null;

    const isAdmin = (groupChat.groupAdmin?._id || groupChat.groupAdmin) === currentUser?._id;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100
        }}>
            <div style={{
                width: '420px',
                maxHeight: '85vh',
                backgroundColor: '#19142c',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '20px',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={20} color="#818cf8" />
                        Group Details
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Group Avatar & Title */}
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                        margin: '0 auto 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '28px',
                        fontWeight: '700',
                        boxShadow: '0 8px 24px rgba(236, 72, 153, 0.3)'
                    }}>
                        {groupChat.name?.charAt(0).toUpperCase() || 'G'}
                    </div>
                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 4px' }}>
                        {groupChat.name}
                    </h4>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                        {groupChat.participants?.length || 0} Members
                    </span>
                </div>

                {/* Member Actions */}
                {isAdmin && (
                    <button
                        onClick={onAddUser}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: '#818cf8',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginBottom: '16px'
                        }}
                    >
                        <UserPlus size={16} /> Add Member
                    </button>
                )}

                {/* Members List */}
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }} className="custom-scrollbar">
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Members
                    </div>
                    {groupChat.participants?.map(member => {
                        const isMemberAdmin = (groupChat.groupAdmin?._id || groupChat.groupAdmin) === member._id;
                        return (
                            <div
                                key={member._id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(255,255,255,0.03)',
                                    marginBottom: '6px'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}>
                                        {member.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {member.name}
                                            {isMemberAdmin && <Crown size={12} color="#f59e0b" title="Group Admin" />}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                                            {member.email}
                                        </div>
                                    </div>
                                </div>

                                {isAdmin && member._id !== currentUser._id && (
                                    <button
                                        onClick={() => onRemoveUser(member._id)}
                                        style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            border: 'none',
                                            color: '#ef4444',
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer: Leave Group */}
                <button
                    onClick={onLeaveGroup}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={16} /> Leave Group
                </button>
            </div>
        </div>
    );
};

export default GroupInfoModal;
