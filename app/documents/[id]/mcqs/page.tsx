'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { MCQ } from '@/types';

export default function MCQsPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [mcqs, setMCQs] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchMCQs();
  }, [documentId]);

  const fetchMCQs = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/mcqs`);
      if (!response.ok) throw new Error('Failed to fetch MCQs');
      const data = await response.json();
      setMCQs(data.mcqs || []);
    } catch (err) {
      console.error('Error fetching MCQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!confirm('Generate 15 MCQs from this document?')) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/mcqs/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId, count: 15 }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate MCQs');
      }

      await fetchMCQs();
    } catch (err) {
      alert('Failed to generate MCQs. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
  };

  const handleNext = () => {
    if (currentIndex < mcqs.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-100">Loading MCQs...</p>
        </div>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const isCorrect = selectedAnswer === currentMCQ?.correct_answer;

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
          <h1 className="text-4xl font-bold text-gray-100">Multiple Choice Questions</h1>
          {mcqs.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {generating ? 'Generating...' : 'Generate MCQs'}
            </button>
          )}
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-300 mb-4">No MCQs yet.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {generating ? 'Generating...' : 'Generate MCQs'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-gray-300 mb-4">
              Question {currentIndex + 1} of {mcqs.length}
            </div>

            <div className="border-2 border-gray-700 rounded-lg p-8 space-y-6 bg-gray-800">
              <h2 className="text-2xl font-semibold text-gray-100">{currentMCQ.question}</h2>

              <div className="space-y-3">
                {currentMCQ.options.map((option, index) => {
                  let className = 'w-full p-4 text-left border-2 rounded-lg transition-colors text-gray-100 ';
                  
                  if (showResult) {
                    if (index === currentMCQ.correct_answer) {
                      className += 'bg-green-900/30 border-green-500';
                    } else if (index === selectedAnswer && index !== currentMCQ.correct_answer) {
                      className += 'bg-red-900/30 border-red-500';
                    } else {
                      className += 'bg-gray-700 border-gray-600';
                    }
                  } else {
                    className += selectedAnswer === index
                      ? 'bg-blue-900/30 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:bg-gray-700';
                  }

                  return (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showResult}
                      className={className}
                    >
                      <span className="font-semibold mr-2">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  );
                })}
              </div>

              {showResult && (
                <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'}`}>
                  <p className="font-semibold mb-2 text-gray-100">
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-gray-200">{currentMCQ.explanation}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  ← Previous
                </button>
                {!showResult ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === mcqs.length - 1}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
                  >
                    Next Question →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

