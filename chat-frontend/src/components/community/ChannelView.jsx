import React, { useState, useEffect } from "react";
import socket from "../../socket/socket";

const ChannelView = ({ channel, user }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");

    // Pseudo-fetch logic to emulate the DM system fetching but bound to the channel Id
    useEffect(() => {
        if (!channel) return;

        // Notify socket of new room
        socket.emit("join_channel", channel._id);

        const receiveHandler = (msg) => {
            if (msg.channelId === channel._id) {
                setMessages(prev => [...prev, msg]);
            }
        };

        socket.on("channel_message", receiveHandler);

        return () => {
            socket.emit("leave_channel", channel._id);
            socket.off("channel_message", receiveHandler);
        }
    }, [channel]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        // Optimistically push
        const newMsg = {
            _id: Date.now().toString(),
            channelId: channel._id,
            sender: user,
            content: inputText.trim(),
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, newMsg]);
        setInputText("");

        // Emitting using unified event logic (assuming backend proxies this to participants)
        socket.emit("send_channel_message", {
            channelId: channel._id,
            senderId: user._id,
            content: newMsg.content
        });
    };

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <span style={styles.hash}>#</span>
                <h3 style={styles.title}>{channel.name}</h3>
                {channel.description && <span style={styles.desc}>| {channel.description}</span>}
            </div>

            {/* Feed */}
            <div style={styles.feed}>
                {messages.length === 0 ? (
                    <div style={styles.welcomeState}>
                        <h1>Welcome to #{channel.name}!</h1>
                        <p>This is the start of the #{channel.name} channel.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} style={styles.messageRow}>
                            <div style={styles.msgAvatar}>{msg.sender?.name?.charAt(0) || '?'}</div>
                            <div style={styles.msgBody}>
                                <div style={styles.msgInfo}>
                                    <span style={styles.msgSender}>{msg.sender?.name || 'Unknown'}</span>
                                    <span style={styles.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div style={styles.msgContent}>{msg.content}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Bar */}
            <div style={styles.inputArea}>
                <form onSubmit={handleSend} style={styles.inputForm}>
                    <button type="button" style={styles.attachBtn}>+</button>
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={`Message #${channel.name}`}
                        style={styles.textInput}
                    />
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)"
    },
    header: {
        height: "64px",
        padding: "0 var(--space-lg)",
        display: "flex",
        alignItems: "center",
        borderBottom: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
        zIndex: 5
    },
    hash: {
        fontSize: "var(--space-2xl)",
        color: "var(--text-muted)",
        marginRight: "var(--space-sm)",
        fontWeight: "300"
    },
    title: {
        margin: 0,
        fontSize: "var(--fs-body-lg)",
        fontWeight: "var(--fw-semibold)"
    },
    desc: {
        marginLeft: "var(--space-md)",
        fontSize: "var(--fs-body-sm)",
        color: "var(--text-tertiary)"
    },
    feed: {
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end"
    },
    welcomeState: {
        padding: "var(--space-4xl) var(--space-lg)",
        marginTop: "auto"
    },
    messageRow: {
        display: "flex",
        gap: "var(--space-lg)",
        marginBottom: "var(--space-lg)",
    },
    msgAvatar: {
        width: "40px",
        height: "40px",
        borderRadius: "var(--radius-full)",
        background: "var(--accent-gradient)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: "bold",
        fontSize: "var(--fs-subheading)",
        color: "var(--text-primary)",
        flexShrink: 0
    },
    msgBody: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
    },
    msgInfo: {
        display: "flex",
        alignItems: "baseline",
        gap: "var(--space-sm)",
        marginBottom: "var(--space-xs)"
    },
    msgSender: {
        fontWeight: "var(--fw-semibold)",
        color: "var(--text-primary)",
        fontSize: "var(--fs-body)"
    },
    msgTime: {
        fontSize: "var(--fs-small)",
        color: "var(--text-muted)"
    },
    msgContent: {
        color: "var(--text-secondary)",
        fontSize: "var(--fs-body)",
        lineHeight: "1.4"
    },
    inputArea: {
        padding: "0 var(--space-lg) var(--space-2xl)"
    },
    inputForm: {
        display: "flex",
        alignItems: "center",
        backgroundColor: "var(--bg-elevated)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-lg) var(--space-lg)",
        gap: "var(--space-md)"
    },
    attachBtn: {
        background: "var(--border-medium)",
        border: "none",
        color: "var(--text-secondary)",
        width: "var(--space-2xl)",
        height: "var(--space-2xl)",
        borderRadius: "var(--radius-full)",
        cursor: "pointer",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontSize: "var(--fs-subheading)",
        flexShrink: 0
    },
    textInput: {
        flex: 1,
        background: "transparent",
        border: "none",
        color: "var(--text-primary)",
        fontSize: "var(--fs-body)",
        outline: "none"
    }
};

export default ChannelView;
