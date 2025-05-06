import { Prompt } from '../types';

const VAULT_KEY = 'promptVault';
const PROMPT_CODES_KEY = 'promptbase_prompt_codes';
// --- NEW Comment Codes Key ---
const COMMENT_CODES_KEY = 'promptbase_comment_codes';
// --- End New Key ---

// Function to get all prompts from the vault (local storage)
export function getVaultPrompts(): Prompt[] {
  try {
    const storedValue = localStorage.getItem(VAULT_KEY);
    if (storedValue) {
      return JSON.parse(storedValue) as Prompt[];
    }
  } catch (error) {
    console.error("Error reading prompts from local storage:", error);
  }
  return []; // Return empty array if nothing stored or error occurs
}

// --- UPDATE savePromptToVault ---
// Function to save OR UPDATE a prompt in the vault
export function savePromptToVault(promptToSave: Prompt): boolean {
  try {
    const currentVault = getVaultPrompts();
    // Find the index of the prompt, if it exists
    const existingIndex = currentVault.findIndex(p => p.prompt_id === promptToSave.prompt_id);

    if (existingIndex > -1) {
      // Prompt exists: Update it in place
      currentVault[existingIndex] = promptToSave; // Replace the old object with the new one
    } else {
      // Prompt doesn't exist: Add it to the end
      currentVault.push(promptToSave);
    }

    // Save the modified vault back to local storage
    localStorage.setItem(VAULT_KEY, JSON.stringify(currentVault));
    return true; // Indicate successful save or update
  } catch (error) {
    console.error("Error saving/updating prompt in local storage:", error);
    return false; // Indicate failure
  }
}
// --- END UPDATE ---

// Function to remove a prompt from the vault
export function removePromptFromVault(promptId: string): boolean {
    try {
        const currentVault = getVaultPrompts();
        const updatedVault = currentVault.filter(p => p.prompt_id !== promptId);
        // Only update storage if the vault actually changed
        if (updatedVault.length < currentVault.length) {
            localStorage.setItem(VAULT_KEY, JSON.stringify(updatedVault));
            return true; // Indicate successful removal
        }
        return false; // Indicate prompt not found or no change
    } catch (error) {
        console.error("Error removing prompt from local storage:", error);
        return false; // Indicate failure
    }
}


// Function to check if a specific prompt ID is in the vault
export function isPromptInVault(promptId: string): boolean {
  const currentVault = getVaultPrompts();
  return currentVault.some(p => p.prompt_id === promptId);
}

// --- NEW Prompt Code Functions ---
/** Gets the map of prompt IDs to modification codes from localStorage. */
export function getPromptCodes(): Map<string, string> {
  try {
    const storedCodes = localStorage.getItem(PROMPT_CODES_KEY);
    if (storedCodes) {
      // Parse the stored JSON string back into an array of [id, code] pairs
      const parsedArray: [string, string][] = JSON.parse(storedCodes);
      // Create a new Map from the array
      return new Map(parsedArray);
    }
  } catch (error) {
    console.error("Error reading prompt codes from localStorage:", error);
  }
  // Return an empty map if nothing is stored or parsing fails
  return new Map();
}

/** Saves a prompt ID and its modification code to localStorage. */
export function savePromptCode(promptId: string, code: string): void {
  try {
    const currentCodes = getPromptCodes();
    currentCodes.set(promptId, code);
    // Convert Map to array for JSON stringification
    const codesArray = Array.from(currentCodes.entries());
    localStorage.setItem(PROMPT_CODES_KEY, JSON.stringify(codesArray));
  } catch (error) {
    console.error("Error saving prompt code to localStorage:", error);
  }
}

/** Removes a prompt's modification code from localStorage. */
export function removePromptCode(promptId: string): void {
  try {
    const currentCodes = getPromptCodes();
    if (currentCodes.delete(promptId)) { // Check if deletion happened
      // Convert Map to array for JSON stringification
      const codesArray = Array.from(currentCodes.entries());
      localStorage.setItem(PROMPT_CODES_KEY, JSON.stringify(codesArray));
    }
  } catch (error) {
    console.error("Error removing prompt code from localStorage:", error);
  }
}

/** Gets the modification code for a specific prompt ID. */
export function getPromptCode(promptId: string): string | undefined {
    // Directly use getPromptCodes to retrieve the map and then get the specific code
    return getPromptCodes().get(promptId);
}
// --- End Prompt Code Functions ---

// --- NEW Comment Code Functions ---
/** Gets the map of comment IDs to modification codes from localStorage. */
export function getCommentCodes(): Map<string, string> {
  try {
    const storedCodes = localStorage.getItem(COMMENT_CODES_KEY);
    if (storedCodes) {
      const parsedArray: [string, string][] = JSON.parse(storedCodes);
      return new Map(parsedArray);
    }
  } catch (error) {
    console.error("Error reading comment codes from localStorage:", error);
  }
  return new Map();
}

/** Saves a comment ID and its modification code to localStorage. */
export function saveCommentCode(commentId: string, code: string): void {
  try {
    const currentCodes = getCommentCodes();
    currentCodes.set(commentId, code);
    const codesArray = Array.from(currentCodes.entries());
    localStorage.setItem(COMMENT_CODES_KEY, JSON.stringify(codesArray));
  } catch (error) {
    console.error("Error saving comment code to localStorage:", error);
  }
}

/** Removes a comment's modification code from localStorage. */
export function removeCommentCode(commentId: string): void {
  try {
    const currentCodes = getCommentCodes();
    if (currentCodes.delete(commentId)) {
      const codesArray = Array.from(currentCodes.entries());
      localStorage.setItem(COMMENT_CODES_KEY, JSON.stringify(codesArray));
    }
  } catch (error) {
    console.error("Error removing comment code from localStorage:", error);
  }
}

/** Gets the modification code for a specific comment ID. */
export function getCommentCode(commentId: string): string | undefined {
    return getCommentCodes().get(commentId);
}
// --- End Comment Code Functions ---

/**
 * Removes all prompts from the vault in local storage.
 */
export const clearVault = (): void => {
  try {
    localStorage.removeItem(VAULT_KEY);
    console.log('Vault cleared from local storage.');
  } catch (error) {
    console.error('Error clearing vault from local storage:', error);
    // Optionally, handle the error (e.g., show a notification)
  }
};

// ... savePromptCode, getPromptCode ...