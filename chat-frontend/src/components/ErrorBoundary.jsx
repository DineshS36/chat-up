import React, { Component } from 'react';
import { AlertOctagon, RefreshCcw } from 'lucide-react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        if (import.meta.env.DEV) {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return React.cloneElement(this.props.fallback, {
                    error: this.state.error,
                    resetError: this.resetError
                });
            }
            // Default generic fallback
            return (
                <div className="error-boundary-default" style={{ padding: '20px', color: '#fff', textAlign: 'center' }}>
                    <h2>Something went wrong.</h2>
                    <button onClick={this.resetError} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--accent-primary)', color: '#fff', cursor: 'pointer' }}>Try Again</button>
                </div>
            );
        }

        return this.props.children;
    }
}

export function ChatErrorFallback({ resetError }) {
    return (
        <div className="chat-error-fallback">
            <div className="chat-error-content">
                <div className="chat-error-icon-wrapper">
                    <AlertOctagon size={48} className="chat-error-icon" />
                </div>
                <h3 className="chat-error-title">Something went wrong</h3>
                <p className="chat-error-description">
                    We encountered an unexpected error while loading this chat. 
                    Please try again or select a different conversation.
                </p>
                <button className="chat-error-btn" onClick={resetError}>
                    <RefreshCcw size={16} />
                    Try Again
                </button>
            </div>
        </div>
    );
}
