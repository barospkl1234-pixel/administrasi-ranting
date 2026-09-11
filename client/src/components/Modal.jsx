import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="flex min-h-screen items-end sm:items-center justify-center p-3 sm:p-4 text-center sm:text-left">
        <div 
          className={`relative flex flex-col transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all w-full ${maxWidth} sm:my-8 h-auto max-h-[92vh] border border-slate-100 animate-scale-up`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4 bg-white/95 backdrop-blur-md">
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2 truncate pr-2">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 sm:p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 shrink-0"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body px-4 py-4 sm:px-6 sm:py-5 overflow-y-auto flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

