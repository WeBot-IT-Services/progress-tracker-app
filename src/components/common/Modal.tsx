import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdropClick = true,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  footer
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] max-h-[95vh]'
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}
      />
      
      {/* Modal Container - Centered and responsive */}
      <div 
        className="relative w-full h-full flex items-center justify-center p-4 overflow-hidden"
        style={{
          position: 'relative',
          zIndex: 1
        }}
      >
        {/* Modal Content */}
        <div 
          className={`
            relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl 
            w-full ${sizeClasses[size]} 
            max-h-[90vh] sm:max-h-[85vh] 
            flex flex-col
            transform transition-all duration-300 ease-out
            ${className}
          `}
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            maxWidth: size === 'full' ? 'calc(100vw - 2rem)' : undefined
          }}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`
              flex items-center justify-between 
              p-4 sm:p-6 
              border-b border-gray-200 
              bg-gradient-to-r from-blue-500 to-blue-600 
              rounded-t-2xl sm:rounded-t-3xl
              flex-shrink-0
              ${headerClassName}
            `}>
              <div className="flex-1 min-w-0">
                {title && (
                  <h3 className="text-lg sm:text-xl font-semibold text-white truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-sm text-blue-100 mt-1 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    ml-4 p-2 rounded-xl 
                    text-white/80 hover:text-white 
                    hover:bg-white/20 
                    transition-all duration-200
                    min-h-[44px] min-w-[44px]
                    flex items-center justify-center
                  "
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`
            flex-1 overflow-y-auto 
            p-4 sm:p-6 
            ${bodyClassName}
          `}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className={`
              flex-shrink-0 
              p-4 sm:p-6 
              border-t border-gray-200 
              bg-gray-50 
              rounded-b-2xl sm:rounded-b-3xl
              ${footerClassName}
            `}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
