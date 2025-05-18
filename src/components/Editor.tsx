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
    <div className="w-full h-screen flex flex-col bg-gray-900 text-gray-300 font-sans">
      <header className="flex justify-between items-center px-6 py-4 bg-gray-850 border-b border-gray-700 shadow-sm rounded-none">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 mb-1">
            Collaborative Document Editor
          </h1>
          <p className="text-sm text-gray-400">
            Logged in as:{" "}
            <span className="text-gray-200 font-medium">{user.name}</span> (
            <span className="text-gray-500">{user.id.slice(0, 6)}</span>)
          </p>
        </div>
        <div className="space-x-3 flex items-center">
          <button
            onClick={handleUndo}
            disabled={
              document.undoStack.filter((c) => c.userId === user.id).length === 0
            }
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 rounded-none"
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={
              document.redoStack.filter((c) => c.userId === user.id).length === 0
            }
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors duration-200 rounded-none"
          >
            Redo
          </button>
        </div>
      </header>

      {lastChangeInfo && (
        <div
          className="fixed bottom-4 right-6 z-50 bg-gray-800 text-gray-300 px-4 py-2 text-sm shadow-md border border-gray-700 rounded-none min-w-[180px]"
        >
          Last change by: {lastChangeInfo.userName}
        </div>
      )}

      <main className="flex-1 px-6 py-4 overflow-hidden">
        <div
          ref={editorRef}
          className="w-full h-full bg-gray-850 text-gray-200 border border-gray-700 p-4 whitespace-pre-wrap break-words outline-none overflow-auto focus:ring-2 focus:ring-gray-600 focus:border-transparent transition rounded-none text-base font-inherit"
          contentEditable
          spellCheck={false}
          onInput={handleInput}
          role="textbox"
          aria-multiline="true"
          suppressContentEditableWarning={true}
        />
      </main>
    </div>
  );
}
