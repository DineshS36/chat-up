const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf-8');

const regex = /\/\* =========================================\s*5\. MOBILE BREAKPOINT \(< 768px\)\s*========================================= \*\/[\s\S]*?@media screen and \(max-width: 767px\) \{[\s\S]*?\}\n\}/;

const replacement = `/* =========================================
   5. MOBILE BREAKPOINT (< 768px)
   ========================================= */
@media screen and (max-width: 767px) {
  .chat-container {
    height: 100dvh !important;
    overflow: hidden;
  }

  /* Drawer Sidebar */
  .chat-sidebar {
    position: fixed !important;
    z-index: 1000;
    left: 0;
    top: 0;
    height: 100dvh !important;
    width: 85vw !important;
    max-width: 320px !important;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-right: none !important;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.5);
  }

  .chat-sidebar.drawer-open {
    transform: translateX(0);
  }

  .chat-sidebar.drawer-closed {
    transform: translateX(-100%);
  }

  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 999;
    backdrop-filter: blur(4px);
  }

  /* Main Area takes 100% width always */
  .chat-main {
    width: 100% !important;
    min-width: 100% !important;
    height: 100dvh !important;
  }

  /* Touch Targets (44x44 minimums) */
  .touch-target,
  .chat-header button,
  .msg-actions button,
  .reaction-picker button,
  .reaction-chip,
  .chat-item {
    min-width: 44px;
    min-height: 44px;
  }

  .chat-header button,
  .msg-actions button,
  .reaction-picker button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-menu-btn {
    display: flex !important;
    background: none;
    border: none;
    color: var(--text-primary);
    cursor: pointer;
    margin-right: 8px;
    padding: 0;
  }

  .mobile-only-header {
    display: flex !important;
  }

  .chat-messages-area {
    padding: 8px 10px !important;
  }
  
  .msg-bubble {
    padding: 10px 14px !important;
  }

  .chat-input-bar {
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom)) !important;
    position: sticky;
    bottom: 0;
    background: var(--bg-surface);
    z-index: 10;
  }

  .chat-input-field {
    padding: 10px 12px;
    font-size: 16px;
  }
}`;

css = css.replace(regex, replacement);
fs.writeFileSync('index.css', css);
