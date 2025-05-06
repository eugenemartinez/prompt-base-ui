/**
 * Represents a Prompt object received from the API.
 * Used for lists and potentially as a base for detailed views.
 * Note: modification_code is NOT included in GET list responses.
 */
export interface Prompt {
  prompt_id: string; // UUID
  title: string;
  content: string;
  username: string | null; // Can be null if generated
  tags: string[];
  created_at: string; // ISO 8601 timestamp string
  updated_at: string; // ISO 8601 timestamp string
  comment_count?: number; // <-- Add this (make optional)
  // modification_code is only present in POST response, handle separately if needed
}

/**
 * Represents a Comment object received from the API.
 * Note: modification_code is NOT included in GET responses.
 */
export interface Comment {
  comment_id: string; // UUID
  prompt: string; // UUID of the parent prompt
  content: string;
  username: string | null; // Can be null if generated
  created_at: string; // ISO 8601 timestamp string
  updated_at: string; // ISO 8601 timestamp string
  // modification_code is only present in POST response, handle separately if needed
}

/**
 * Represents the structure of a paginated API response
 * for lists like Prompts or Comments.
 */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * Represents the detailed structure of a Prompt, including nested comments,
 * as returned by the GET /api/prompts/:promptid/ endpoint.
 */
export interface PromptDetail extends Prompt {
  comments: PaginatedResponse<Comment>; // Nested paginated comments
  // Add any other fields specific to the detail view if the API provides them
}

/**
 * Represents the structure for a Prompt creation response,
 * which includes the modification_code.
 */
export interface PromptWithCode extends Prompt {
  modification_code: string;
}

/**
 * Represents the structure for a Comment creation response,
 * which includes the modification_code.
 */
export interface CommentWithCode extends Comment {
  modification_code: string;
}