import { useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { ToastContext } from "../context/toast";

const toastStyles = {
  container: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "400px",
    pointerEvents: "none",
  },
  toast: {
    position: "relative",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    borderRadius: "var(--radius-xl)",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-default)",
    boxShadow: "var(--shadow-lg)",
    backdropFilter: "var(--blur-md)",
    pointerEvents: "auto",
    animation: "slideIn 0.3s ease-out",
    minWidth: "320px",
    maxWidth: "min(400px, calc(100vw - 32px))",
    overflow: "hidden",
  },
  icon: {
    flexShrink: 0,
    marginTop: "2px",
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  title: {
    margin: 0,
    fontSize: "var(--fs-body)",
    fontWeight: "var(--fw-semibold)",
    color: "var(--text-primary)",
  },
  message: {
    margin: 0,
    fontSize: "var(--fs-body-sm)",
    color: "var(--text-secondary)",
    lineHeight: 1.5,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-tertiary)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "var(--radius-sm)",
    transition: "all var(--transition-fast)",
    flexShrink: 0,
  },
  progress: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height: "3px",
    background: "var(--accent-primary)",
    borderRadius: "0 0 0 var(--radius-xl)",
    transition: "width 0.1s linear",
  },
};

const toastTypes = {
  success: {
    icon: CheckCircle,
    color: "var(--accent-success)",
    title: "Success",
  },
  error: {
    icon: AlertCircle,
    color: "var(--accent-danger)",
    title: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "var(--accent-warning)",
    title: "Warning",
  },
  info: {
    icon: Info,
    color: "var(--accent-info)",
    title: "Info",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type, message, options = {}) => {
    const id = Date.now() + Math.random();
    const duration = options.duration || 5000;

    setToasts((prev) => [...prev, { id, type, message, duration, options }]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, opts) => addToast("success", msg, opts),
    error: (msg, opts) => addToast("error", msg, opts),
    warning: (msg, opts) => addToast("warning", msg, opts),
    info: (msg, opts) => addToast("info", msg, opts),
    dismiss: removeToast,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={toastStyles.container}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }) {
  const config = toastTypes[toast.type];
  const Icon = config.icon;
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration <= 0) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.duration]);

  return (
    <div style={{
      ...toastStyles.toast,
      borderLeft: `4px solid ${config.color}`,
    }}>
      <div style={{ ...toastStyles.icon, color: config.color }}>
        <Icon size={20} />
      </div>
      <div style={toastStyles.content}>
        <h4 style={toastStyles.title}>{toast.options.title || config.title}</h4>
        <p style={toastStyles.message}>{toast.message}</p>
      </div>
      <button
        style={toastStyles.closeBtn}
        onClick={onClose}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-surface-hover)";
          e.currentTarget.style.color = "var(--text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--text-tertiary)";
        }}
      >
        <X size={16} />
      </button>
      {toast.duration > 0 && (
        <div style={{ ...toastStyles.progress, width: `${progress}%` }} />
      )}
    </div>
  );
}
