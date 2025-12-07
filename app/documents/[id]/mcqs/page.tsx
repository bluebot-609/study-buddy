'use client';

import { useEffect, useState, useCallback } from 'react';
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

  const fetchMCQs = useCallback(async () => {
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
  }, [documentId]);

  useEffect(() => {
    fetchMCQs();
  }, [fetchMCQs]);

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
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading MCQs...</p>
        </div>
      </div>
    );
  }

  const currentMCQ = mcqs[currentIndex];
  const isCorrect = selectedAnswer === currentMCQ?.correct_answer;

  return (
    <div className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link 
            href={`/documents/${documentId}`} 
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            ← Back to Document
          </Link>
          <Link
            href="/documents"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          >
            All Documents
          </Link>
        </div>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-foreground">Multiple Choice Questions</h1>
          {mcqs.length === 0 && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {generating ? 'Generating...' : 'Generate MCQs'}
            </button>
          )}
        </div>

        {mcqs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No MCQs yet.</p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {generating ? 'Generating...' : 'Generate MCQs'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center text-muted-foreground mb-4">
              Question {currentIndex + 1} of {mcqs.length}
            </div>

            <div className="border border-border rounded-xl p-8 space-y-6 bg-card">
              <h2 className="text-2xl font-semibold text-foreground">{currentMCQ.question}</h2>

              <div className="space-y-3">
                {currentMCQ.options.map((option, index) => {
                  let className = 'w-full p-4 text-left border-2 rounded-lg transition-colors text-foreground ';
                  
                  if (showResult) {
                    if (index === currentMCQ.correct_answer) {
                      className += 'bg-secondary/20 border-secondary/50';
                    } else if (index === selectedAnswer && index !== currentMCQ.correct_answer) {
                      className += 'bg-destructive/20 border-destructive/50';
                    } else {
                      className += 'bg-muted/50 border-border';
                    }
                  } else {
                    className += selectedAnswer === index
                      ? 'bg-primary/20 border-primary/50'
                      : 'bg-muted/50 border-border hover:bg-muted';
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
                <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-secondary/10 border-secondary/30' : 'bg-destructive/10 border-destructive/30'}`}>
                  <p className="font-semibold mb-2 text-foreground">
                    {isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                  </p>
                  <p className="text-muted-foreground">{currentMCQ.explanation}</p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-medium border border-border"
                >
                  ← Previous
                </button>
                {!showResult ? (
                  <button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === mcqs.length - 1}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
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

