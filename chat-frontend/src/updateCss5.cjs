const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf-8');

const newCSS = `
/* =========================================
   COMMAND PALETTE STYLES
   ========================================= */
.cmd-palette-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999; /* Higher than everything */
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
  animation: fadeIn 0.2s ease-out;
}

.cmd-palette-modal {
  width: 100%;
  max-width: 600px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-xl);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  animation: slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

.cmd-palette-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-glass);
}

.cmd-palette-icon {
  color: var(--text-muted);
  margin-right: 12px;
}

.cmd-palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: var(--fs-body-lg);
  font-family: var(--font-family);
}

.cmd-palette-input::placeholder {
  color: var(--text-muted);
}

.cmd-palette-list {
  max-height: 350px;
  overflow-y: auto;
  padding: 8px 0;
}

.cmd-palette-item {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  color: var(--text-secondary);
  border-left: 3px solid transparent;
  transition: all 0.1s ease;
}

.cmd-palette-item.active,
.cmd-palette-item:hover {
  background: var(--bg-surface-active);
  color: var(--text-primary);
  border-left-color: var(--accent-primary);
}

.cmd-item-icon {
  margin-right: 12px;
  color: var(--accent-primary);
  opacity: 0.8;
}

.cmd-item-text {
  font-weight: var(--fw-medium);
  font-size: var(--fs-body-md);
}

.cmd-palette-message {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--fs-body-sm);
}

.cmd-palette-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 12px 20px;
  background: var(--bg-sidebar);
  border-top: 1px solid var(--border-default);
  color: var(--text-tertiary);
  font-size: var(--fs-micro);
}

.cmd-palette-footer kbd {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: 2px 6px;
  font-family: inherit;
  font-size: 10px;
  color: var(--text-secondary);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

fs.writeFileSync('index.css', css + newCSS);
console.log('Successfully appended Command Palette styles to index.css');
