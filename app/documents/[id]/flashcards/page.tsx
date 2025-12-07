'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Flashcard } from '@/types';

export default function FlashcardsPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchFlashcards();
  }, [documentId]);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/flashcards`);
      if (!response.ok) throw new Error('Failed to fetch flashcards');
      const data = await response.json();
      setFlashcards(data.flashcards || []);
    } catch (err) {
      console.error('Error fetching flashcards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Generate comprehensive topic-wise flashcards from this document? This will analyze all topics and create flashcards for each important concept.')) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/flashcards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate flashcards');
      }

      await fetchFlashcards();
    } catch (err) {
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-100">Loading flashcards...</p>
        </div>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex];

  return (
    <div className="min-h-screen p-8 bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href={`/documents/${documentId}`} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            ← Back to Document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            All Documents
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-100">Flashcards</h1>
          {flashcards.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {generating ? 'Generating...' : 'Generate Topic-Wise Flashcards'}
            </button>
          )}
        </div>

        {flashcards.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 mb-4">No flashcards yet.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {generating ? 'Generating comprehensive flashcards...' : 'Generate Topic-Wise Flashcards'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-gray-300 mb-4">
              Card {currentIndex + 1} of {flashcards.length}
            </div>

            <div
              className="relative h-64 cursor-pointer"
              onClick={() => setIsFlipped(!isFlipped)}
              style={{ perspective: '1000px' }}
            >
              <div
                className={`absolute inset-0 w-full h-full transition-transform duration-300`}
                style={{
                  transformStyle: 'preserve-3d',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
              >
                <div
                  className="absolute inset-0 w-full h-full border-2 rounded-lg p-8 flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div className="bg-blue-900/30 border-blue-600 border-2 w-full h-full rounded-lg flex items-center justify-center">
                    <p className="text-xl font-semibold text-center text-gray-100">{currentCard.front}</p>
                  </div>
                </div>
                <div
                  className="absolute inset-0 w-full h-full border-2 rounded-lg p-8 flex items-center justify-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div className="bg-green-900/30 border-green-600 border-2 w-full h-full rounded-lg flex items-center justify-center">
                    <p className="text-xl text-center text-gray-100">{currentCard.back}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                ← Previous
              </button>
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {isFlipped ? 'Show Question' : 'Show Answer'}
              </button>
              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

