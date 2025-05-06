import { useState, useEffect, useRef } from 'react';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { motion } from 'framer-motion'; // <-- 1. Import motion
import { Comment } from '../types';
import { Textarea } from './common/Textarea';
import { Button } from './common/Button';
import { ErrorMessage } from './common/ErrorMessage';
import { ConfirmationModal } from './common/ConfirmationModal';

interface CommentCardProps {
  comment: Comment;
  formatDate: (dateString: string | undefined) => string;
  canModify: boolean;
  onDelete: () => Promise<void>; // Expecting the async delete function from parent
  onEditClick: () => void;
  onSaveEdit: (newContent: string) => Promise<void>;
  onCancelEdit: () => void;
  isEditing: boolean;
}

// --- 2. Define Animation Variants ---
const cardVariants = {
  hidden: { opacity: 0, y: 10 }, // Start slightly down and faded out
  visible: { opacity: 1, y: 0 }, // Animate to full opacity and original position
  exit: { opacity: 0, transition: { duration: 0.15 } }, // Fade out on exit
};
// --- End Animation Variants ---

function CommentCard({
  comment,
  formatDate,
  canModify,
  onDelete, // The actual delete function passed from parent
  onEditClick,
  onSaveEdit,
  onCancelEdit,
  isEditing,
}: CommentCardProps) {
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // --- Correct handleDeleteClick to open the modal ---
  const handleDeleteClick = () => {
    if (isSaving || isConfirmingAction) return; // Prevent action if already saving/confirming
    setIsConfirmOpen(true); // Set state to open the confirmation modal
    // --- REMOVE the direct call to onDelete() ---
  };
  // --- End correction ---

  const handleEditClick = () => {
    setEditedContent(comment.content);
    setEditError(null);
    onEditClick();
  };

  const handleSaveClick = async () => {
    if (!editedContent.trim()) {
      setEditError("Comment content cannot be empty.");
      return;
    }
    if (editedContent.trim() === comment.content) {
      onCancelEdit();
      return;
    }

    setIsSaving(true);
    setEditError(null);
    try {
      await onSaveEdit(editedContent.trim());
    } catch (error: unknown) {
      console.error("Error saving comment edit:", error);
      setEditError(error instanceof Error ? error.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenuToggle = () => {
    setIsMenuOpen(prev => !prev);
  };

  const handleEditOptionClick = () => {
    setIsMenuOpen(false);
    handleEditClick();
  };

  // This now correctly calls the modified handleDeleteClick
  const handleDeleteOptionClick = () => {
    setIsMenuOpen(false);
    handleDeleteClick();
  };

  // useEffect for click outside remains the same
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current?.contains(event.target as Node) ||
        menuRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // --- Return JSX ---
  return (
    <>
      {/* --- 3. Change div to motion.div and add props --- */}
      <motion.div
        className="bg-card text-card-foreground border rounded-lg shadow-sm p-3"
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        layout // Smooth layout changes when items are added/removed
        transition={{ duration: 0.2, ease: 'easeInOut' }} // Adjust timing/easing as needed
      >
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              rows={3}
              className="w-full text-sm"
              disabled={isSaving}
              aria-label="Edit comment content"
            />
            <ErrorMessage message={editError} />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelEdit}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveClick}
                disabled={isSaving || !editedContent.trim()}
                isLoading={isSaving}
                loadingText="Saving..."
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-start gap-2">
            <div className="flex-grow min-w-0">
              <p className="text-sm text-foreground mb-1 break-words overflow-hidden">
                {comment.content}
              </p>
              <p className="text-xs text-muted-foreground">
                By <span className="font-medium text-foreground">{comment.username || 'Unknown'}</span> - {formatDate(comment.created_at)}
              </p>
            </div>

            {canModify && (
              <div className="relative flex-shrink-0">
                <Button
                  ref={triggerRef}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={handleMenuToggle}
                  aria-label="Comment actions"
                  title="Comment actions"
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                >
                  <BsThreeDotsVertical size={16} />
                </Button>

                {isMenuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 mt-1 w-32 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10 p-1 flex flex-col"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="comment-actions-button" // Make sure button has id="comment-actions-button"
                  >
                    <button
                      onClick={handleEditOptionClick}
                      className="text-left w-full px-3 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
                      role="menuitem"
                    >
                      Edit
                    </button>
                    <button
                      onClick={handleDeleteOptionClick} // This triggers the confirmation flow
                      className="text-left w-full px-3 py-1.5 text-sm rounded-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none cursor-pointer"
                      role="menuitem"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </motion.div>
      {/* --- End motion.div --- */}

      {/* --- Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={async () => { // This function executes when user confirms
          setIsConfirmingAction(true);
          try {
            await onDelete(); // Call the actual delete function passed via props
          } catch (error) {
            console.error("Error during comment deletion:", error);
            // Parent (PromptDetailModal) should show toast on error
          } finally {
            setIsConfirmingAction(false);
            setIsConfirmOpen(false); // Close modal after action attempt
          }
        }}
        title="Confirm Comment Deletion"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        isConfirming={isConfirmingAction}
      />
      {/* --- End Confirmation Modal --- */}
    </>
  );
}

export default CommentCard;