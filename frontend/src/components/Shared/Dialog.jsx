import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Dialog({ isOpen, onClose, children, title }) {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-[2px] animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative w-full max-w-[440px] bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-[32px] shadow-2xl shadow-black/50 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8">
          {title && (
            <h2 className="text-xl font-bold text-white mb-6 tracking-tight">{title}</h2>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function DialogActions({ children }) {
  return (
    <div className="mt-8 flex justify-end gap-3">
      {children}
    </div>
  );
}

export function DialogButton({ onClick, variant = 'primary', children, disabled }) {
  const styles = {
    primary: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--bg-main)]',
    secondary: 'bg-[var(--bg-surface)] hover:text-white text-[var(--text-muted)] border border-[var(--border)]',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-3 rounded-[20px] text-sm font-bold transition-all active:scale-95 disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
