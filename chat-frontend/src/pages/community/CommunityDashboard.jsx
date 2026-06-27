import React, { useState, useEffect } from "react";
import CommunitySidebar from "../../components/community/CommunitySidebar";
import ChannelSidebar from "../../components/community/ChannelSidebar";
import ChannelView from "../../components/community/ChannelView";

const CommunityDashboard = ({ user }) => {
    const [communities, setCommunities] = useState([]);
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [activeChannel, setActiveChannel] = useState(null);

    return (
        <div style={styles.dashboardContainer}>
            {/* Leftmost Sidebar: Server List */}
            <CommunitySidebar
                communities={communities}
                activeCommunity={activeCommunity}
                onSelectCommunity={setActiveCommunity}
            />

            {/* Middle Sidebar: Channels inside active community */}
            {activeCommunity && (
                <ChannelSidebar
                    community={activeCommunity}
                    activeChannel={activeChannel}
                    onSelectChannel={setActiveChannel}
                />
            )}

            {/* Right Feed: Messages in active channel */}
            {activeChannel ? (
                <ChannelView channel={activeChannel} user={user} />
            ) : (
                <div style={styles.emptyState}>
                    Select a channel to start talking!
                </div>
            )}
        </div>
    );
};

const styles = {
    dashboardContainer: {
        display: "flex",
        height: "100vh",
        backgroundColor: "var(--bg-space)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-family)"
    },
    emptyState: {
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        backgroundColor: "var(--bg-surface)",
        color: "var(--text-muted)",
        fontSize: "var(--fs-subheading)"
    }
};

export default CommunityDashboard;
