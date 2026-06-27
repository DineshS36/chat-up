import React, { useState } from "react";
import api from "../../services/api";

const InviteModal = ({ community, onClose }) => {
    const [inviteLink, setInviteLink] = useState("");
    const [loading, setLoading] = useState(false);

    const generateLink = async () => {
        try {
            setLoading(true);
            const res = await api.post("/invites", { communityId: community._id, expiresInDays: 7 }); // Default to 7 days expiry
            const baseUrl = window.location.origin;
            setInviteLink(`${baseUrl}/join/${res.data.inviteCode}`);
        } catch (error) {
            console.error("Failed to make invite", error);
            alert("Error creating invite link");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                <div style={styles.header}>
                    <h3 style={{ margin: 0 }}>Invite friends to {community.name}</h3>
                    <button style={styles.closeBtn} onClick={onClose}>✕</button>
                </div>

                <div style={styles.body}>
                    <p style={styles.hintText}>Share this link with others to grant them access to this community's channels.</p>

                    {!inviteLink ? (
                        <button
                            style={styles.primaryBtn}
                            onClick={generateLink}
                            disabled={loading}
                        >
                            {loading ? "Generating..." : "Generate New Link"}
                        </button>
                    ) : (
                        <div style={styles.linkWrapper}>
                            <input
                                type="text"
                                readOnly
                                value={inviteLink}
                                style={styles.linkInput}
                            />
                            <button
                                style={styles.copyBtn}
                                onClick={() => {
                                    navigator.clipboard.writeText(inviteLink);
                                    alert('Copied to clipboard!');
                                }}
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    overlay: {
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "var(--bg-overlay)",
        backdropFilter: "var(--blur-md)",
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    modal: {
        backgroundColor: "var(--bg-elevated)",
        width: "440px",
        borderRadius: "var(--radius-xl)",
        boxShadow: "var(--shadow-xl)",
        overflow: "hidden",
        fontFamily: "var(--font-family)",
        color: "var(--text-primary)"
    },
    header: {
        padding: "var(--space-md) var(--space-xl)",
        borderBottom: "1px solid var(--border-default)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "var(--bg-glass)"
    },
    closeBtn: {
        background: "transparent", border: "none", color: "var(--text-tertiary)",
        cursor: "pointer", fontSize: "var(--fs-body-lg)"
    },
    body: {
        padding: "var(--space-xl)"
    },
    hintText: {
        fontSize: "var(--fs-body-sm)",
        color: "var(--text-secondary)",
        marginBottom: "var(--space-xl)"
    },
    primaryBtn: {
        width: "100%",
        padding: "var(--space-md)",
        backgroundColor: "var(--accent-gradient-start)",
        border: "none",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        fontWeight: "var(--fw-semibold)",
        cursor: "pointer",
        transition: "background var(--transition-normal)"
    },
    linkWrapper: {
        display: "flex",
        gap: "var(--space-sm)"
    },
    linkInput: {
        flex: 1,
        padding: "var(--space-sm)",
        backgroundColor: "var(--bg-input)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-sm)",
        color: "var(--text-primary)",
        outline: "none"
    },
    copyBtn: {
        padding: "0 var(--space-lg)",
        backgroundColor: "var(--accent-success)",
        color: "var(--text-primary)",
        border: "none",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        fontWeight: "var(--fw-semibold)"
    }
};

export default InviteModal;
