import React from "react";

const shimmerKeyframes = `
@keyframes skeletonShimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}
@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
`;

const baseStyles = {
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "skeletonShimmer 1.4s ease-in-out infinite",
};

/**
 * Base Skeleton component with shimmer animation.
 * Usable as default or named export.
 */
export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-md)",
  className = "",
  style = {},
  ...props
}) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div
        aria-hidden="true"
        className={`skeleton ${className}`.trim()}
        style={{
          ...baseStyles,
          width,
          height,
          borderRadius,
          ...style,
        }}
        {...props}
      />
    </>
  );
}

// Global styles component for shimmer animation
export const SkeletonStyles = () => <style>{shimmerKeyframes}</style>;

// Skeleton for circular elements (avatars)
export const CircleSkeleton = ({ size = "40px", className = "", style = {} }) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius="50%"
    className={className}
    style={style}
  />
);

// Skeleton for text lines
export const TextSkeleton = ({
  lines = 1,
  lineHeight = "16px",
  lineWidth = "100%",
  gap = "8px",
  lastLineWidth = "60%",
}) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : lineWidth}
        />
      ))}
    </div>
  );
};

// Single chat message skeleton
export const MessageSkeleton = ({ isOwn = false }) => {
  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        flexDirection: isOwn ? "row-reverse" : "row",
        alignItems: "flex-start",
      }}
    >
      <CircleSkeleton size="40px" />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          maxWidth: "70%",
          alignItems: isOwn ? "flex-end" : "flex-start",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Skeleton width="80px" height="14px" />
          <Skeleton width="40px" height="12px" />
        </div>
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-xl)",
            background: isOwn
              ? "linear-gradient(135deg, #667eea20, #764ba220)"
              : "var(--bg-glass)",
            minWidth: "120px",
          }}
        >
          <TextSkeleton lines={2} lineHeight="16px" gap="8px" />
        </div>
      </div>
    </div>
  );
};

// Single chat list item skeleton
export const ChatListItemSkeleton = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <CircleSkeleton size="48px" />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton width="120px" height="16px" />
          <Skeleton width="40px" height="12px" />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton width="70%" height="14px" />
          <Skeleton width="20px" height="20px" borderRadius="50%" />
        </div>
      </div>
    </div>
  );
};

// Single user list item skeleton
export const UserListItemSkeleton = () => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <CircleSkeleton size="40px" />
      <Skeleton width="60%" height="16px" />
      <Skeleton width="24px" height="24px" borderRadius="50%" />
    </div>
  );
};

// Card skeleton for general content
export const CardSkeleton = ({ hasImage = true }) => {
  return (
    <div
      style={{
        padding: "16px",
        borderRadius: "var(--radius-xl)",
        backgroundColor: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <CircleSkeleton size="48px" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
          <Skeleton width="70%" height="16px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>
      {hasImage && <Skeleton width="100%" height="160px" borderRadius="var(--radius-lg)" />}
      <TextSkeleton lines={2} lineHeight="14px" gap="6px" />
    </div>
  );
};

// Multi-item chat list skeleton
export function ChatListSkeleton({ count = 6 }) {
  return (
    <div style={{ padding: "var(--space-sm)" }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`chat-skeleton-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            padding: "var(--space-md) var(--space-lg)",
            marginBottom: "var(--space-xs)",
            borderRadius: "var(--radius-xl)",
          }}
        >
          <Skeleton width="44px" height="44px" borderRadius="var(--radius-xl)" />
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "var(--space-md)",
                marginBottom: "var(--space-sm)",
              }}
            >
              <Skeleton width="45%" height="14px" />
              <Skeleton width="48px" height="10px" />
            </div>
            <Skeleton width={index % 2 === 0 ? "85%" : "65%"} height="12px" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Multi-item message list skeleton
export function MessageListSkeleton({ count = 8 }) {
  return (
    <div
      style={{
        padding: "var(--space-lg)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-md)",
      }}
    >
      {Array.from({ length: count }).map((_, index) => {
        const isOwn = index % 3 === 0;
        return (
          <div
            key={`message-skeleton-${index}`}
            style={{
              display: "flex",
              justifyContent: isOwn ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "68%",
                width: isOwn ? "52%" : "60%",
              }}
            >
              {!isOwn && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-sm)",
                    marginBottom: "var(--space-xs)",
                  }}
                >
                  <Skeleton width="22px" height="22px" borderRadius="var(--radius-full)" />
                  <Skeleton width="90px" height="10px" />
                </div>
              )}
              <Skeleton
                height={index % 4 === 0 ? "68px" : "52px"}
                borderRadius="18px"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Multi-item user list skeleton
export function UserListSkeleton({ count = 6 }) {
  return (
    <div style={{ padding: "var(--space-sm)" }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`user-skeleton-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-md)",
            padding: "var(--space-md) var(--space-lg)",
            marginBottom: "2px",
          }}
        >
          <Skeleton width="44px" height="44px" borderRadius="var(--radius-xl)" />
          <div style={{ flex: 1 }}>
            <Skeleton width="38%" height="13px" style={{ marginBottom: "8px" }} />
            <Skeleton width="62%" height="11px" />
          </div>
          <Skeleton width="10px" height="10px" borderRadius="var(--radius-full)" />
        </div>
      ))}
    </div>
  );
}

// Multi-item status/story list skeleton
export function StatusListSkeleton({ count = 4 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`status-skeleton-${index}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-lg)",
            padding: "var(--space-md)",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-glass)",
          }}
        >
          <Skeleton width="56px" height="56px" borderRadius="28px" />
          <div style={{ flex: 1 }}>
            <Skeleton width={index % 2 === 0 ? "34%" : "48%"} height="14px" style={{ marginBottom: "8px" }} />
            <Skeleton width="28%" height="11px" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
