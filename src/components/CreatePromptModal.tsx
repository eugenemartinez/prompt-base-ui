import React, { useState } from 'react'; // Added React import
import { PromptWithCode } from '../types';
import { createPrompt } from '../services/api';
import { Modal } from './common/Modal';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';
import { Button } from './common/Button';
import { ErrorMessage } from './common/ErrorMessage';
import { TagInput } from './common/TagInput'; // <-- Import TagInput
import toast from 'react-hot-toast'; // <-- Add toast import

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptCreated: (newPrompt: PromptWithCode) => void;
}

function CreatePromptModal({ isOpen, onClose, onPromptCreated }: CreatePromptModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  // --- Change tags state to string array ---
  const [tags, setTags] = useState<string[]>([]);
  // --- End Change ---
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string }>({});

  const validateForm = () => {
    const errors: { title?: string; content?: string } = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!content.trim()) {
      errors.content = 'Content is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0; // Return true if no errors
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!validateForm()) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    const submittingToastId = toast.loading("Creating prompt..."); // Add loading toast

    try {
      const userToSubmit = username.trim() || undefined;
      const newPrompt = await createPrompt(title, content, tags, userToSubmit);
      toast.success("Prompt created successfully!", { id: submittingToastId }); // Update success toast
      onPromptCreated(newPrompt);

      // Reset form on success
      setTitle('');
      setContent('');
      // --- Reset tags state to empty array ---
      setTags([]);
      // --- End Change ---
      setUsername('');
      setFieldErrors({});

    } catch (err: unknown) {
      console.error("Error creating prompt:", err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to create prompt.';
      setError(errorMsg); // Keep setting state for ErrorMessage component
      // --- Add toast.error ---
      toast.error(`Error creating prompt: ${errorMsg}`, { id: submittingToastId });
      // --- End add ---
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Prompt">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title Input */}
        <Input
          label="Title *" // Add asterisk visually in label
          id="prompt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={150}
          required // Keep required for browser validation, but also use state validation
          disabled={isSubmitting}
          error={fieldErrors.title} // Pass field-specific error
        />

        {/* Content Textarea */}
        <Textarea
          label="Prompt *"
          id="prompt-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          maxLength={15000}
          required
          disabled={isSubmitting}
          error={fieldErrors.content} // Pass field-specific error
          aria-label="Prompt content"
        />

        {/* --- Replace Tags Input with TagInput component --- */}
        <TagInput
          label="Tags"
          id="prompt-tags"
          tags={tags}
          setTags={setTags}
          disabled={isSubmitting}
          placeholder="Type a tag and press Enter or comma..."
          maxTags={10}
          maxTagLength={30}
        />
        {/* Remove the old helper text paragraph */}
        {/* <p className="text-xs text-muted-foreground -mt-3 mb-2"> ... </p> */}
        {/* --- End Replacement --- */}


        {/* Username Input */}
        <Input
          label="Username (Optional)"
          id="prompt-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={50}
          disabled={isSubmitting}
          placeholder="Leave blank for random"
        />
        <p className="text-xs text-muted-foreground -mt-3 mb-2">
          Displayed alongside your prompt. If blank, a random name is generated.
        </p>

        {/* General Error Message */}
        <ErrorMessage message={error} />

        {/* Footer Actions */}
        <div className="pt-4 flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost" // Use ghost or secondary for cancel
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !title.trim() || !content.trim()} // Keep basic disabled logic
            isLoading={isSubmitting}
            loadingText="Creating..."
          >
            Create Prompt
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreatePromptModal;