import { useState, KeyboardEvent, ChangeEvent, ClipboardEvent } from 'react'; // Added React import
import { Input } from './Input';
import { IoClose } from 'react-icons/io5';
import clsx from 'clsx';

interface TagInputProps {
  id?: string;
  label?: string;
  tags: string[];
  setTags: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  tagClassName?: string;
  tagRemoveClassName?: string;
}

const TAG_REGEX = /^[a-zA-Z0-9-]+$/;

export function TagInput({
  id = 'tag-input',
  label = 'Tags',
  tags,
  setTags,
  maxTags = 10,
  maxTagLength = 30,
  placeholder = 'Add a tag...',
  disabled = false,
  className = '',
  inputClassName = '',
  tagClassName = '',
  tagRemoveClassName = '',
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const addTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();

    // Basic validation
    if (!trimmedTag) return false; // Ignore empty
    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed.`);
      return false;
    }
    if (trimmedTag.length > maxTagLength) {
      setError(`Tags cannot exceed ${maxTagLength} characters.`);
      return false;
    }
    if (!TAG_REGEX.test(trimmedTag)) {
      setError('Tags can only contain letters, numbers, and hyphens.');
      return false;
    }

    // --- Case-insensitive duplicate check ---
    const lowerCaseTrimmedTag = trimmedTag.toLowerCase();
    if (tags.some(existingTag => existingTag.toLowerCase() === lowerCaseTrimmedTag)) {
      setError(`Duplicate tag (case-insensitive): '${trimmedTag}'`); // Updated error message
      return false;
    }
    // --- End Check ---

    setTags([...tags, trimmedTag]);
    setError(null); // Clear error on successful add
    return true;
  };

  const removeTag = (indexToRemove: number) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
    if (tags.length -1 < maxTags) {
        setError(null); // Clear max tags error if removing brings below limit
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    setError(null); // Clear error on new input action
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); // Prevent form submission or comma input
      if (addTag(inputValue)) {
        setInputValue(''); // Clear input only if tag was added successfully
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Optional: Remove last tag on backspace if input is empty
      removeTag(tags.length - 1);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setError(null); // Clear error on typing
    const newValue = e.target.value;
    // --- Prevent input value from exceeding maxTagLength ---
    if (newValue.length <= maxTagLength) {
      setInputValue(newValue);
    } else {
      // Optionally provide feedback or just silently prevent further input
      // For example, briefly set an error or just do nothing
      setError(`Tag cannot exceed ${maxTagLength} characters.`);
      // Or just: setInputValue(newValue.slice(0, maxTagLength)); // Truncate
    }
    // --- End Change ---
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    setError(null);
    const pasteText = e.clipboardData.getData('text');
    const potentialTags = pasteText.split(',').map(tag => tag.trim()).filter(Boolean);

    let addedCount = 0;
    const newTags = [...tags];

    for (const tag of potentialTags) {
      if (newTags.length >= maxTags) {
        setError(`Maximum ${maxTags} tags allowed.`);
        break;
      }
      if (tag.length > maxTagLength) {
        setError(`Pasted tag "${tag.slice(0, 10)}..." exceeds ${maxTagLength} characters.`);
        continue; // Skip this tag, try next
      }
      if (!TAG_REGEX.test(tag)) {
         setError(`Pasted tag "${tag}" contains invalid characters.`);
         continue; // Skip this tag, try next
      }
      if (!newTags.includes(tag)) {
        newTags.push(tag);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      setTags(newTags);
    }
    setInputValue(''); // Clear input after paste processing
  };

  const inputId = id || 'tag-input-field';
  const labelText = `${label} (Type a tag and press Enter or comma, max ${maxTags})`;

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground mb-1">
          {labelText}
        </label>
      )}
      {/* Tags Display Area - Conditionally apply spacing */}
      <div
        className={clsx(
          'flex flex-wrap gap-1.5',
          // --- Apply margin and min-height only if tags exist ---
          tags.length > 0 ? 'mb-2 min-h-[28px]' : ''
          // --- End Conditional Classes ---
        )}
      >
        {tags.map((tag, index) => (
          <div
            key={index}
            className={clsx(
              'inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs whitespace-nowrap',
              'bg-accent text-accent-foreground',
              tagClassName
            )}
          >
            <span>{tag}</span>
            <button
              type="button"
              onClick={() => removeTag(index)}
              disabled={disabled}
              className={clsx(
                'flex items-center justify-center w-4 h-4 rounded-full',
                'text-accent-foreground/70 hover:text-accent-foreground hover:bg-destructive/20',
                'focus:outline-none focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-accent',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                tagRemoveClassName
              )}
              aria-label={`Remove tag ${tag}`}
            >
              <IoClose size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <Input
        id={inputId}
        type="text"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder={tags.length >= maxTags ? 'Max tags reached' : placeholder}
        disabled={disabled || tags.length >= maxTags}
        className={inputClassName}
        aria-describedby={error ? `${inputId}-error` : undefined}
      />
      {/* Error Message */}
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}