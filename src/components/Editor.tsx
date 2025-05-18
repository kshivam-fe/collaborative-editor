import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  applyChange,
  receiveExternalChange,
  setContent,
} from "../slices/documentSlice";
import type { AppDispatch, RootState } from "../store";
import { redoWithBroadcast, undoWithBroadcast } from "../actions/documentAction";

const DEBOUNCE_DELAY = 300;

export default function Editor() {
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

  useEffect(() => {
    if (document.content.trim().length > 0) {
      localStorage.setItem("collab-document-content", document.content);
    }
  }, [document.content]);


  useEffect(() => {
    const savedContent = localStorage.getItem("collab-document-content") || "";
    if (savedContent !== null) {
      dispatch(setContent(savedContent));
    }
  }, [dispatch]);

  // Initialize BroadcastChannel
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


  // On document content change from redux (external or undo/redo), update editor content once
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-3 flex justify-between items-center">
        <div>
          <strong className="mr-2">Logged in as:</strong> {user.name} (
          {user.id.slice(0, 6)})
        </div>
        <div className="space-x-2">
          <button
            onClick={handleUndo}
            disabled={
              document.undoStack.filter((c) => c.userId === user.id).length ===
              0
            }
            className="px-3 py-1 rounded bg-red-400 hover:bg-red-500 text-white disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={
              document.redoStack.filter((c) => c.userId === user.id).length ===
              0
            }
            className="px-3 py-1 rounded bg-green-400 hover:bg-green-500 text-white disabled:opacity-50"
          >
            Redo
          </button>
        </div>
      </div>

      <div
        ref={editorRef}
        className="border border-gray-300 rounded p-2 min-h-[200px] whitespace-pre-wrap break-words outline-none"
        contentEditable
        spellCheck={false}
        onInput={handleInput}
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning={true}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          fontFamily: "inherit",
          fontSize: "1rem",
        }}
      />

      {lastChangeInfo && (
        <div className="mt-2 p-1 bg-yellow-200 text-yellow-900 rounded text-sm w-fit">
          Last change by: {lastChangeInfo.userName}
        </div>
      )}
    </div>
  );
}

function findDiff(oldStr: string, newStr: string) {
  let start = 0;
  while (
    start < oldStr.length &&
    start < newStr.length &&
    oldStr[start] === newStr[start]
  ) {
    start++;
  }

  let endOld = oldStr.length - 1;
  let endNew = newStr.length - 1;
  while (
    endOld >= start &&
    endNew >= start &&
    oldStr[endOld] === newStr[endNew]
  ) {
    endOld--;
    endNew--;
  }

  if (start > endOld && start > endNew) {
    return { start: -1, end: -1, insertedText: "" };
  }

  const insertedText = newStr.slice(start, endNew + 1);
  return { start, end: endOld + 1, insertedText };
}



function placeCursorAtEnd(el: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  // Create a range
  const range = document.createRange();

  // Set the range to the last child node and its length (end position)
  // If the element has child nodes, try to set the range to the last text node
  if (el.lastChild) {
    if (el.lastChild.nodeType === Node.TEXT_NODE) {
      // If last child is text node, place cursor at the end of its text content
      range.setStart(el.lastChild, el.lastChild.textContent?.length || 0);
    } else {
      // If last child is element, place cursor after it
      range.setStartAfter(el.lastChild);
    }
  } else {
    // If no children, set range at position 0
    range.setStart(el, 0);
  }

  range.collapse(true);

  // Clear existing selection and set new range
  selection.removeAllRanges();
  selection.addRange(range);
}
