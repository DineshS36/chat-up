import React from "react";

const ChannelSidebar = ({ community, activeChannel, onSelectChannel }) => {
    return (
        <div style={styles.sidebar}>
            {/* Header */}
            <div style={styles.header}>
                <h3 style={styles.title}>{community.name}</h3>
                <span style={styles.subtitle}>Active Server</span>
            </div>

            {/* Channels List */}
            <div style={styles.list}>
                <div style={styles.categoryHeader}>
                    <span>TEXT CHANNELS</span>
                    <button style={styles.addBtn} title="Create Channel">+</button>
                </div>

                {community.channels?.map((channel) => (
                    <div
                        key={channel._id}
                        style={{
                            ...styles.channelItem,
                            ...(activeChannel?._id === channel._id ? styles.channelItemActive : {})
                        }}
                        onClick={() => onSelectChannel(channel)}
                    >
                        <span style={styles.hash}>#</span>
                        <span style={styles.channelName}>{channel.name}</span>
                    </div>
                ))}

                {(!community.channels || community.channels.length === 0) && (
                    <div style={styles.emptyText}>No channels yet</div>
                )}
            </div>

            <div style={styles.footerActions}>
                <button style={styles.inviteButton}>Invite People</button>
            </div>
        </div>
    );
};

const styles = {
    sidebar: {
        width: "var(--channel-sidebar-width)",
        minWidth: "var(--channel-sidebar-width)",
        backgroundColor: "var(--bg-sidebar)",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border-default)"
    },
    header: {
        padding: "var(--space-lg)",
        borderBottom: "1px solid var(--border-default)",
        boxShadow: "var(--shadow-sm)",
        zIndex: 10
    },
    title: {
        margin: 0,
        fontSize: "var(--fs-body-lg)",
        fontWeight: "var(--fw-bold)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    subtitle: {
        fontSize: "var(--fs-small)",
        color: "var(--text-tertiary)",
        marginTop: "var(--space-xs)",
        display: "block"
    },
    list: {
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-lg) var(--space-sm)"
    },
    categoryHeader: {
        fontSize: "var(--fs-micro)",
        fontWeight: "var(--fw-bold)",
        color: "var(--text-muted)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 var(--space-sm)",
        marginBottom: "var(--space-sm)"
    },
    addBtn: {
        background: "none",
        border: "none",
        color: "inherit",
        fontSize: "var(--fs-body-lg)",
        cursor: "pointer",
        padding: 0
    },
    channelItem: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-sm)",
        padding: "6px var(--space-sm)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        color: "var(--text-tertiary)",
        marginBottom: "2px",
        transition: "all var(--transition-fast)"
    },
    channelItemActive: {
        backgroundColor: "var(--bg-surface-active)",
        color: "var(--text-primary)"
    },
    hash: {
        fontSize: "var(--fs-subheading)",
        fontWeight: "var(--fw-regular)",
        color: "var(--text-muted)"
    },
    channelName: {
        fontSize: "var(--fs-body)",
        fontWeight: "var(--fw-medium)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    emptyText: {
        padding: "0 var(--space-sm)",
        fontSize: "var(--fs-caption)",
        color: "var(--text-muted)",
        fontStyle: "italic"
    },
    footerActions: {
        padding: "var(--space-lg)",
        borderTop: "1px solid var(--border-subtle)"
    },
    inviteButton: {
        width: "100%",
        padding: "var(--space-sm) 0",
        backgroundColor: "var(--accent-success-bg)",
        color: "var(--accent-success)",
        border: "1px solid var(--accent-success-border)",
        borderRadius: "var(--radius-sm)",
        cursor: "pointer",
        fontWeight: "var(--fw-semibold)",
        transition: "all var(--transition-smooth)"
    }
};

export default ChannelSidebar;
