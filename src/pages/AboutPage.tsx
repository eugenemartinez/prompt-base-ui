import { Card, CardContent, CardHeader, CardFooter } from '../components/common/Card'; // Add CardFooter
import { BsJournalCode, BsHouseDoor } from 'react-icons/bs'; // Add BsHouseDoor
import { Button } from '../components/common/Button'; // Import Button
import { Link } from 'react-router-dom'; // Import Link

function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <h2 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
            <BsJournalCode />
            <span>About PromptBase</span>
          </h2>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>
            PromptBase is a simple application designed for creating, sharing, and managing text prompts,
            like those used for AI models (e.g., ChatGPT, Midjourney) or any other text snippets you want to store.
          </p>
          <h3 className="text-lg font-semibold text-foreground pt-2">How it Works</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Create Prompts:</strong> Use the form on the homepage to create a new prompt with a title, content, optional username, and relevant tags.
            </li>
            <li>
              <strong>Modification Code:</strong> When you create a prompt or comment, your browser automatically saves a unique modification code. This allows you to edit or delete your content later from the same browser, ensuring only you can modify your contributions without needing user accounts.
            </li>
            <li>
              <strong>View & Discover:</strong> Browse all submitted prompts on the homepage. Use tags to filter and find relevant prompts. Click on a prompt to see its full details and any comments.
            </li>
            <li>
              <strong>Commenting:</strong> Share ChatGPT's response, your thoughts or variations by adding comments to prompts. Your modification code is saved automatically for editing/deletion.
            </li>
            <li>
              <strong>My Vault:</strong> Use the "Save to Vault" button on any prompt you find interesting. The "My Vault" page provides quick access to all your saved prompts. This uses your browser's local storage, so your vault is specific to your current browser.
            </li>
            <li>
              <strong>Chat with ChatGPT:</strong> Quickly send a prompt's content directly to ChatGPT by using the dedicated 'Chat with ChatGPT' button in the prompt detail view.
            </li>
          </ul>
          <p className="pt-4">
            This application demonstrates basic full-stack principles using React for the frontend, Django REST Framework for the backend API, and Neon for the Database.
          </p>
        </CardContent>
        {/* --- Add CardFooter with Button --- */}
        <CardFooter className="flex justify-center">
          <Link to="/">
            <Button variant="secondary" iconLeft={<BsHouseDoor />}>
              Go to Homepage
            </Button>
          </Link>
        </CardFooter>
        {/* --- End Add --- */}
      </Card>
    </div>
  );
}

export default AboutPage;