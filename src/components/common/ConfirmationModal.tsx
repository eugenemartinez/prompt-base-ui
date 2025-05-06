import React from 'react';
import { Modal, ModalProps } from './Modal';
import { Button, ButtonProps } from './Button';
import { IoWarningOutline } from 'react-icons/io5'; // Optional: for visual cue

// Define Props Interface extending ModalProps but making children optional
export interface ConfirmationModalProps extends Omit<ModalProps, 'children'> {
  /** The main confirmation message. Can be a string or React node for more complex content. */
  message: React.ReactNode;
  /** Function to execute when the confirm button is clicked. */
  onConfirm: () => void;
  /** Text for the confirmation button. Defaults to "Confirm". */
  confirmText?: string;
  /** Variant for the confirmation button. Defaults to "danger". */
  confirmVariant?: ButtonProps['variant'];
  /** Text for the cancel button. Defaults to "Cancel". */
  cancelText?: string;
  /** Optional flag to show a loading state on the confirm button. */
  isConfirming?: boolean;
  /** Optional icon to display above the message. */
  icon?: React.ReactNode;
}

// ConfirmationModal Component Implementation
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation', // Default title
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger', // Default to danger variant
  cancelText = 'Cancel',
  isConfirming = false,
  icon = <IoWarningOutline className="h-10 w-10 text-destructive" aria-hidden="true" />, // Default warning icon
  className = '', // Allow passing additional classes to the modal panel
  ...modalProps // Pass any other ModalProps like aria attributes
}) => {
  // Use the base Modal component
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={`max-w-md ${className}`} // Default to a smaller max-width for confirmation
      {...modalProps}
    >
      <div className="text-center"> {/* Center content */}
        {/* Optional Icon */}
        {icon && (
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
            {icon}
          </div>
        )}

        {/* Confirmation Message */}
        <div className="text-sm text-muted-foreground mb-6">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          <Button
            type="button"
            variant="outline" // Changed variant from 'ghost' to 'outline'
            onClick={onClose}
            disabled={isConfirming}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            isLoading={isConfirming}
            loadingText="Processing..." // Generic loading text
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmationModal.displayName = 'ConfirmationModal';

export { ConfirmationModal };