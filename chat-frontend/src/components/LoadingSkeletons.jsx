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
`;

const baseStyles = {
  background:
    "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
  backgroundSize: "200% 100%",
  animation: "skeletonShimmer 1.4s ease-in-out infinite",
};

export function Skeleton({
  width = "100%",
  height = "16px",
  borderRadius = "var(--radius-md)",
  style = {},
}) {
  return (
    <>
      <style>{shimmerKeyframes}</style>
      <div
        aria-hidden="true"
        style={{
          ...baseStyles,
          width,
          height,
          borderRadius,
          ...style,
        }}
      />
    </>
  );
}

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
