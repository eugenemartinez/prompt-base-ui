import { PaginatedResponse, Prompt, PromptDetail, Comment, PromptWithCode, CommentWithCode } from '../types';

// Get the API base URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("Error: VITE_API_BASE_URL is not defined in your environment variables.");
  // You might want to throw an error or handle this case more gracefully
}

/**
 * Fetches a list of prompts from the API.
 * Supports pagination, search, tag filtering, and sorting.
 *
 * @param page - The page number to fetch.
 * @param search - Optional search term.
 * @param tags - Optional comma-separated string of tags.
 * @param sort - Optional sort key (e.g., 'title_asc', 'updated_at_desc'). Defaults to 'updated_at_desc'.
 * @returns A promise that resolves to a PaginatedResponse containing Prompts.
 */
export async function fetchPrompts(
  page: number = 1,
  search?: string,
  tags?: string,
  sort: string = 'updated_at_desc' // Update default value here
): Promise<PaginatedResponse<Prompt>> {
  // Construct query parameters
  const params = new URLSearchParams();
  params.append('page', page.toString());
  if (search) {
    params.append('search', search);
  }
  if (tags) {
    params.append('tags', tags);
  }
  // --- No change needed here, already correctly appends sort ---
  if (sort) {
    params.append('sort', sort);
  }
  // --- End No change ---

  const url = `${API_BASE_URL}/prompts/?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      // Log detailed error information
      const errorData = await response.text(); // Try to get error text
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      throw new Error(`Failed to fetch prompts: ${response.status} ${response.statusText}`);
    }

    const data: PaginatedResponse<Prompt> = await response.json();
    return data;
  } catch (error) {
    console.error("Network or other error fetching prompts:", error);
    // Re-throw the error so the calling component can handle it (e.g., show an error message)
    throw error;
  }
}

// --- NEW: Fetch Prompt Detail ---
/**
 * Fetches the detailed information for a single prompt, including comments.
 * @param promptId - The UUID of the prompt to fetch.
 * @returns A promise that resolves to a PromptDetail object.
 */
export async function fetchPromptDetail(promptId: string): Promise<PromptDetail> {
  const url = `${API_BASE_URL}/prompts/${promptId}/`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`API Error ${response.status}: ${response.statusText}`, errorData); // Log the error details
    if (response.status === 404) {
        throw new Error(`Prompt with ID ${promptId} not found.`);
    }
    // Throw a generic error, but the details were logged above
    throw new Error(`Failed to fetch prompt detail: ${response.status} ${response.statusText}`);
  }

  // Get the raw data first
  const data = await response.json();

  // --- Refined Validation ---
  if (typeof data.comments !== 'object' || data.comments === null || !Array.isArray(data.comments.results)) {
      (data as PromptDetail).comments = { count: 0, next: null, previous: null, results: [] };
  }
  // --- End Refined Validation ---

  return data as PromptDetail;
}

// --- NEW: Fetch More Comments (using full URL) ---
/**
 * Fetches a specific page of comments using the full URL provided by the API's pagination.
 * @param url - The full URL for the comments page to fetch.
 * @returns A promise that resolves to a PaginatedResponse containing Comments.
 */
export async function fetchCommentsPage(url: string): Promise<PaginatedResponse<Comment>> {

  try {
    const response = await fetch(url); // Use the full URL directly

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      throw new Error(`Failed to fetch comments page: ${response.status} ${response.statusText}`);
    }

    const data: PaginatedResponse<Comment> = await response.json();
    return data;
  } catch (error) {
    console.error(`Network or other error fetching comments page from ${url}:`, error);
    throw error; // Re-throw
  }
}


// --- NEW: Create Comment ---
/**
 * Creates a new comment for a specific prompt.
 * @param promptId - The UUID of the prompt to comment on.
 * @param content - The text content of the comment.
 * @param username - Optional username for the comment.
 * @returns A promise that resolves to the newly created Comment object (including modification_code).
 */
export async function createComment(
    promptId: string,
    content: string,
    username?: string
): Promise<CommentWithCode> {
  const url = `${API_BASE_URL}/prompts/${promptId}/comments/`;

  const body: { content: string; username?: string } = { content };
  if (username) {
    body.username = username;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      // ... existing error handling for non-ok responses ...
      const errorData = await response.json().catch(() => response.text());
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      let errorMessage = `Failed to create comment: ${response.status} ${response.statusText}`;
      if (response.status === 400) {
        // Specific handling for validation errors if the backend provides details
        errorMessage = `Bad Request: ${JSON.stringify(errorData)}`;
      } else if (response.status === 404) {
        errorMessage = `Prompt with ID ${promptId} not found.`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      // Add more specific error handling if needed (e.g., 403 Forbidden)

      throw new Error(errorMessage);
    }

    // Expect 201 Created status on success
    if (response.status === 201) {
      const newComment: CommentWithCode = await response.json();
      if (!newComment.modification_code) {
          console.warn("Modification code missing from successful comment creation response:", newComment);
          // Consider throwing an error here if mod code is absolutely essential
          // throw new Error("Modification code missing from comment creation response.");
      }
      return newComment;
    } else {
      // --- FIX: Throw error for unexpected success status ---
      // Handle unexpected success statuses by throwing an error
      console.warn(`Unexpected success status ${response.status} creating comment.`);
      throw new Error(`Received unexpected status ${response.status} when creating comment.`);
      // --- END FIX ---
    }

  } catch (error) {
    console.error(`Network or other error creating comment for prompt ${promptId}:`, error);
    throw error;
  }
}
// --- End Update Create Comment ---


// --- NEW: Delete Comment ---
/**
 * Deletes a specific comment using its ID and modification code.
 * @param commentId - The UUID of the comment to delete.
 * @param modificationCode - The modification code required for deletion.
 * @returns A promise that resolves if the deletion is successful (status 204).
 */
export async function deleteComment(
    commentId: string,
    modificationCode: string
): Promise<void> {
  const url = `${API_BASE_URL}/comments/${commentId}/`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        // Add other headers like Authorization if needed
      },
      // Send the modification code in the body as expected by the backend
      body: JSON.stringify({ modification_code: modificationCode }),
    });

    // Check for different error statuses
    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text()); // Try to parse JSON, fallback to text
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);

      let errorMessage = `Failed to delete comment: ${response.status} ${response.statusText}`;
      if (response.status === 403) {
        // Specific handling for permission denied (likely invalid code)
        errorMessage = `Permission Denied: Invalid modification code or not allowed to delete.`;
        // You could potentially parse errorData.detail if the backend sends it
        if (typeof errorData === 'object' && errorData?.detail) {
            errorMessage = `Permission Denied: ${errorData.detail}`;
        }
      } else if (response.status === 404) {
        errorMessage = `Comment with ID ${commentId} not found.`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      // Add more specific error handling if needed

      throw new Error(errorMessage);
    }

    // Expect 204 No Content status on successful deletion
    if (response.status === 204) {
      return; // Resolve the promise with no value
    } else {
      // Handle unexpected success statuses
      console.warn(`Unexpected status ${response.status} deleting comment ${commentId}.`);
      // Even if unexpected, if it wasn't an error, resolve void
      return;
    }

  } catch (error) {
    // Catch network errors or errors thrown from response handling
    console.error(`Network or other error deleting comment ${commentId}:`, error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}
// --- End Delete Comment ---


// --- NEW: Update Comment ---
/**
 * Updates the content of a specific comment using its ID and modification code.
 * Uses PATCH for partial update.
 * @param commentId - The UUID of the comment to update.
 * @param newContent - The new text content for the comment.
 * @param modificationCode - The modification code required for updating.
 * @returns A promise that resolves to the updated Comment object.
 */
export async function updateComment(
    commentId: string,
    newContent: string,
    modificationCode: string
): Promise<Comment> { // Returns the updated comment object
  const url = `${API_BASE_URL}/comments/${commentId}/`;

  const body = {
    content: newContent,
    modification_code: modificationCode,
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH', // Use PATCH for partial update
      headers: {
        'Content-Type': 'application/json',
        // Add other headers like Authorization if needed
      },
      body: JSON.stringify(body),
    });

    // Check for different error statuses
    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text()); // Try to parse JSON, fallback to text
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);

      let errorMessage = `Failed to update comment: ${response.status} ${response.statusText}`;
      if (response.status === 400) {
        // Specific handling for validation errors
        errorMessage = `Bad Request: ${JSON.stringify(errorData)}`;
      } else if (response.status === 403) {
        // Specific handling for permission denied (likely invalid code)
        errorMessage = `Permission Denied: Invalid modification code or not allowed to update.`;
        if (typeof errorData === 'object' && errorData?.detail) {
            errorMessage = `Permission Denied: ${errorData.detail}`;
        }
      } else if (response.status === 404) {
        errorMessage = `Comment with ID ${commentId} not found.`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      // Add more specific error handling if needed

      throw new Error(errorMessage);
    }

    // Expect 200 OK status on successful update
    if (response.status === 200) {
      const updatedComment: Comment = await response.json();
      return updatedComment; // Return the full updated comment object
    } else {
      // Handle unexpected success statuses
      console.warn(`Unexpected status ${response.status} updating comment ${commentId}.`);
      // Attempt to parse anyway, but might be null or incorrect structure
      return await response.json();
    }

  } catch (error) {
    // Catch network errors or errors thrown from response handling
    console.error(`Network or other error updating comment ${commentId}:`, error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}
// --- End Update Comment ---


// --- NEW: Create Prompt ---
/**
 * Creates a new prompt.
 * @param title - The title of the prompt.
 * @param content - The main content of the prompt.
 * @param tags - Optional array of tag strings.
 * @param username - Optional username string. // <-- ADDED parameter
 * @returns A promise that resolves to the newly created Prompt object including its modification code.
 */
// --- Update function signature and return type ---
export async function createPrompt(
    title: string,
    content: string,
    tags?: string[],
    username?: string // Add optional username parameter
): Promise<PromptWithCode> { // Use PromptWithCode return type
// --- End Update ---
  const url = `${API_BASE_URL}/prompts/`;

  // --- Update body to include username if provided ---
  const body: { title: string; content: string; tags?: string[]; username?: string } = { title, content };
  if (tags && tags.length > 0) {
    body.tags = tags;
  }
  if (username) { // Only include username in body if it's provided
    body.username = username;
  }
  // --- End Update ---

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body), // Send updated body
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      let errorMessage = `Failed to create prompt: ${response.status} ${response.statusText}`;
      if (response.status === 400) {
        errorMessage = `Bad Request: ${JSON.stringify(errorData)}`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      throw new Error(errorMessage);
    }

    if (response.status === 201) {
      // --- Ensure response is parsed as PromptWithCode ---
      const newPrompt: PromptWithCode = await response.json();
      return newPrompt;
    } else {
      console.warn(`Unexpected success status ${response.status} creating prompt.`);
      return await response.json(); // Attempt to parse anyway
    }

  } catch (error) {
    console.error(`Network or other error creating prompt:`, error);
    throw error;
  }
}
// --- End Update Create Prompt ---


// --- NEW: Get Random Prompt ---
/**
 * Fetches a single random prompt from the API.
 * @returns A promise that resolves to a Prompt object.
 */
export async function getRandomPrompt(): Promise<Prompt> {
  const url = `${API_BASE_URL}/prompts/random/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      if (response.status === 404) {
          // This might happen if there are absolutely no prompts in the database
          throw new Error(`No prompts found to select a random one.`);
      }
      throw new Error(`Failed to fetch random prompt: ${response.status} ${response.statusText}`);
    }

    // Expect 200 OK status on success
    const randomPrompt: Prompt = await response.json();
    return randomPrompt;

  } catch (error) {
    console.error(`Network or other error fetching random prompt:`, error);
    throw error; // Re-throw
  }
}
// --- End Get Random Prompt ---


// --- NEW: Update Prompt (PATCH) ---
/**
 * Partially updates a prompt using its ID and modification code.
 * @param promptId - The UUID of the prompt to update.
 * @param updates - An object containing the fields to update (e.g., { title?: string, content?: string, tags?: string[] }).
 * @param modificationCode - The modification code required for updating.
 * @returns A promise that resolves to the updated PromptDetail object.
 */
export async function updatePrompt(
    promptId: string,
    updates: Partial<Pick<Prompt, 'title' | 'content' | 'tags'>>, // Only allow updating title, content, tags
    modificationCode: string
): Promise<PromptDetail> { // Assuming the backend returns the full detail on update
  const url = `${API_BASE_URL}/prompts/${promptId}/`;

  const body = {
    ...updates,
    modification_code: modificationCode,
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => response.text());
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);

      let errorMessage = `Failed to update prompt: ${response.status} ${response.statusText}`;
      if (response.status === 400) {
        errorMessage = `Bad Request: ${JSON.stringify(errorData)}`;
      } else if (response.status === 403) {
        errorMessage = `Permission Denied: Invalid modification code or not allowed.`;
         if (typeof errorData === 'object' && errorData?.detail) {
            errorMessage = `Permission Denied: ${errorData.detail}`;
        }
      } else if (response.status === 404) {
        errorMessage = `Prompt with ID ${promptId} not found.`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded.';
      }
      throw new Error(errorMessage);
    }

    // Expect 200 OK on successful update
    const updatedPrompt: PromptDetail = await response.json();
    return updatedPrompt;

  } catch (error) {
    console.error(`Network or other error updating prompt ${promptId}:`, error);
    throw error;
  }
}
// --- End Update Prompt ---


// --- NEW: Delete Prompt ---
/**
 * Deletes a prompt using its ID and modification code.
 * @param promptId - The UUID of the prompt to delete.
 * @param modificationCode - The modification code required for deletion.
 * @returns A promise that resolves when deletion is successful.
 */
export async function deletePrompt(
    promptId: string,
    modificationCode: string
): Promise<void> {
  const url = `${API_BASE_URL}/prompts/${promptId}/`;

  const body = {
    modification_code: modificationCode,
  };

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json', // Required even for DELETE if sending a body
      },
      body: JSON.stringify(body), // Send modification code in the body
    });

    // DELETE should return 204 No Content on success
    if (response.status === 204) {
      return; // Success
    }

    // Handle errors if not 204
    const errorData = await response.json().catch(() => response.text());
    console.error(`API Error ${response.status}: ${response.statusText}`, errorData);

    let errorMessage = `Failed to delete prompt: ${response.status} ${response.statusText}`;
     if (response.status === 403) {
        errorMessage = `Permission Denied: Invalid modification code or not allowed.`;
         if (typeof errorData === 'object' && errorData?.detail) {
            errorMessage = `Permission Denied: ${errorData.detail}`;
        }
      } else if (response.status === 404) {
        errorMessage = `Prompt with ID ${promptId} not found.`;
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded.';
      }
    throw new Error(errorMessage);

  } catch (error) {
    console.error(`Network or other error deleting prompt ${promptId}:`, error);
    throw error;
  }
}
// --- End Delete Prompt ---


// --- NEW: Fetch Tags ---
/**
 * Fetches the unique list of tags used across all prompts.
 * @returns A promise that resolves to an array of tag strings.
 */
export async function fetchTags(): Promise<string[]> {
  const url = `${API_BASE_URL}/tags/`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`API Error ${response.status}: ${response.statusText}`, errorData);
      throw new Error(`Failed to fetch tags: ${response.status} ${response.statusText}`);
    }

    // Expect 200 OK status on success
    const tags: string[] = await response.json();
    return tags;

  } catch (error) {
    console.error(`Network or other error fetching tags:`, error);
    throw error; // Re-throw
  }
}
// --- End Fetch Tags ---


// --- Helper function for handling API responses (Add this if not already present) ---
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        // Try to parse JSON error, fallback to text
        const errorData = await response.json().catch(() => ({ message: response.statusText, detail: response.statusText }));
        
        let errorMessage = errorData?.detail || errorData?.message || `HTTP error! status: ${response.status}`;

        // --- ADD SPECIFIC 429 HANDLING ---
        if (response.status === 429) {
            errorMessage = errorData?.detail || 'You have made too many requests. Please try again later.';
        }
        // --- END SPECIFIC 429 HANDLING ---

        console.error(`API Error ${response.status}:`, errorData);
        throw new Error(errorMessage);
    }
    // For 204 No Content, response.json() will fail, handle it if necessary for specific endpoints
    if (response.status === 204) {
        return null as T; // Or handle as appropriate for the expected type T
    }
    return response.json() as Promise<T>;
}
// --- End Helper Function ---


// --- NEW: Fetch Prompts Batch ---
/**
 * Fetches the latest data for a list of prompt IDs.
 * @param promptIds - An array of prompt UUIDs.
 * @returns A promise that resolves to an array of Prompt objects.
 */
export async function fetchPromptsBatch(promptIds: string[]): Promise<Prompt[]> {
  if (!promptIds || promptIds.length === 0) {
    return []; // Nothing to fetch
  }
  const url = `${API_BASE_URL}/prompts/batch/`; // Ensure endpoint matches backend

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // --- CHANGE 'prompt_ids' TO 'ids' ---
      body: JSON.stringify({ ids: promptIds }),
      // --- END CHANGE ---
    });
    // Expects the backend to return an array of Prompt objects matching the requested IDs
    return await handleResponse<Prompt[]>(response);
  } catch (error) {
    console.error('Error fetching prompts batch:', error);
    // Re-throw the error so the calling component can handle it
    throw error;
  }
}
// --- End Fetch Prompts Batch ---