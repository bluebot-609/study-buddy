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
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            ← Back to Documents
          </Link>
        </div>
        <h1 className="text-4xl font-bold mb-8 text-foreground">New Document</h1>

        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2 text-foreground">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
              placeholder="Document title"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium mb-2 text-foreground">
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
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Maximum file size: 25MB. For best performance, we recommend files between <strong className="text-foreground">10-15MB</strong>.
            </p>
            {file && (
              <p className="mt-1 text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">OR</span>
            </div>
          </div>

          <div>
            <label htmlFor="text" className="block text-sm font-medium mb-2 text-foreground">
              Paste Text
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all resize-none"
              placeholder="Paste your study notes here..."
            />
          </div>

          <div className="flex gap-3">
            <Link
              href="/documents"
              className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium text-center border border-border"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
            >
              {loading ? 'Creating...' : 'Create Document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

