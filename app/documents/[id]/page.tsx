'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Document } from '@/types';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}`);
      if (!response.ok) throw new Error('Failed to fetch document');
      const data = await response.json();
      setDocument(data.document);
    } catch (err) {
      console.error('Error fetching document:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-100">Loading...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <p className="text-gray-100">Document not found</p>
          <Link href="/documents" className="text-blue-400 hover:text-blue-300">
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/documents" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              ← Back to Documents
            </Link>
          </div>

        <h1 className="text-4xl font-bold mb-8 text-gray-100">{document.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href={`/documents/${documentId}/tutor`}
            className="p-6 border-2 border-gray-700 rounded-lg hover:border-blue-600 hover:bg-gray-800 transition-all bg-gray-800 group"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-100 group-hover:text-blue-400">Tutor</h2>
            <p className="text-gray-300">Ask questions about this document</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 rounded text-sm font-medium">
                Chat with AI
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/flashcards`}
            className="p-6 border-2 border-gray-700 rounded-lg hover:border-green-600 hover:bg-gray-800 transition-all bg-gray-800 group"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-100 group-hover:text-green-400">Flashcards</h2>
            <p className="text-gray-300">Review flashcards from this document</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-green-600/20 text-green-400 rounded text-sm font-medium">
                Study Mode
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/mcqs`}
            className="p-6 border-2 border-gray-700 rounded-lg hover:border-purple-600 hover:bg-gray-800 transition-all bg-gray-800 group"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-100 group-hover:text-purple-400">MCQs</h2>
            <p className="text-gray-300">Practice with multiple choice questions</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-purple-600/20 text-purple-400 rounded text-sm font-medium">
                Practice Quiz
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/notes`}
            className="p-6 border-2 border-gray-700 rounded-lg hover:border-yellow-600 hover:bg-gray-800 transition-all bg-gray-800 group"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-100 group-hover:text-yellow-400">Notes</h2>
            <p className="text-gray-300">View concise summary notes</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-yellow-600/20 text-yellow-400 rounded text-sm font-medium">
                Summary
              </span>
            </div>
          </Link>
        </div>

        <div className="border border-gray-700 rounded-lg p-6 bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 text-gray-100">Document Information</h2>
          <div className="space-y-2 text-gray-300">
            <p><strong>Type:</strong> {document.content_type.toUpperCase()}</p>
            {document.filename && <p><strong>Filename:</strong> {document.filename}</p>}
            <p><strong>Created:</strong> {new Date(document.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

