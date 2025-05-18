import React from 'react';
import Editor from './components/Editor';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-6">Collaborative Document Editor</h1>
      <Editor />
    </div>
  );
}
