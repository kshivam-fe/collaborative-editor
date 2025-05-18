import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface LastChange {
  userId: string;
  timestamp: number;
  start: number;
  end: number;
  oldText: string; // text before the change
  newText: string; // text after the change
}

interface DocumentState {
  content: string;
  lastChange: LastChange | null;
  undoStack: LastChange[]; // user-specific undo history
  redoStack: LastChange[]; // user-specific redo history
}

const initialState: DocumentState = {
  content: "",
  lastChange: null,
  undoStack: [],
  redoStack: [],
};

const documentSlice = createSlice({
  name: "document",
  initialState,
  reducers: {
    setContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
      // Reset undo/redo stacks optionally
      state.undoStack = [];
      state.redoStack = [];
      state.lastChange = null;
    },
    applyChange: (
      state,
      action: PayloadAction<{
        userId: string;
        start: number;
        end: number;
        newText: string;
      }>
    ) => {
      const { userId, start, end, newText } = action.payload;
      const oldText = state.content.slice(start, end);

      // Apply the change to the content string
      state.content =
        state.content.slice(0, start) + newText + state.content.slice(end);

      const change: LastChange = {
        userId,
        timestamp: Date.now(),
        start,
        end: start + newText.length,
        oldText,
        newText,
      };

      // Update last change for highlighting
      state.lastChange = change;

      // Push change to undo stack for the user
      state.undoStack.push(change);

      // Clear redo stack on new edit
      state.redoStack = [];
    },

    undo: (state, action: PayloadAction<{ userId: string }>) => {
      // Find last change by user in undo stack
      for (let i = state.undoStack.length - 1; i >= 0; i--) {
        if (state.undoStack[i].userId === action.payload.userId) {
          const change = state.undoStack.splice(i, 1)[0];
          // Revert change
          state.content =
            state.content.slice(0, change.start) +
            change.oldText +
            state.content.slice(change.end);

          // Add reverted change to redo stack
          state.redoStack.push(change);

          // Update lastChange to reverted one (for highlight)
          state.lastChange = {
            userId: change.userId,
            start: change.start,
            end: change.start + change.oldText.length,
            newText: change.oldText, // what we just "re-inserted"
            oldText: change.newText, // the text we removed to revert
            timestamp: change.timestamp,
          };

          break;
        }
      }
    },

    redo: (state, action: PayloadAction<{ userId: string }>) => {
      // Find last redo change for user
      for (let i = state.redoStack.length - 1; i >= 0; i--) {
        if (state.redoStack[i].userId === action.payload.userId) {
          const change = state.redoStack.splice(i, 1)[0];
          // Reapply change
          state.content =
            state.content.slice(0, change.start) +
            change.newText +
            state.content.slice(change.start + change.oldText.length);

          // Add back to undo stack
          state.undoStack.push(change);

          // Update lastChange to redone one
          state.lastChange = change;
          break;
        }
      }
    },

    receiveExternalChange: (
      state,
      action: PayloadAction<{
        userId: string;
        start: number;
        end: number;
        newText: string;
      }>
    ) => {
      // Apply external change (from BroadcastChannel)
      const { userId, start, end, newText } = action.payload;
      state.content =
        state.content.slice(0, start) + newText + state.content.slice(end);

      // Update lastChange for highlight (but do not touch undo/redo stacks)
      state.lastChange = {
        userId,
        timestamp: Date.now(),
        start,
        end: start + newText.length,
        oldText: "",
        newText,
      };
    },
  },
});

export const { applyChange, undo, redo, receiveExternalChange, setContent } =
  documentSlice.actions;
export default documentSlice.reducer;
