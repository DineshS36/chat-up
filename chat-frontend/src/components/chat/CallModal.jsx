import React, { useEffect, useRef } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, PhoneCall } from 'lucide-react';

const CallModal = ({
    callState,
    callType,
    peerName,
    localStream,
    remoteStream,
    onAcceptCall,
    onRejectCall,
    onEndCall
}) => {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    if (!callState) return null; // 'calling' | 'incoming' | 'connected'

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(11, 8, 19, 0.92)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            color: '#fff'
        }}>
            {/* Incoming Call Popup */}
            {callState === 'incoming' && (
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    borderRadius: '24px',
                    backgroundColor: '#19142c',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
                    maxWidth: '360px',
                    width: '100%'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                        margin: '0 auto 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 0 30px rgba(99, 102, 241, 0.5)'
                    }}>
                        <PhoneCall size={36} color="#fff" />
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', margin: '0 0 6px' }}>
                        {peerName}
                    </h3>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', margin: '0 0 24px' }}>
                        Incoming {callType === 'video' ? 'Video' : 'Audio'} Call...
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                        <button
                            onClick={onRejectCall}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                            }}
                        >
                            <PhoneOff size={24} />
                        </button>

                        <button
                            onClick={onAcceptCall}
                            style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            <PhoneCall size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Connected / Calling View */}
            {(callState === 'calling' || callState === 'connected') && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    maxHeight: '90vh',
                    padding: '40px'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 6px' }}>{peerName}</h2>
                        <span style={{ fontSize: '13px', color: '#818cf8', fontWeight: 600 }}>
                            {callState === 'calling' ? 'Calling...' : 'Call Connected'}
                        </span>
                    </div>

                    {/* Video Streams */}
                    {callType === 'video' ? (
                        <div style={{
                            position: 'relative',
                            width: '720px',
                            height: '480px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            backgroundColor: '#000',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <video
                                ref={localVideoRef}
                                autoPlay
                                playsInline
                                muted
                                style={{
                                    position: 'absolute',
                                    bottom: '16px',
                                    right: '16px',
                                    width: '180px',
                                    height: '120px',
                                    borderRadius: '12px',
                                    objectFit: 'cover',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{
                            width: '160px',
                            height: '160px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '48px',
                            fontWeight: '700',
                            margin: '40px 0',
                            boxShadow: '0 0 50px rgba(99, 102, 241, 0.4)'
                        }}>
                            {peerName?.charAt(0).toUpperCase()}
                        </div>
                    )}

                    {/* Control Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '30px' }}>
                        <button
                            onClick={onEndCall}
                            style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                backgroundColor: '#ef4444',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.5)'
                            }}
                        >
                            <PhoneOff size={28} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CallModal;
