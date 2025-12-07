'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Document } from '@/types';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;
  
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDocument = useCallback(async () => {
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
  }, [documentId]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <p className="text-foreground">Document not found</p>
          <Link href="/documents" className="text-primary hover:text-primary/80 transition-colors">
            Back to Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link 
              href="/documents" 
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              ← Back to Documents
            </Link>
          </div>

        <h1 className="text-4xl font-bold mb-8 text-foreground">{document.title}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href={`/documents/${documentId}/tutor`}
            className="p-6 border border-border rounded-xl hover:border-primary/50 hover:bg-card transition-all bg-card group"
          >
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">Tutor</h2>
            <p className="text-muted-foreground mb-4">Ask questions about this document</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium">
                Chat with AI
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/flashcards`}
            className="p-6 border border-border rounded-xl hover:border-secondary/50 hover:bg-card transition-all bg-card group"
          >
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground group-hover:text-secondary transition-colors">Flashcards</h2>
            <p className="text-muted-foreground mb-4">Review flashcards from this document</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-secondary/10 text-secondary rounded-lg text-sm font-medium">
                Study Mode
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/mcqs`}
            className="p-6 border border-border rounded-xl hover:border-accent/50 hover:bg-card transition-all bg-card group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground group-hover:text-accent transition-colors">MCQs</h2>
            <p className="text-muted-foreground mb-4">Practice with multiple choice questions</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm font-medium">
                Practice Quiz
              </span>
            </div>
          </Link>

          <Link
            href={`/documents/${documentId}/notes`}
            className="p-6 border border-border rounded-xl hover:border-accent/50 hover:bg-card transition-all bg-card group"
          >
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-foreground group-hover:text-accent transition-colors">Notes</h2>
            <p className="text-muted-foreground mb-4">View concise summary notes</p>
            <div className="mt-4">
              <span className="inline-block px-3 py-1 bg-accent/10 text-accent rounded-lg text-sm font-medium">
                Summary
              </span>
            </div>
          </Link>
        </div>

        <div className="border border-border rounded-xl p-6 bg-card">
          <h2 className="text-xl font-semibold mb-4 text-foreground">Document Information</h2>
          <div className="space-y-2 text-muted-foreground">
            <p><strong className="text-foreground">Type:</strong> {document.content_type.toUpperCase()}</p>
            {document.filename && <p><strong className="text-foreground">Filename:</strong> {document.filename}</p>}
            <p><strong className="text-foreground">Created:</strong> {new Date(document.created_at).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

