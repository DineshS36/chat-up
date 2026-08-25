import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../services/api";
import socket from "../socket/socket";
import { encryptText, decryptMessageObj } from "../utils/encryption";
import { useToast } from "../context/toast";

import ChatSidebar from "../components/chat/ChatSidebar";
import ChatArea from "../components/chat/ChatArea";
import GroupInfoModal from "../components/chat/GroupInfoModal";
import CallModal from "../components/chat/CallModal";
import UserList from "../components/UserList";

function Chat() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const toast = useToast();

    const user = JSON.parse(localStorage.getItem("user") || "{}");

    // Chat list & Selection
    const [chats, setChats] = useState([]);
    const [selectedChatId, setSelectedChatId] = useState(null);
    const [loadingChats, setLoadingChats] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [unreadFilter, setUnreadFilter] = useState(false);

    // Messages & Pagination
    const [messages, setMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [nextCursor, setNextCursor] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    // Online Statuses & Typing
    const [onlineStatuses, setOnlineStatuses] = useState({});
    const [isTyping, setIsTyping] = useState(false);

    // Modals
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);

    // WebRTC Calls
    const [callState, setCallState] = useState(null); // null | 'incoming' | 'calling' | 'connected'
    const [callType, setCallType] = useState("audio");
    const [callPeer, setCallPeer] = useState(null);
    const [incomingCallData, setIncomingCallData] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const peerConnectionRef = useRef(null);

    // Auto-select chat from URL parameter
    useEffect(() => {
        const chatId = searchParams.get("chatId");
        if (chatId) {
            setSelectedChatId(chatId);
        }
    }, [searchParams]);

    // Initial Load: Fetch User Chats
    useEffect(() => {
        if (!user._id) {
            navigate("/");
            return;
        }

        fetchChats();

        // Connect Socket.IO
        socket.connect();
        socket.emit("setup", user._id);

        return () => {
            socket.disconnect();
        };
    }, []);

    // Socket Event Subscriptions
    useEffect(() => {
        socket.on("receive_message", (newMsg) => {
            const decrypted = decryptMessageObj(newMsg);
            if (decrypted.chatId === selectedChatId) {
                setMessages(prev => [...prev, decrypted]);
            }
            // Update sidebar lastMessage
            setChats(prev => prev.map(c => {
                if (c._id === decrypted.chatId) {
                    return { ...c, lastMessage: decrypted };
                }
                return c;
            }));
        });

        socket.on("message_sent", (sentMsg) => {
            const decrypted = decryptMessageObj(sentMsg);
            if (decrypted.chatId === selectedChatId) {
                setMessages(prev => [...prev, decrypted]);
            }
        });

        socket.on("user_typing", ({ chatId }) => {
            if (chatId === selectedChatId) setIsTyping(true);
        });

        socket.on("user_stop_typing", ({ chatId }) => {
            if (chatId === selectedChatId) setIsTyping(false);
        });

        socket.on("user_status_update", ({ userId, status }) => {
            setOnlineStatuses(prev => ({ ...prev, [userId]: status }));
        });

        socket.on("account_suspended", ({ message, remainingSeconds }) => {
            toast?.error?.(`Account Suspended: ${message} (Try again in ${remainingSeconds}s)`);
        });

        socket.on("rate_limited", ({ message }) => {
            toast?.warning?.(message);
        });

        socket.on("incoming_call", ({ callerId, callerName, chatId, callType }) => {
            setIncomingCallData({ callerId, callerName, chatId, callType });
            setCallPeer({ id: callerId, name: callerName });
            setCallType(callType);
            setCallState("incoming");
        });

        socket.on("call_accepted", () => {
            setCallState("connected");
        });

        socket.on("call_rejected", () => {
            setCallState(null);
            toast?.info?.("Call declined");
        });

        socket.on("end_call", () => {
            cleanupCall();
        });

        return () => {
            socket.off("receive_message");
            socket.off("message_sent");
            socket.off("user_typing");
            socket.off("user_stop_typing");
            socket.off("user_status_update");
            socket.off("account_suspended");
            socket.off("rate_limited");
            socket.off("incoming_call");
            socket.off("call_accepted");
            socket.off("call_rejected");
            socket.off("end_call");
        };
    }, [selectedChatId]);

    // Handle Chat Selection & Pagination Reset (Fixes Bug #4)
    useEffect(() => {
        if (selectedChatId) {
            // Reset pagination state immediately when switching chats
            setNextCursor(null);
            setHasMoreMessages(true);

            fetchMessages(selectedChatId);
            socket.emit("join_chat", selectedChatId);

            // Mark read
            API.put(`/chats/${selectedChatId}/read`).catch(() => {});
        } else {
            setMessages([]);
        }
    }, [selectedChatId]);

    const fetchChats = async () => {
        try {
            setLoadingChats(true);
            const res = await API.get("/chats");
            const decrypted = res.data.data.map(c => ({
                ...c,
                lastMessage: c.lastMessage ? decryptMessageObj(c.lastMessage) : null
            }));
            setChats(decrypted);
        } catch (err) {
            console.error("Failed to fetch chats:", err);
        } finally {
            setLoadingChats(false);
        }
    };

    const fetchMessages = async (chatId, cursor = null) => {
        try {
            if (cursor) {
                setLoadingOlderMessages(true);
            } else {
                setLoadingMessages(true);
            }

            const params = new URLSearchParams({ limit: '30' });
            if (cursor) params.set('before', cursor);

            const res = await API.get(`/messages/${chatId}?${params.toString()}`);
            const decrypted = res.data.data.map(decryptMessageObj);

            if (cursor) {
                setMessages(prev => [...decrypted, ...prev]);
            } else {
                setMessages(decrypted);
            }

            setHasMoreMessages(res.data.hasMore);
            setNextCursor(res.data.nextCursor);
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        } finally {
            setLoadingMessages(false);
            setLoadingOlderMessages(false);
        }
    };

    const handleSendMessage = (text) => {
        if (!selectedChatId) return;
        const currentChat = chats.find(c => c._id === selectedChatId);
        if (!currentChat) return;

        const recipient = currentChat.participants?.find(p => p._id !== user._id);
        const encryptedContent = encryptText(text);

        socket.emit("send_message", {
            chatId: selectedChatId,
            receiverId: recipient?._id || currentChat._id,
            content: encryptedContent,
            replyTo: replyingTo?._id || null
        });

        setReplyingTo(null);
    };

    const handleUploadFile = async (file) => {
        if (!selectedChatId) return;
        const currentChat = chats.find(c => c._id === selectedChatId);
        const recipient = currentChat?.participants?.find(p => p._id !== user._id);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("chatId", selectedChatId);
        formData.append("receiverId", recipient?._id || currentChat._id);

        try {
            const res = await API.post("/messages/upload", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const decrypted = decryptMessageObj(res.data.data);
            setMessages(prev => [...prev, decrypted]);
        } catch (err) {
            toast?.error?.(err.response?.data?.message || "File upload failed");
        }
    };

    const handleReactToMessage = async (messageId, emoji) => {
        try {
            const res = await API.post(`/messages/${messageId}/react`, { emoji });
            setMessages(prev => prev.map(m => m._id === messageId ? decryptMessageObj(res.data.data) : m));
        } catch (err) {
            console.error("Reaction failed:", err);
        }
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await API.delete(`/messages/${messageId}`);
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch (err) {
            console.error("Delete message failed:", err);
        }
    };

    const handleLogout = async () => {
        try {
            await API.post("/auth/logout");
        } catch (err) {
            console.warn("Logout request failed:", err);
        }
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    // WebRTC Calls
    const startCall = (type) => {
        const currentChat = chats.find(c => c._id === selectedChatId);
        const other = currentChat?.participants?.find(p => p._id !== user._id);
        if (!other) return;

        setCallPeer({ id: other._id, name: other.name });
        setCallType(type);
        setCallState("calling");

        socket.emit("call_user", {
            receiverId: other._id,
            callerName: user.name,
            chatId: selectedChatId,
            callType: type
        });
    };

    const acceptCall = () => {
        if (!incomingCallData) return;
        socket.emit("call_accepted", { callerId: incomingCallData.callerId });
        setCallState("connected");
    };

    const rejectCall = () => {
        if (!incomingCallData) return;
        socket.emit("call_rejected", { callerId: incomingCallData.callerId });
        cleanupCall();
    };

    const endCall = () => {
        if (callPeer) {
            socket.emit("end_call", { targetId: callPeer.id });
        }
        cleanupCall();
    };

    const cleanupCall = () => {
        setCallState(null);
        setCallPeer(null);
        setIncomingCallData(null);
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            setLocalStream(null);
        }
        setRemoteStream(null);
    };

    const selectedChat = chats.find(c => c._id === selectedChatId);

    return (
        <div style={{
            display: "flex",
            width: "100vw",
            height: "100vh",
            backgroundColor: "var(--bg-space, #0b0813)",
            overflow: "hidden"
        }}>
            {/* Sidebar Component */}
            <ChatSidebar
                user={user}
                chats={chats}
                selectedChatId={selectedChatId}
                onSelectChat={(id) => setSelectedChatId(id)}
                searchQuery={searchQuery}
                onSearchChange={(q) => setSearchQuery(q)}
                onlineStatuses={onlineStatuses}
                onOpenCreateGroup={() => setShowUserListModal(true)}
                onLogout={handleLogout}
                unreadFilter={unreadFilter}
                setUnreadFilter={setUnreadFilter}
            />

            {/* Main Chat Area Component */}
            <ChatArea
                selectedChat={selectedChat}
                currentUser={user}
                messages={messages}
                loadingMessages={loadingMessages}
                loadingOlderMessages={loadingOlderMessages}
                hasMoreMessages={hasMoreMessages}
                onLoadOlderMessages={() => fetchMessages(selectedChatId, nextCursor)}
                isTyping={isTyping}
                onlineStatuses={onlineStatuses}
                onSendMessage={handleSendMessage}
                onUploadFile={handleUploadFile}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
                onReactToMessage={handleReactToMessage}
                onReplyToMessage={(msg) => setReplyingTo(msg)}
                onDeleteMessage={handleDeleteMessage}
                onToggleGroupInfo={() => setShowGroupInfoModal(true)}
                onStartCall={startCall}
                onStartTyping={() => socket.emit("typing", { chatId: selectedChatId })}
                onStopTyping={() => socket.emit("stop_typing", { chatId: selectedChatId })}
            />

            {/* Group Info Drawer Modal */}
            {showGroupInfoModal && (
                <GroupInfoModal
                    groupChat={selectedChat}
                    currentUser={user}
                    onClose={() => setShowGroupInfoModal(false)}
                    onAddUser={() => {
                        setShowGroupInfoModal(false);
                        setShowUserListModal(true);
                    }}
                    onRemoveUser={async (userId) => {
                        try {
                            await API.put(`/chats/${selectedChatId}/remove`, { userId });
                            fetchChats();
                        } catch (err) {
                            toast?.error?.("Failed to remove user");
                        }
                    }}
                    onLeaveGroup={async () => {
                        try {
                            await API.put(`/chats/${selectedChatId}/leave`);
                            setSelectedChatId(null);
                            setShowGroupInfoModal(false);
                            fetchChats();
                        } catch (err) {
                            toast?.error?.("Failed to leave group");
                        }
                    }}
                />
            )}

            {/* Create Group / Select User Modal */}
            {showUserListModal && (
                <UserList
                    onClose={() => setShowUserListModal(false)}
                    onChatCreated={(newChat) => {
                        setShowUserListModal(false);
                        fetchChats();
                        setSelectedChatId(newChat._id);
                    }}
                />
            )}

            {/* WebRTC Call Modal Overlay */}
            <CallModal
                callState={callState}
                callType={callType}
                peerName={callPeer?.name}
                localStream={localStream}
                remoteStream={remoteStream}
                onAcceptCall={acceptCall}
                onRejectCall={rejectCall}
                onEndCall={endCall}
            />
        </div>
    );
}

export default Chat;
