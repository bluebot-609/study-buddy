'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      } else if (text.trim()) {
        formData.append('text', text);
      } else {
        setError('Please provide either a file or text content');
        setLoading(false);
        return;
      }

      if (title.trim()) {
        formData.append('title', title);
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create document');
      }

      const data = await response.json();
      router.push(`/documents/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            ← Back to Documents
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-8 text-gray-100">New Document</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-gray-200">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400"
              placeholder="Document title"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2 text-gray-200">
              Upload PDF
            </label>
            <input
              type="file"
              id="file"
              accept=".pdf"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0] || null;
                if (selectedFile) {
                  const MAX_SIZE = 25 * 1024 * 1024; // 25MB
                  if (selectedFile.size > MAX_SIZE) {
                    setError(`File size (${(selectedFile.size / 1024 / 1024).toFixed(2)}MB) exceeds 25MB limit. Maximum file size is 25MB. For best performance, we recommend files between 10-15MB.`);
                    e.target.value = ''; // Clear the input
                    setFile(null);
                    return;
                  }
                }
                setFile(selectedFile);
                setError(null);
              }}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100"
            />
            <p className="mt-2 text-sm text-gray-400">
              Maximum file size: 25MB. For best performance, we recommend files between <strong className="text-gray-300">10-15MB</strong>.
            </p>
            {file && (
              <p className="mt-1 text-sm text-gray-400">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          <div className="text-center text-gray-400">OR</div>

          <div>
            <label htmlFor="text" className="block text-sm font-medium mb-2 text-gray-200">
              Paste Text
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400"
              placeholder="Paste your study notes here..."
            />
          </div>

          <div className="flex gap-3">
            <Link
              href="/documents"
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

