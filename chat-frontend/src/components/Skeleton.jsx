import React from "react";

// Base Skeleton component with shimmer animation
const Skeleton = ({ 
  width = "100%", 
  height = "16px", 
  borderRadius = "var(--radius-md)",
  className = "",
  style = {}
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, var(--bg-surface) 0%, var(--bg-glass-strong) 50%, var(--bg-surface) 100%)",
        backgroundSize: "200% 100%",
        animation: "skeleton-shimmer 1.5s ease-in-out infinite",
        ...style
      }}
    />
  );
};

// Skeleton for circular elements (avatars)
export const CircleSkeleton = ({ size = "40px", className = "" }) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius="50%"
    className={className}
  />
);

// Skeleton for text lines
export const TextSkeleton = ({ 
  lines = 1, 
  lineHeight = "16px", 
  lineWidth = "100%",
  gap = "8px",
  lastLineWidth = "60%"
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

// Chat message skeleton
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

// Chat list item skeleton
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

// User list item skeleton
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

// Export base Skeleton as default
export default Skeleton;

// Add global styles for shimmer animation
export const SkeletonStyles = () => (
  <style>{`
    @keyframes skeleton-shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `}</style>
);
