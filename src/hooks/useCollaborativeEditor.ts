import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  applyChange,
  receiveExternalChange,
  setContent,
} from "../slices/documentSlice";
import type { AppDispatch, RootState } from "../store";
import {
  redoWithBroadcast,
  undoWithBroadcast,
} from "../actions/documentAction";
import { findDiff, placeCursorAtPosition } from "../utils/doc.util";
import { DEBOUNCE_DELAY } from "../constant";

export function useCollaborativeEditor() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);
  const document = useSelector((state: RootState) => state.document);

  const editorRef = useRef<HTMLDivElement>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef(document.content);

  const [lastChangeInfo, setLastChangeInfo] = useState<{
    userName: string;
    timestamp: number;
  } | null>(null);

  // Persist document content to localStorage
  useEffect(() => {
    if (document.lastChange) {
      localStorage.setItem("collab-document-content", document.content);
    }
  }, [document.content, document.lastChange]);

  // Load saved content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("collab-document-content") || "";
    if (savedContent !== null) {
      dispatch(setContent(savedContent));
    }
  }, [dispatch]);

  // Initialize BroadcastChannel and listen for external changes
  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel("collab-doc-channel");

    broadcastChannelRef.current.onmessage = (event) => {
      const { userId, start, end, newText, userName } = event.data;
      if (userId !== user.id) {
        dispatch(
          receiveExternalChange({ userId, start, end, newText, userName })
        );
      }
    };

    return () => {
      broadcastChannelRef.current?.close();
    };
  }, [dispatch, user.id]);

  // Render content with highlight and restore cursor position
  useEffect(() => {
    if (!editorRef.current) return;

    const { content, lastChange } = document;

    const escapeHtml = (text: string) =>
      text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    if (lastChange) {
      const { start, end } = lastChange;
      const before = escapeHtml(content.slice(0, start));
      const highlight = escapeHtml(content.slice(start, end));
      const after = escapeHtml(content.slice(end));

      editorRef.current.innerHTML = `${before}<span style="background-color:teal; padding: 0 2px; border-radius: 2px;">${highlight}</span>${after}`;
    } else {
      editorRef.current.innerText = content;
    }

    lastContentRef.current = content;

    placeCursorAtPosition(
      editorRef.current,
      lastChange ? lastChange.end : content.length
    );
  }, [document.content, document.lastChange, document]);

  useEffect(() => {
    if (document.lastChange) {
      const userName =
        document.lastChange.userId === user.id
          ? user.name
          : document.lastChange.userName;
      setLastChangeInfo({ userName, timestamp: Date.now() });
    }
  }, [document.lastChange, user.id, user.name]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Handle user input with diff computation and sync
  function handleInput() {
    if (!editorRef.current) return;

    const newContent = editorRef.current.innerText;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const oldContent = lastContentRef.current;

      const { start, end, insertedText } = findDiff(oldContent, newContent);
      if (start === -1) return;

      lastContentRef.current = newContent;

      dispatch(
        applyChange({
          userId: user.id,
          userName: user.name,
          start,
          end,
          newText: insertedText,
        })
      );

      broadcastChannelRef.current?.postMessage({
        userId: user.id,
        userName: user.name,
        start,
        end,
        newText: insertedText,
      });
    }, DEBOUNCE_DELAY);
  }

  function handleUndo() {
    if (broadcastChannelRef.current) {
      dispatch(
        undoWithBroadcast({
          userId: user.id,
          broadcast: broadcastChannelRef.current,
        })
      );
    }
  }

  function handleRedo() {
    if (broadcastChannelRef.current) {
      dispatch(
        redoWithBroadcast({
          userId: user.id,
          broadcast: broadcastChannelRef.current,
        })
      );
    }
  }

  return {
    editorRef,
    user,
    document,
    lastChangeInfo,
    handleInput,
    handleUndo,
    handleRedo,
  };
}
