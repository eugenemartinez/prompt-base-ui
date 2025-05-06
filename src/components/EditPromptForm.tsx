import React, { useState, useEffect } from 'react';
import { Button } from './common/Button';
import { Input } from './common/Input';
import { Textarea } from './common/Textarea';
import { TagInput } from './common/TagInput';
import { ErrorMessage } from './common/ErrorMessage';

interface EditPromptFormProps {
  initialTitle: string;
  initialContent: string;
  initialTags: string[];
  onSave: (updates: { title: string; content: string; tags: string[] }) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
  error: string | null;
}

function EditPromptForm({
  initialTitle,
  initialContent,
  initialTags,
  onSave,
  onCancel,
  isSaving,
  error,
}: EditPromptFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string }>({});

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setTags(initialTags);
    setFieldErrors({});
  }, [initialTitle, initialContent, initialTags]);

  const validateForm = () => {
    const errors: { title?: string; content?: string } = {};
    if (!title.trim()) {
      errors.title = 'Title is required.';
    }
    if (!content.trim()) {
      errors.content = 'Content is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSaving) {
      return;
    }
    await onSave({
      title: title.trim(),
      content: content.trim(),
      tags: tags,
    });
  };

  return (
    // --- Apply space-y-4 directly to form, remove flex/h-full ---
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title Input */}
      <Input
        label="Title *"
        id="edit-prompt-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
        required
        disabled={isSaving}
        error={fieldErrors.title}
      />

      {/* Content Textarea */}
      <Textarea
        label="Prompt *"
        id="edit-prompt-content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={10}
        maxLength={15000}
        required
        disabled={isSaving}
        error={fieldErrors.content}
        aria-label="Prompt content"
      />

      {/* TagInput */}
      <TagInput
        label="Tags"
        id="edit-prompt-tags"
        tags={tags}
        setTags={setTags}
        disabled={isSaving}
        placeholder="Add tags..." // Match CreatePromptModal placeholder if desired
        // maxTags={10} // Match CreatePromptModal limits if desired
        // maxTagLength={30}
      />

      {/* General Error Message (passed from parent) */}
      <ErrorMessage message={error} />

      {/* --- Footer Actions (match CreatePromptModal structure) --- */}
      <div className="pt-4 flex justify-end gap-3"> {/* Use pt-4 like CreatePromptModal */}
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSaving || !title.trim() || !content.trim()}
          isLoading={isSaving}
          loadingText="Saving..."
        >
          Save Changes
        </Button>
      </div>
      {/* --- End Footer --- */}
    </form>
  );
}

export default EditPromptForm;
