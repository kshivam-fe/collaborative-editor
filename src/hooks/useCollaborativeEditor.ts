import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  applyChange,
  receiveExternalChange,
  setContent,
} from "../slices/documentSlice";
import type { AppDispatch, RootState } from "../store";
import { redoWithBroadcast, undoWithBroadcast } from "../actions/documentAction";
import { findDiff, placeCursorAtEnd } from "../utils/doc.util";
import { DEBOUNCE_DELAY } from "../constant";

export function useCollaborativeEditor() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.user);
  const document = useSelector((state: RootState) => state.document);

  const editorRef = useRef<HTMLDivElement>(null);
  const broadcast = useRef<BroadcastChannel | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastContentRef = useRef(document.content);

  const [lastChangeInfo, setLastChangeInfo] = useState<{
    userName: string;
    timestamp: number;
  } | null>(null);

  // Persist document content to localStorage
  useEffect(() => {
    if (document.content.trim().length > 0) {
      localStorage.setItem("collab-document-content", document.content);
    }
  }, [document.content]);

  // Load saved content from localStorage on mount
  useEffect(() => {
    const savedContent = localStorage.getItem("collab-document-content") || "";
    if (savedContent !== null) {
      dispatch(setContent(savedContent));
    }
  }, [dispatch]);

  // Initialize BroadcastChannel and listen for external changes
  useEffect(() => {
    broadcast.current = new BroadcastChannel("collab-doc-channel");
    broadcast.current.onmessage = (event) => {
      const { userId, start, end, newText } = event.data;
      if (userId !== user.id) {
        dispatch(receiveExternalChange({ userId, start, end, newText }));
      }
    };
    return () => broadcast.current?.close();
  }, [dispatch, user.id]);

  // Update editor DOM content when redux document changes
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

    placeCursorAtEnd(editorRef.current!);
  }, [document.content, document.lastChange, document]);

  // Show last change info for 5 seconds
  useEffect(() => {
    if (document.lastChange) {
      const userName =
        document.lastChange.userId === user.id
          ? user.name
          : `User (${document.lastChange.userId.slice(0, 4)})`;
      setLastChangeInfo({ userName, timestamp: Date.now() });

      const timeout = setTimeout(() => {
        setLastChangeInfo(null);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [document.lastChange, user.id, user.name]);

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
          start,
          end,
          newText: insertedText,
        })
      );

      broadcast.current?.postMessage({
        userId: user.id,
        start,
        end,
        newText: insertedText,
      });
    }, DEBOUNCE_DELAY);
  }

  function handleUndo() {
    if (broadcast.current) {
      dispatch(undoWithBroadcast({ userId: user.id, broadcast: broadcast.current }));
    }
  }

  function handleRedo() {
    if (broadcast.current) {
      dispatch(redoWithBroadcast({ userId: user.id, broadcast: broadcast.current }));
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
