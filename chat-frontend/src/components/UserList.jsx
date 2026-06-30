import { useState, useEffect } from "react";
import { X, Users, Check } from "lucide-react";
import API from "../services/api";
import { UserListSkeleton } from "./LoadingSkeletons";
import { useToast } from "../context/toast";

function UserList({ onClose, onChatCreated }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(null);
    const [error, setError] = useState("");

    const [groupMode, setGroupMode] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedUsers, setSelectedUsers] = useState([]);

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
    const toast = useToast();

    useEffect(() => {
        fetchUsers();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await API.get("/users");
            // Backend already excludes current user, but filter client-side as a safety net
            const filtered = (res.data.data || []).filter(
                (u) => u._id !== currentUser._id
            );
            setUsers(filtered);
        } catch {
            setError("Failed to load users");
            toast.error("Failed to load users. Please try again.", {
                title: "Users Unavailable",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUserClick = async (userId) => {
        if (groupMode) {
            setSelectedUsers(prev =>
                prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
            );
            return;
        }

        try {
            setCreating(userId);
            setError("");
            const res = await API.post("/chats", { userId });
            toast.success("Chat created successfully.", { title: "New Chat Ready" });
            onChatCreated(res.data.data);
        } catch {
            setError("Failed to create chat");
            toast.error("Failed to create chat. Please try again.", {
                title: "Chat Creation Failed",
            });
        } finally {
            setCreating(null);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedUsers.length < 1) {
            setError("Group name and at least 1 other user required.");
            toast.warning("Add a group name and select at least one user.", {
                title: "Group Details Missing",
            });
            return;
        }

        try {
            setCreating("group");
            setError("");
            const res = await API.post("/chats/group", {
                name: groupName,
                participants: selectedUsers
            });
            toast.success("Group chat created successfully.", {
                title: "Group Created",
            });
            onChatCreated(res.data.data);
        } catch {
            setError("Failed to create group");
            toast.error("Failed to create group. Please try again.", {
                title: "Group Creation Failed",
            });
        } finally {
            setCreating(null);
        }
    };

    const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "?");

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.header}>
                    <h3 style={styles.title}>{groupMode ? "New Group Chat" : "New Chat"}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div style={styles.body}>
                    {!groupMode && (
                        <button
                            style={styles.newGroupBtn}
                            onClick={() => setGroupMode(true)}
                        >
                            <div style={styles.newGroupIcon}><Users size={18} /></div>
                            <span style={styles.newGroupText}>New Group Chat</span>
                        </button>
                    )}

                    {groupMode && (
                        <div style={styles.groupInputContainer}>
                            <input
                                autoFocus
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="Group Subject"
                                style={styles.groupInput}
                            />
                        </div>
                    )}

                    {loading ? (
                        <UserListSkeleton />
                    ) : error ? (
                        <p style={styles.errorText}>{error}</p>
                    ) : users.length === 0 ? (
                        <p style={styles.placeholder}>No other users found</p>
                    ) : (
                        users.map((u) => (
                            <div
                                key={u._id}
                                onClick={() => handleUserClick(u._id)}
                                style={{
                                    ...styles.userItem,
                                    opacity: creating === u._id ? 0.5 : 1,
                                    pointerEvents: creating ? "none" : "auto",
                                    background: selectedUsers.includes(u._id) ? "var(--bg-surface-active)" : "transparent",
                                    border: selectedUsers.includes(u._id) ? "1px solid var(--border-strong)" : "1px solid transparent",
                                }}
                            >
                                <div style={styles.avatar}>
                                    {getInitial(u.name)}
                                </div>
                                <div style={styles.userInfo}>
                                    <span style={styles.userName}>{u.name}</span>
                                    <span style={styles.userEmail}>{u.email}</span>
                                </div>
                                {groupMode && (
                                    <div style={{
                                        ...styles.checkbox,
                                        background: selectedUsers.includes(u._id) ? "var(--accent-gradient-start)" : "transparent",
                                        borderColor: selectedUsers.includes(u._id) ? "var(--accent-gradient-start)" : "var(--border-default)"
                                    }}>
                                        {selectedUsers.includes(u._id) && <Check size={12} />}
                                    </div>
                                )}
                                {!groupMode && (
                                    <span
                                        style={{
                                            ...styles.statusDot,
                                            background:
                                                u.status === "online"
                                                    ? "var(--accent-success-text)"
                                                    : "var(--border-medium)",
                                        }}
                                    />
                                )}
                            </div>
                        ))
                    )}
                </div>
                {groupMode && (
                    <div style={styles.footer}>
                        <button
                            style={{
                                ...styles.createGroupBtn,
                                opacity: (!groupName.trim() || selectedUsers.length < 1 || creating) ? 0.5 : 1,
                            }}
                            disabled={!groupName.trim() || selectedUsers.length < 1 || creating}
                            onClick={handleCreateGroup}
                        >
                            {creating === "group" ? "Creating..." : `Create Group (${selectedUsers.length})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Styles ─── */
const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "var(--bg-overlay)",
        backdropFilter: "var(--blur-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
    },
    modal: {
        background: "var(--bg-elevated)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-3xl)",
        width: "100%",
        maxWidth: "420px",
        maxHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow-xl)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "var(--space-xl) var(--space-2xl)",
        borderBottom: "1px solid var(--border-default)",
    },
    title: {
        margin: 0,
        fontSize: "var(--fs-heading)",
        fontWeight: "var(--fw-bold)",
        color: "var(--text-primary)",
    },
    closeBtn: {
        background: "var(--border-medium)",
        border: "none",
        color: "var(--text-secondary)",
        fontSize: "var(--fs-body-sm)",
        width: "var(--space-4xl)",
        height: "var(--space-4xl)",
        borderRadius: "var(--radius-lg)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    body: {
        flex: 1,
        overflowY: "auto",
        padding: "var(--space-sm)",
    },
    userItem: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-md) var(--space-lg)",
        borderRadius: "var(--radius-xl)",
        cursor: "pointer",
        transition: "background var(--transition-normal)",
        marginBottom: "2px",
    },
    avatar: {
        width: "var(--avatar-md)",
        height: "var(--avatar-md)",
        borderRadius: "var(--radius-xl)",
        background: "var(--accent-gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "var(--fw-bold)",
        fontSize: "var(--fs-body-lg)",
        color: "var(--text-primary)",
        flexShrink: 0,
    },
    userInfo: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        minWidth: 0,
    },
    userName: {
        fontWeight: "var(--fw-semibold)",
        fontSize: "var(--fs-body-sm)",
        color: "var(--text-primary)",
    },
    userEmail: {
        fontSize: "var(--fs-micro)",
        color: "var(--text-muted)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    statusDot: {
        width: "10px",
        height: "10px",
        borderRadius: "var(--radius-full)",
        flexShrink: 0,
    },
    placeholder: {
        color: "var(--text-muted)",
        textAlign: "center",
        padding: "var(--space-4xl) var(--space-xl)",
        fontSize: "var(--fs-body-sm)",
    },
    errorText: {
        color: "var(--accent-danger-light)",
        textAlign: "center",
        padding: "var(--space-4xl) var(--space-xl)",
        fontSize: "var(--fs-body-sm)",
    },
    newGroupBtn: {
        display: "flex",
        alignItems: "center",
        gap: "var(--space-md)",
        padding: "var(--space-md) var(--space-lg)",
        borderRadius: "var(--radius-xl)",
        cursor: "pointer",
        background: "var(--bg-surface-active)",
        border: "1px solid var(--border-medium)",
        marginBottom: "var(--space-lg)",
        width: "100%",
        transition: "all var(--transition-smooth)",
    },
    newGroupIcon: {
        width: "var(--avatar-md)",
        height: "var(--avatar-md)",
        borderRadius: "var(--radius-xl)",
        background: "var(--accent-gradient-start)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--fs-subheading)",
    },
    newGroupText: {
        fontWeight: "var(--fw-semibold)",
        fontSize: "var(--fs-body)",
        color: "var(--text-primary)",
    },
    groupInputContainer: {
        padding: "0 var(--space-lg) var(--space-lg)",
        borderBottom: "1px solid var(--border-default)",
        marginBottom: "var(--space-sm)",
    },
    groupInput: {
        width: "100%",
        boxSizing: "border-box",
        padding: "12px var(--space-lg)",
        borderRadius: "var(--radius-xl)",
        background: "var(--bg-input)",
        border: "1px solid var(--border-strong)",
        color: "var(--text-primary)",
        fontSize: "var(--fs-body)",
        outline: "none",
    },
    checkbox: {
        width: "20px",
        height: "20px",
        borderRadius: "var(--radius-full)",
        border: "2px solid",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--fs-micro)",
        color: "var(--text-primary)",
        flexShrink: 0,
    },
    footer: {
        padding: "var(--space-lg)",
        borderTop: "1px solid var(--border-default)",
    },
    createGroupBtn: {
        width: "100%",
        padding: "14px",
        borderRadius: "var(--radius-xl)",
        background: "var(--accent-gradient)",
        border: "none",
        color: "var(--text-primary)",
        fontWeight: "var(--fw-semibold)",
        fontSize: "var(--fs-body)",
        cursor: "pointer",
    }
};

export default UserList;
