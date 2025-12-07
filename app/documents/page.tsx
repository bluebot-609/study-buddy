'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers/auth-provider';
import type { Document } from '@/types';

export default function DocumentsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      fetchDocuments();
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-100">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Documents</h1>
          <Link
            href="/documents/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + New Document
          </Link>
        </div>

          {error && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded">
            {error}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 mb-4">No documents yet.</p>
            <Link
              href="/documents/new"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Upload Your First Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-700 rounded-lg p-6 hover:bg-gray-800 transition-colors bg-gray-800"
              >
                <h2 className="text-xl font-semibold mb-2 text-gray-100">{doc.title}</h2>
                <p className="text-sm text-gray-300 mb-4">
                  {doc.content_type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/documents/${doc.id}`}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors font-medium"
                  >
                    Open
                  </Link>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

