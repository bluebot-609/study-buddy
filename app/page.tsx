'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './providers/auth-provider';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/documents');
      } else {
        router.push('/auth/login');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900 flex items-center justify-center">
        <p className="text-gray-100">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-100">Study Buddy</h1>
        <p className="text-xl mb-8 text-gray-300">
          Your personal AI study companion
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/documents"
            className="p-6 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors bg-gray-800"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Documents</h2>
            <p className="text-gray-300">View and manage your study documents</p>
          </Link>
          
          <div className="p-6 border border-gray-700 rounded-lg bg-gray-800">
            <h2 className="text-2xl font-semibold mb-2 text-gray-100">Quick Actions</h2>
            <ul className="space-y-2 text-gray-300">
              <li>• Upload PDF documents</li>
              <li>• Paste text notes</li>
              <li>• Generate flashcards</li>
              <li>• Create practice MCQs</li>
            </ul>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/documents"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started →
          </Link>
        </div>
      </div>
    </div>
  );
}

