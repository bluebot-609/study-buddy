'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  FileText, 
  MessageSquare, 
  FileQuestion, 
  StickyNote,
  Plus,
  TrendingUp,
  Clock,
  CheckCircle2
} from 'lucide-react';
import type { Document } from '@/types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    recentDocuments: 0,
    totalFlashcards: 0,
    totalMCQs: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data.documents || []);
      setStats({
        totalDocuments: data.documents?.length || 0,
        recentDocuments: data.documents?.filter((doc: Document) => {
          const docDate = new Date(doc.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return docDate >= weekAgo;
        }).length || 0,
        totalFlashcards: 0, // Would need separate API call
        totalMCQs: 0, // Would need separate API call
      });
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {user.email?.split('@')[0]}</p>
          </div>
          <Link href="/documents/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Documents</p>
                <p className="text-3xl font-bold mt-2">{stats.totalDocuments}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold mt-2">{stats.recentDocuments}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Flashcards</p>
                <p className="text-3xl font-bold mt-2">{stats.totalFlashcards}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Practice MCQs</p>
                <p className="text-3xl font-bold mt-2">{stats.totalMCQs}</p>
              </div>
              <FileQuestion className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/documents/new">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">New Document</h3>
                  <p className="text-sm text-muted-foreground">Upload or create</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/documents">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 hover:bg-accent transition-colors cursor-pointer">
              <div className="flex items-center space-x-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">All Documents</h3>
                  <p className="text-sm text-muted-foreground">View all files</p>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Documents */}
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold">Recent Documents</h2>
          </div>
          <div className="p-6">
            {recentDocuments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No documents yet</p>
                <Link href="/documents/new">
                  <Button>Create Your First Document</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className="block rounded-lg border p-4 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{doc.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {doc.content_type.toUpperCase()} • {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/documents/${doc.id}/tutor`}
                          className="p-2 hover:bg-accent rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link
                          href={`/documents/${doc.id}/flashcards`}
                          className="p-2 hover:bg-accent rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link
                          href={`/documents/${doc.id}/notes`}
                          className="p-2 hover:bg-accent rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <StickyNote className="h-4 w-4 text-muted-foreground" />
                        </Link>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

