import { useCollaborativeEditor } from "../hooks/useCollaborativeEditor";

export default function Editor() {
  const {
    editorRef,
    user,
    document,
    lastChangeInfo,
    handleInput,
    handleUndo,
    handleRedo,
  } = useCollaborativeEditor();

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
              document.undoStack.filter((c) => c.userId === user.id).length === 0
            }
            className="px-3 py-1 rounded bg-red-400 hover:bg-red-500 text-white disabled:opacity-50"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={
              document.redoStack.filter((c) => c.userId === user.id).length === 0
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