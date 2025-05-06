# PromptBase Frontend

This is the frontend application for PromptBase, built with React (Vite) and TypeScript.

## Prerequisites

*   **Node.js:** Version 23.1

## Installation

1.  **Clone the repository (if needed) and navigate to the `prompt-base-ui` directory:**
    ```bash
    # Example:
    # git clone https://github.com/eugenemartinez/prompt-base-ui
    # cd prompt-base-ui
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

## Configuration

The frontend needs to know the URL of the backend API. Configure this by creating a `.env` file in the `prompt-base-ui` directory:

```env
# .env
VITE_API_BASE_URL=https://prompt-base-api.vercel.app/api/
```

Replace `https://prompt-base-api.vercel.app/api/` with the actual URL of your running backend API if it's different (e.g., `http://localhost:8000/api` for local development).

## Running Locally (Development)

To start the development server with hot-reloading:

```bash
npm run dev
# or
# yarn dev
```

The application will typically be available at `http://localhost:5173` (or another port if 5173 is busy). The development server will proxy API requests to the URL specified in `VITE_API_BASE_URL` (configured in `vite.config.ts`). Make sure your `.env` file points to your local backend (e.g., `http://localhost:8000/api`) when running locally.

## Building for Production

To create an optimized production build:

```bash
npm run build
# or
# yarn build
```

This command generates static HTML, CSS, and JavaScript files in the `dist` directory. These files are ready to be deployed to any static hosting service or served by your backend server.

## Deployment Notes

*   The production build in the `dist` directory contains static assets.
*   Ensure your web server (like Nginx, Apache, or your hosting platform) is configured to serve the `index.html` file for any route not matching a static file (to handle client-side routing).
*   Make sure the `VITE_API_BASE_URL` environment variable is correctly set during the build process (e.g., to `https://prompt-base-api.vercel.app/api/`) or that the deployed frontend can reach the production backend API URL.