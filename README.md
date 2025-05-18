# Collaborative Editor

A simple real-time collaborative text editor built with React, TypeScript, Redux Toolkit, and the BroadcastChannel API.

## Features

- Real-time collaborative editing across multiple browser tabs/windows.
- Undo and redo functionality per user.
- Highlights the last changed text segment with the user name.
- Local persistence of document content in `localStorage`.
- In-place content editing with cursor position maintained after changes.
- Broadcasts changes via the BroadcastChannel API to synchronize tabs.
- Supports mutable document content with insertion, deletion, and replacement.

## Technologies Used

- React with TypeScript
- Redux Toolkit for state management
- BroadcastChannel API for cross-tab communication
- Vite for fast React project setup and build
- Tailwind CSS for basic styling

## Setup and Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/collaborative-editor.git
   cd collaborative-editor

2. Install Install dependencies:

    ```bash
    npm install

3. Run the development server:

    ```bash
    npm run dev

4. Open multiple browser tabs at http://localhost:3000 (or the port Vite reports) to test real-time collaboration.


## Usage

 - Start typing in one tab; changes will appear in other tabs in real time.
 - Undo and redo your changes using the provided buttons.
 - The last changed text is highlighted and shows the user who made the change.
 - Document content persists in localStorage, so refreshing the page restores your text.


## Key Implementation Details

 - The document content is stored as a single string in Redux.
 - Changes are tracked with start and end indices and the inserted text.
 - Undo and redo stacks keep per-user history for their changes.
 - BroadcastChannel is used to send/receive changes across tabs.
 - The editor uses a contentEditable <div>, updating innerText and restoring the cursor after changes.
 - Highlighting is done by injecting a <span> with background color around the last changed range.

## Made with ❤️ using React, TypeScript, and Redux Toolkit.