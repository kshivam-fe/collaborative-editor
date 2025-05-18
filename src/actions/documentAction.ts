import { createAsyncThunk } from '@reduxjs/toolkit';
import { undo, redo } from '../slices/documentSlice';
import type { RootState } from '../store';

export const undoWithBroadcast = createAsyncThunk<
  void,
  { userId: string; broadcast: BroadcastChannel },
  { state: RootState }
>('document/undoWithBroadcast', async ({ userId, broadcast }, { dispatch, getState }) => {
  dispatch(undo({ userId }));

  const lastChange = getState().document.lastChange;
  if (lastChange && lastChange.userId === userId) {
    broadcast.postMessage({
      userId,
      start: lastChange.start,
      end: lastChange.start + lastChange.oldText.length,
      newText: lastChange.newText,
    });
  }
});

export const redoWithBroadcast = createAsyncThunk<
  void,
  { userId: string; broadcast: BroadcastChannel },
  { state: RootState }
>('document/redoWithBroadcast', async ({ userId, broadcast }, { dispatch, getState }) => {
  dispatch(redo({ userId }));

  const lastChange = getState().document.lastChange;
  if (lastChange && lastChange.userId === userId) {
    broadcast.postMessage({
      userId,
      start: lastChange.start,
      end: lastChange.end,
      newText: lastChange.newText,
    });
  }
});
