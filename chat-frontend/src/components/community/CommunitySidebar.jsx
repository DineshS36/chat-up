import React from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus } from "lucide-react";

const CommunitySidebar = ({ communities, activeCommunity, onSelectCommunity }) => {
    const navigate = useNavigate();
    return (
        <div style={styles.container}>
            {/* Direct Messages Icon (to go back to regular chat) */}
            <div style={styles.iconWrapper} onClick={() => navigate('/chat')}>
                <MessageCircle size={22} style={styles.homeIcon} />
            </div>
            <hr style={styles.divider} />

            {/* Mapped Communities */}
            {communities.map((comm) => (
                <div
                    key={comm._id}
                    style={{
                        ...styles.iconWrapper,
                        ...(activeCommunity?._id === comm._id ? styles.activeWrapper : {})
                    }}
                    onClick={() => onSelectCommunity(comm)}
                    title={comm.name}
                >
                    {comm.avatar ? (
                        <img src={comm.avatar} alt={comm.name} style={styles.avatar} />
                    ) : (
                        <div style={styles.initials}>{comm.name.charAt(0).toUpperCase()}</div>
                    )}
                </div>
            ))}

            {/* Add Community Button */}
            <div style={{ ...styles.iconWrapper, backgroundColor: "var(--bg-surface-hover)" }} title="Create/Join Community">
                <Plus size={20} style={{ color: "var(--accent-success)" }} />
            </div>
        </div>
    );
};

const styles = {
    container: {
        width: "var(--community-sidebar-width)",
        minWidth: "var(--community-sidebar-width)",
        backgroundColor: "var(--bg-space)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "var(--space-md) 0",
        gap: "var(--space-lg)",
        overflowY: "auto"
    },
    divider: {
        width: "32px",
        border: "none",
        borderBottom: "2px solid var(--border-medium)",
        margin: "var(--space-xs) 0"
    },
    iconWrapper: {
        width: "var(--space-5xl)",
        height: "var(--space-5xl)",
        borderRadius: "var(--radius-pill)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        transition: "all var(--transition-smooth)",
        position: "relative",
    },
    activeWrapper: {
        borderRadius: "var(--radius-2xl)",
        backgroundColor: "var(--border-medium)",
    },
    homeIcon: {
        fontSize: "var(--space-2xl)",
        color: "var(--text-primary)",
        opacity: 0.8
    },
    avatar: {
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        objectFit: "cover"
    },
    initials: {
        fontSize: "var(--fs-subheading)",
        fontWeight: "var(--fw-semibold)",
        color: "var(--text-primary)"
    }
};

export default CommunitySidebar;
