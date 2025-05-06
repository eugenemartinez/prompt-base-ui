import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { IoClose } from 'react-icons/io5';
import { Button } from './Button';
import { RemoveScroll } from 'react-remove-scroll';
import { motion } from 'framer-motion'; // <-- 1. Import motion

// Define Props Interface
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string; // Optional title for the modal header
  className?: string; // Allow passing additional classes to the modal content panel
}

// --- 2. Animation Variants ---
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};
// --- End Animation Variants ---


// Modal Component Implementation
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  title,
  className = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Effect to handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Close only if the click is directly on the backdrop, not on the modal content
    if (modalRef.current && event.target === event.currentTarget) {
      onClose();
    }
  };

  // Don't render anything if the modal is not open
  if (!isOpen) {
    return null;
  }

  // Original Styles using mapped classes
  const backdropStyles = 'fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4';
  // Original way of combining styles - KEEP THIS
  const modalPanelStyles = `relative z-50 bg-popover text-popover-foreground rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden ${className}`;
  const headerStyles = 'flex items-center justify-between p-4 border-b flex-shrink-0';
  const titleStyles = 'text-lg font-semibold';
  const contentStyles = `p-6 overflow-y-auto flex-grow
                         scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                         hover:scrollbar-thumb-gray-500 active:scrollbar-thumb-gray-600
                         scrollbar-thumb-rounded-full scrollbar-track-rounded-full`;
  const closeButtonStyles = '';

  // Use createPortal to render the modal at the end of the body
  return ReactDOM.createPortal(
    // --- 3. Wrap with RemoveScroll ---
    <RemoveScroll enabled={isOpen}>
      {/* --- 4. Wrap original backdrop div with motion.div --- */}
      <motion.div
        className={backdropStyles} // Use original styles
        onClick={handleBackdropClick} // Use original handler
        ref={modalRef} // Use original ref
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={overlayVariants}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {/* --- 5. Wrap original panel div with motion.div --- */}
        <motion.div
          className={modalPanelStyles} // Use original combined styles
          onClick={(e) => e.stopPropagation()} // Prevent closing on panel click
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {/* --- Original Inner Structure --- */}
          {/* Header */}
          <div className={headerStyles}>
            {title ? (
              <h2 id="modal-title" className={titleStyles}>{title}</h2>
            ) : (
              <div /> // Placeholder
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Close modal"
              className={closeButtonStyles}
            >
              <IoClose size={24} />
            </Button>
          </div>

          {/* Content */}
          <div className={contentStyles}>
            {children}
          </div>
          {/* --- End Original Inner Structure --- */}
        </motion.div>
        {/* --- End Panel motion.div --- */}
      </motion.div>
      {/* --- End Backdrop motion.div --- */}
    </RemoveScroll>,
    // --- End Wrap ---
    document.body // Target element for the portal
  );
};

Modal.displayName = 'Modal';

export { Modal };