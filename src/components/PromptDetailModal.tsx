import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import clsx from 'clsx'; // <-- Import clsx
import { Prompt, Comment, PromptDetail, CommentWithCode } from '../types';
import {
  fetchPromptDetail,
  fetchCommentsPage,
  createComment,
  deleteComment,
  updateComment,
  updatePrompt,
  deletePrompt
} from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import copy from 'clipboard-copy';
import { AnimatePresence } from 'framer-motion'; // <-- Import AnimatePresence
import CommentCard from './CommentCard';
import {
  getPromptCode,
  removePromptCode,
  saveCommentCode,
  getCommentCode,
  removeCommentCode,
  removePromptFromVault,
  savePromptToVault
} from '../utils/localStorage';
import {
  IoCopyOutline,
  IoCheckmark,
  IoChatbubblesOutline,
  IoPencilOutline,     
  IoTrashOutline,      
  IoSendOutline,       
  IoStarOutline,       
  IoStar               
} from 'react-icons/io5'; // Import Checkmark icon too

// --- Import Common Components ---
import { Modal } from './common/Modal';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';
import { ErrorMessage } from './common/ErrorMessage';
import { LoadingSpinner } from './common/LoadingSpinner';
import EditPromptForm from './EditPromptForm'; // Import the new component
import { ConfirmationModal } from './common/ConfirmationModal'; // <-- Import ConfirmationModal
import PromptDetailModalSkeleton from './PromptDetailModalSkeleton'; // <-- Import Skeleton
// --- End Import ---

interface PromptDetailModalProps {
  prompt: Prompt | null;
  onClose: (refreshNeeded?: boolean) => void;
  onSaveToVault?: (prompt: Prompt) => boolean;
  onRemoveFromVault?: (promptId: string) => boolean;
  isSaved: boolean;
  onPromptDeleted?: (promptId: string) => void;
  onTagClick?: (tag: string) => void;
  onPromptUpdated?: (updatedPrompt: PromptDetail) => void;
  onCommentAdded?: (promptId: string) => void; // <-- Add this
  onCommentDeleted?: (promptId: string) => void; // <-- Add this
}

function PromptDetailModal({
  prompt,
  onClose,
  onSaveToVault,
  onRemoveFromVault,
  isSaved,
  onPromptDeleted,
  onTagClick,
  onPromptUpdated,
  onCommentAdded, // <-- Destructure
  onCommentDeleted, // <-- Destructure
}: PromptDetailModalProps) {
  // --- State variables remain the same ---
  const [comments, setComments] = useState<Comment[]>([]);
  const [nextCommentsPage, setNextCommentsPage] = useState<string | null>(null);
  const [commentsLoading, setCommentsLoading] = useState<boolean>(true);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [detailedPromptData, setDetailedPromptData] = useState<PromptDetail | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [currentlySaved, setCurrentlySaved] = useState<boolean>(isSaved);
  const [isProcessingVault, setIsProcessingVault] = useState<boolean>(false);
  const [newCommentContent, setNewCommentContent] = useState<string>('');
  const [newCommentUsername, setNewCommentUsername] = useState<string>('');
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [submitCommentError, setSubmitCommentError] = useState<string | null>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);
  const [isProcessingPromptAction, setIsProcessingPromptAction] = useState<boolean>(false); // Keep for API call status
  const [promptActionError, setPromptActionError] = useState<string | null>(null); // Keep for API errors
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // --- State for Confirmation Modal ---
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<React.ReactNode>('');
  const [confirmAction, setConfirmAction] = useState<(() => Promise<void>) | null>(null);
  const [isConfirmingAction, setIsConfirmingAction] = useState(false); // For loading state on confirm button
  // --- End Confirmation Modal State ---

  // --- State for initial detail load ---
  const [detailsLoading, setDetailsLoading] = useState<boolean>(true); // <-- Add state for initial detail load
  // --- End state for initial detail load ---

  // --- Helper functions (formatDate, useEffect, handlers) remain largely the same ---
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // --- Effect for fetching data (depends only on prompt ID) ---
  useEffect(() => {
    // Reset copy status and vault processing when prompt changes
    setIsProcessingVault(false);
    setCopyStatus('idle');

    const currentPromptId = prompt?.prompt_id; // Get ID outside conditional

    if (currentPromptId) {
      setDetailsLoading(true);
      setCommentsLoading(true);
      setCommentsError(null);
      setComments([]);
      setNextCommentsPage(null);
      setDetailedPromptData(null); // Clear previous data

      fetchPromptDetail(currentPromptId) // Use currentPromptId
        .then((data: PromptDetail) => {
          setDetailedPromptData(data);
          if (data.comments && Array.isArray(data.comments.results)) {
            setComments(data.comments.results);
            setNextCommentsPage(data.comments.next);
          } else {
            console.warn("Comments data missing or invalid after fetch:", data);
            setComments([]);
            setNextCommentsPage(null);
          }
        })
        .catch((err: unknown) => {
          console.error("Error fetching prompt details:", err);
          setCommentsError(err instanceof Error ? err.message : 'Failed to load details');
        })
        .finally(() => {
          setDetailsLoading(false);
          setCommentsLoading(false);
        });
    } else {
      // Reset states if no prompt ID
      setDetailsLoading(false);
      setCommentsLoading(false);
      setComments([]);
      setNextCommentsPage(null);
      setCommentsError(null);
      setDetailedPromptData(null);
    }
  // --- Only depend on prompt?.prompt_id ---
  }, [prompt?.prompt_id]);
  // --- End data fetching effect ---

  // --- Effect to sync isSaved prop with currentlySaved state ---
  useEffect(() => {
    setCurrentlySaved(isSaved);
  }, [isSaved]);
  // --- End sync effect ---


  const handleToggleVault = () => {
    const currentPromptData = detailedPromptData || prompt;
    if (!currentPromptData || isProcessingVault) return;

    setIsProcessingVault(true);
    let success = false;
    try {
        if (currentlySaved) {
            if (onRemoveFromVault) {
                success = onRemoveFromVault(currentPromptData.prompt_id);
                if (success) setCurrentlySaved(false);
                else console.error("Failed to remove prompt from vault (handler returned false).");
            } else console.warn("Remove action triggered but no onRemoveFromVault handler provided.");
        } else {
            if (onSaveToVault) {
                success = onSaveToVault(currentPromptData);
                if (success) setCurrentlySaved(true);
                else console.error("Failed to save prompt to vault (handler returned false).");
            } else console.warn("Save action triggered but no onSaveToVault handler provided.");
        }
    } catch (error) {
        console.error("Error during vault operation:", error);
    } finally {
        setIsProcessingVault(false);
    }
  };

  const handleCopy = async () => {
    const contentToCopy = detailedPromptData?.content || prompt?.content;
    if (!contentToCopy) {
      console.error("No prompt content to copy.");
      toast.error("Nothing to copy.");
      return;
    }
    try {
      await copy(contentToCopy);
      setCopyStatus('copied');
      toast.success("Prompt copied to clipboard!");
      setTimeout(() => setCopyStatus('idle'), 1500);
    } catch (err) {
      console.error('Failed to copy text using clipboard-copy: ', err);
      // --- Update toast.error ---
      const errorMsg = err instanceof Error ? err.message : 'Unknown copy error.';
      toast.error(`Failed to copy prompt: ${errorMsg}`);
      // --- End update ---
    }
  };

  const loadMoreComments = useCallback(async () => {
    if (!nextCommentsPage || commentsLoading) return;

    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const data = await fetchCommentsPage(nextCommentsPage);

      if (data && Array.isArray(data.results)) {
        setComments(prevComments => [...prevComments, ...data.results]);
        setNextCommentsPage(data.next);
      } else {
        console.warn("Invalid data structure received from fetchCommentsPage:", data);
        setNextCommentsPage(null);
        setCommentsError("Received invalid comment data.");
      }

    } catch (err: unknown) {
      console.error("Error loading more comments:", err);
      setCommentsError(err instanceof Error ? err.message : 'Failed to load more comments');
    } finally {
      setCommentsLoading(false);
    }
  }, [nextCommentsPage, commentsLoading]);

  const handleChat = () => {
    const contentToChat = detailedPromptData?.content || prompt?.content;
    if (contentToChat) {
        // --- Change ?q= to ?prompt= ---
        const chatGPTUrl = `https://chat.openai.com/?prompt=${encodeURIComponent(contentToChat)}`;
        // --- End Change ---
        window.open(chatGPTUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentPromptId = displayPrompt?.prompt_id;
    if (!newCommentContent.trim()) {
        setSubmitCommentError("Comment cannot be empty.");
        return;
    }
    if (!currentPromptId || isSubmittingComment) {
      return;
    }

    setIsSubmittingComment(true);
    setSubmitCommentError(null);
    const submittingToastId = toast.loading("Submitting comment...");

    try {
      const result: CommentWithCode = await createComment(
        currentPromptId,
        newCommentContent.trim(),
        newCommentUsername.trim() || undefined
      );

      setComments(prev => [result, ...prev]);
      setNewCommentContent('');
      setNewCommentUsername('');

      if (result.modification_code) {
        saveCommentCode(result.comment_id, result.modification_code);
      }

      // --- Call onCommentAdded callback ---
      if (onCommentAdded) {
        onCommentAdded(currentPromptId);
      }
      // --- End callback ---

      toast.success("Comment submitted!", { id: submittingToastId });

    } catch (error: unknown) {
      console.error("Error submitting comment:", error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to submit comment.';
      setSubmitCommentError(errorMsg);
      // --- Update toast.error ---
      toast.error(`Error submitting comment: ${errorMsg}`, { id: submittingToastId });
      // --- End update ---
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const modificationCode = getCommentCode(commentId);
    if (!modificationCode) {
        toast.error("Cannot delete: Modification code not found.");
        console.error(`Modification code for comment ${commentId} not found in local storage.`);
        return;
    }
    const currentPromptId = displayPrompt?.prompt_id; // Get prompt ID before filtering

    const deletingToastId = toast.loading("Deleting comment...");

    try {
      await deleteComment(commentId, modificationCode);
      setComments(prev => prev.filter(comment => comment.comment_id !== commentId));
      removeCommentCode(commentId);

      // --- Call onCommentDeleted callback ---
      if (onCommentDeleted && currentPromptId) {
        onCommentDeleted(currentPromptId);
      }
      // --- End callback ---

      toast.success("Comment deleted.", { id: deletingToastId });

    } catch (error: unknown) {
      console.error(`Error deleting comment ${commentId}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      // --- Update toast.error ---
      toast.error(`Failed to delete comment: ${errorMsg}`, { id: deletingToastId });
      // --- End update ---
    }
  };

  const handleEditClick = (commentId: string) => {
    setEditingCommentId(commentId);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
  };

  const handleSaveEdit = async (commentId: string, newContent: string): Promise<void> => {
     const modificationCode = getCommentCode(commentId);
     if (!modificationCode) {
         console.error(`Modification code for comment ${commentId} not found in local storage.`);
         toast.error("Cannot save: Modification code not found.");
         throw new Error("Cannot save: Modification code not found for this comment.");
     }

    const savingToastId = toast.loading("Saving comment...");

    try {
      const updatedComment = await updateComment(commentId, newContent, modificationCode);
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.comment_id === commentId ? updatedComment : comment
        )
      );
      setEditingCommentId(null);
      toast.success("Comment updated.", { id: savingToastId });

    } catch (error: unknown) {
      console.error(`Error updating comment ${commentId}:`, error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save changes.';
      // --- Update toast.error ---
      toast.error(`Error saving comment: ${errorMsg}`, { id: savingToastId });
      // --- End update ---
      throw error;
    }
  };

  const handleEditPromptClick = () => {
    // Just set the editing state, EditPromptForm will initialize its own state
    setPromptActionError(null); // Clear any previous errors
    setIsEditingPrompt(true);
  };

  const handleCancelPromptEdit = () => {
    setIsEditingPrompt(false);
    setPromptActionError(null); // Clear errors on cancel
  };

  const handleSavePromptEdit = async (updates: { title: string; content: string; tags: string[] }) => {
    const currentPromptId = displayPrompt?.prompt_id;
    if (!currentPromptId || isProcessingPromptAction) return;

    const modificationCode = getPromptCode(currentPromptId);
    if (!modificationCode) {
      setPromptActionError("Cannot save: Modification code not found. Please recreate the prompt if needed.");
      toast.error("Cannot save: Modification code not found.");
      return;
    }
    if (!updates.title || !updates.content) {
        setPromptActionError("Title and Content cannot be empty.");
        toast.error("Title and Content cannot be empty.");
        return;
    }

    setIsProcessingPromptAction(true);
    setPromptActionError(null);
    const savingToastId = toast.loading("Saving prompt changes...");

    try {
      const updatedPromptData = await updatePrompt(currentPromptId, updates, modificationCode);

      // Update local storage if it was saved (already done in your code)
      if (currentlySaved) {
          savePromptToVault(updatedPromptData);
      }

      // Update modal's internal state
      setDetailedPromptData(updatedPromptData);
      setIsEditingPrompt(false); // Switch back to view mode

      toast.success("Prompt updated successfully!", { id: savingToastId });

      // --- Call the new callback to notify the parent ---
      if (onPromptUpdated) {
        onPromptUpdated(updatedPromptData);
      }
      // --- End callback ---

    } catch (error: unknown) {
      console.error("Error updating prompt:", error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to save changes.';
      setPromptActionError(errorMsg);
      // --- Update toast.error ---
      toast.error(`Error updating prompt: ${errorMsg}`, { id: savingToastId });
      // --- End update ---
    } finally {
      setIsProcessingPromptAction(false);
    }
  };

  const handleDeletePrompt = () => {
    const currentPromptId = displayPrompt?.prompt_id;
    if (!currentPromptId || isProcessingPromptAction) return;

    const modificationCode = getPromptCode(currentPromptId);
    if (!modificationCode) {
      setPromptActionError("Cannot delete: Modification code not found.");
      toast.error("Cannot delete: Modification code not found.");
      return;
    }

    setConfirmAction(() => async () => {
      setIsConfirmingAction(true);
      setIsProcessingPromptAction(true);
      const deletingToastId = toast.loading("Deleting prompt...");

      try {
        await deletePrompt(currentPromptId, modificationCode);
        removePromptCode(currentPromptId);
        removePromptFromVault(currentPromptId);

        if (onPromptDeleted) {
            onPromptDeleted(currentPromptId);
        }
        toast.success("Prompt deleted successfully.", { id: deletingToastId });
        onClose(true);
      } catch (error: unknown) {
        console.error("Error deleting prompt:", error);
        const errorMsg = error instanceof Error ? error.message : 'Failed to delete prompt.';
        setPromptActionError(errorMsg);
        // --- Update toast.error ---
        toast.error(`Error deleting prompt: ${errorMsg}`, { id: deletingToastId });
        // --- End update ---
      } finally {
        setIsConfirmingAction(false);
        setIsProcessingPromptAction(false);
        setIsConfirmOpen(false);
      }
    });

    setConfirmMessage(
      <div>
        Are you sure you want to permanently delete the prompt{' '}
        <strong className="text-foreground">{displayPrompt?.title || 'this prompt'}</strong>?
        <br />
        This action cannot be undone.
      </div>
    );
    setIsConfirmOpen(true);
  };

  // --- Add Tag Click Handler ---
  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent modal background click or other parent clicks
    if (onTagClick) {
      onTagClick(tag); // Let the parent handle navigation and closing
    } else {
      // Fallback if the handler isn't provided (optional)
      console.warn("PromptDetailModal: onTagClick handler was not provided.");
      onClose(); // Close the modal anyway
    }
  };
  // --- End Tag Click Handler ---

  // --- End Helper Functions ---


  if (!prompt) {
    return null;
  }

  const displayPrompt = detailedPromptData || prompt;
  const canModifyPrompt = !!getPromptCode(displayPrompt.prompt_id);

  // Determine if we should show the skeleton
  const showSkeleton = detailsLoading && !detailedPromptData;

  return (
    <Modal
      isOpen={true}
      onClose={() => isEditingPrompt ? handleCancelPromptEdit() : onClose()}
      // --- Update title based on loading state ---
      title={showSkeleton ? 'Loading Prompt...' : (isEditingPrompt ? 'Edit Prompt' : (displayPrompt?.title || 'Prompt Details'))}
      // --- End title update ---
      className="max-w-3xl"
    >
      {/* --- Conditionally render Skeleton or Content --- */}
      {showSkeleton ? (
        <PromptDetailModalSkeleton />
      ) : isEditingPrompt ? (
        <EditPromptForm
          key={displayPrompt.prompt_id} // Add key to force re-mount if prompt changes while modal is open
          initialTitle={displayPrompt.title}
          initialContent={displayPrompt.content}
          initialTags={displayPrompt.tags || []}
          onSave={handleSavePromptEdit}
          onCancel={handleCancelPromptEdit}
          isSaving={isProcessingPromptAction}
          error={promptActionError}
        />
      ) : (
        // --- Display Mode ---
        <div className="flex flex-col h-full">
          {/* Body - Content Area */}
          <div className="space-y-6 flex-grow">
            {/* Prompt Content Display */}
            <div className="relative"> {/* Keep relative positioning */}
              <label className="block text-sm font-medium text-muted-foreground mb-1">Prompt:</label>
              {/* Clickable Content Container */}
              <div
                // --- Add clsx and conditional background ---
                className={clsx(
                  "bg-muted text-muted-foreground p-4 rounded-lg border whitespace-pre-wrap break-words text-sm cursor-pointer",
                  "transition-colors duration-150 ease-in-out", // Add transition for smooth effect
                  copyStatus === 'copied' && "bg-green-100 dark:bg-green-900/30" // Apply highlight class when copied
                )}
                // --- End Change ---
                onClick={handleCopy}
                title={copyStatus === 'copied' ? 'Copied!' : 'Click to copy prompt'}
                role="button"
                tabIndex={0}
                aria-label={copyStatus === 'copied' ? 'Copied prompt content' : 'Copy prompt content'}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCopy(); }}
              >
                {/* Content Text */}
                {displayPrompt.content}

                {/* Copy Icon Indicator */}
                <div
                  className={`absolute bottom-4 right-4 text-muted-foreground ${copyStatus === 'copied' ? 'text-green-600' : ''}`}
                  aria-hidden="true"
                >
                  {copyStatus === 'copied' ? <IoCheckmark size={18} /> : <IoCopyOutline size={18} />}
                </div>
              </div>
            </div>

            {/* Metadata Display */}
            <div className="text-sm text-muted-foreground space-y-1 border-t pt-4">
              <p>Author: <span className="font-medium text-foreground">{displayPrompt.username || 'Unknown'}</span></p>
              <p>Created: {formatDate(displayPrompt.created_at)}</p>
              <p>Updated: {formatDate(displayPrompt.updated_at)}</p>
              {/* --- Tags section --- */}
              <div className="flex flex-wrap gap-1 pt-1 items-center">
                <span className="mr-1">Tags:</span>
                {displayPrompt.tags && displayPrompt.tags.length > 0 ? (
                  displayPrompt.tags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={(e) => handleTagClick(e, tag)}
                      // --- Remove transition-colors, keep transform ---
                      className={clsx(
                        "px-2 py-0.5 text-xs rounded-full whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 transition-transform duration-150 ease-in-out cursor-pointer", // Removed transition-colors
                        'bg-accent text-accent-foreground hover:bg-accent/80 hover:scale-105'
                      )}
                      // --- End Change ---
                      aria-label={`Filter by tag: ${tag}`}
                    >
                      {tag}
                    </button>
                  ))
                ) : (
                  <span className="text-xs italic">No tags</span>
                )}
              </div>
              {/* --- End Tags section --- */}
            </div>

            {/* Action Buttons Display */}
            {/* --- Change justify-start to justify-center --- */}
            <div className="pt-4 border-t flex flex-wrap justify-center gap-2 md:gap-3">
            {/* --- End Change --- */}

              {/* 1. Chat Button (No isLoading prop) - Remains the same */}
              <Button
                variant="primary"
                onClick={handleChat}
                disabled={!displayPrompt.content}
                size="sm"
                className="inline-flex items-center px-2 md:px-3"
                aria-label="Chat with ChatGPT"
              >
                <IoChatbubblesOutline size={18} aria-hidden="true" />
                <span className="ml-2 hidden md:inline">Chat with ChatGPT</span>
              </Button>

              {/* 2. Save/Remove Button (Combined & Conditional Loading) */}
              <Button
                variant={currentlySaved ? 'outline' : 'secondary'}
                onClick={handleToggleVault}
                disabled={isProcessingVault || (!currentlySaved && !onSaveToVault) || (currentlySaved && !onRemoveFromVault)}
                isLoading={isProcessingVault} // Pass isLoading
                size="sm"
                className="inline-flex items-center justify-center px-2 md:px-3" // Added justify-center
                aria-label={currentlySaved ? 'Remove from Vault' : 'Save to Vault'}
              >
                {isProcessingVault ? (
                  <>
                    {/* Mobile Spinner */}
                    <LoadingSpinner size="sm" className="inline-flex md:hidden" />
                    {/* Desktop Spinner + Text */}
                    <div className="hidden md:inline-flex items-center">
                      <LoadingSpinner size="sm" className="mr-2" />
                      <span>{currentlySaved ? 'Removing...' : 'Saving...'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Not Loading: Icon + Text */}
                    {currentlySaved ? <IoStar size={18} aria-hidden="true" /> : <IoStarOutline size={18} aria-hidden="true" />}
                    <span className="ml-2 hidden md:inline">
                      {currentlySaved ? 'Remove from Vault' : 'Save to Vault'}
                    </span>
                  </>
                )}
              </Button>

              {/* 3. & 4. Edit and Delete Buttons (Conditional) */}
              {canModifyPrompt && (
                <>
                  {/* 3. Edit Button (No isLoading prop) - Remains the same */}
                  <Button
                    variant="outline"
                    onClick={handleEditPromptClick}
                    disabled={isProcessingPromptAction}
                    size="sm"
                    className="inline-flex items-center px-2 md:px-3"
                    aria-label="Edit Prompt"
                  >
                    <IoPencilOutline size={18} aria-hidden="true" />
                    <span className="ml-2 hidden md:inline">Edit Prompt</span>
                  </Button>

                  {/* 4. Delete Button (Combined & Conditional Loading) */}
                  <Button
                    variant="outline"
                    onClick={handleDeletePrompt}
                    disabled={isProcessingPromptAction}
                    // Use a more specific loading state if available, otherwise use isProcessingPromptAction
                    isLoading={isConfirmingAction || (isProcessingPromptAction && !promptActionError)} // Check confirmation loading too
                    size="sm"
                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground focus:ring-destructive inline-flex items-center justify-center px-2 md:px-3" // Added justify-center
                    aria-label="Delete Prompt"
                  >
                    {/* Check the same combined loading state */}
                    {(isConfirmingAction || (isProcessingPromptAction && !promptActionError)) ? (
                       <>
                         {/* Mobile Spinner */}
                         <LoadingSpinner size="sm" className="inline-flex md:hidden" />
                         {/* Desktop Spinner + Text */}
                         <div className="hidden md:inline-flex items-center">
                           <LoadingSpinner size="sm" className="mr-2" />
                           <span>Deleting...</span>
                         </div>
                       </>
                    ) : (
                      <>
                        {/* Not Loading: Icon + Text */}
                        <IoTrashOutline size={18} aria-hidden="true" />
                        <span className="ml-2 hidden md:inline">Delete Prompt</span>
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Comments Section Display */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Comment ChatGPT's Response!</h3>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} className="mb-4 space-y-2">
                <Textarea
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Add ChatGPT's response as a comment in here..."
                  rows={3}
                  className="w-full text-sm"
                  disabled={isSubmittingComment}
                  aria-label="New comment content"
                />
                {/* --- Flex container for Username and Submit Button --- */}
                <div className="flex items-end gap-2">
                  <div className="flex-grow">
                    <Input
                      type="text"
                      id="comment-username"
                      value={newCommentUsername}
                      onChange={(e) => setNewCommentUsername(e.target.value)}
                      placeholder="Username (Optional)" // Simplified placeholder
                      maxLength={50}
                      className="w-full text-sm" // w-full ensures it fills flex-grow container
                      disabled={isSubmittingComment}
                      aria-label="Comment username"
                    />
                    {/* Removed label prop as placeholder is sufficient */}
                  </div>
                  {/* Submit Comment Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmittingComment || !newCommentContent.trim()}
                    isLoading={isSubmittingComment}
                    loadingText="Submitting..." // <-- Add this prop
                    size="sm"
                    className="flex-shrink-0 inline-flex items-center justify-center px-2 md:px-3 h-10"
                    aria-label="Submit Comment"
                  >
                    {/* --- Keep only the NOT Loading State --- */}
                    {/* The Button component handles the loading state internally */}
                    <IoSendOutline size={18} aria-hidden="true" />
                    <span className="ml-2 hidden md:inline">Submit Comment</span>
                    {/* --- End Not Loading State --- */}
                  </Button>
                </div>
                {/* --- End Flex container --- */}
                <ErrorMessage message={submitCommentError} />
              </form>

              {/* Existing Comments List & Pagination */}
              {commentsLoading && comments.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <LoadingSpinner size="md" className="inline-block mr-2" /> Loading comments...
                </div>
              )}
              <ErrorMessage message={commentsError} className="text-center py-2" />

              <div className="space-y-3 mb-4">
                {/* --- Remove initial={false} --- */}
                <AnimatePresence>
                  {comments.map((comment) => (
                    // The actual motion.div needs to be INSIDE CommentCard.tsx
                    <CommentCard
                      key={comment.comment_id}
                      comment={comment}
                      formatDate={formatDate}
                      canModify={!!getCommentCode(comment.comment_id)}
                      onDelete={() => handleDeleteComment(comment.comment_id)}
                      onEditClick={() => handleEditClick(comment.comment_id)}
                      onSaveEdit={(newContent) => handleSaveEdit(comment.comment_id, newContent)}
                      onCancelEdit={handleCancelEdit}
                      isEditing={editingCommentId === comment.comment_id}
                    />
                  ))}
                </AnimatePresence>
                {/* --- End AnimatePresence --- */}
              </div>

              {!commentsLoading && nextCommentsPage && (
                <Button
                  onClick={loadMoreComments}
                  variant="outline" // Use Button component
                  className="w-full"
                  size="sm"
                >
                  Load More Comments
                </Button>
              )}
              {commentsLoading && comments.length > 0 && (
                 <div className="text-center py-2 text-muted-foreground">
                   <LoadingSpinner size="sm" className="inline-block mr-2" /> Loading more...
                 </div>
              )}
              {!commentsLoading && !nextCommentsPage && comments.length > 0 && !commentsError && (
                <p className="text-muted-foreground text-center text-sm py-2">No more comments</p>
              )}
              {!commentsLoading && !commentsError && comments.length === 0 && (
                <p className="text-muted-foreground text-center text-sm py-2">No comments yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* --- Confirmation Modal --- */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setConfirmAction(null); // Clear action on close
        }}
        // --- Wrap the call to confirmAction ---
        onConfirm={async () => { // Make the wrapper async
          if (confirmAction) {
            await confirmAction(); // Execute the stored async action if it exists
          }
        }}
        // --- End wrapper ---
        message={confirmMessage}
        confirmText="Delete" // Customize confirm button text (or use default)
        confirmVariant="danger" // Use danger variant
        isConfirming={isConfirmingAction} // Pass loading state
        title="Confirm Deletion" // Customize title
      />
      {/* --- End Confirmation Modal --- */}

    </Modal> // This is the closing tag of the main PromptDetailModal
  );
}

export default PromptDetailModal;