'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { ChatMessage } from '@/types';

export default function TutorPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [addingToNotes, setAddingToNotes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const floatingButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, [documentId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (floatingButtonRef.current && !floatingButtonRef.current.contains(target)) {
        const selection = window.getSelection();
        if (!selection || selection.toString().trim().length === 0) {
          setSelectedText('');
          setSelectedMessageId(null);
          setSelectionPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/chat`);
      if (!response.ok) throw new Error('Failed to fetch chat history');
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Error fetching chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleTextSelection = (e: React.MouseEvent, messageId: string) => {
    if (e.target === e.currentTarget) return;
    
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    
    if (text && text.length > 10) {
      // Try to get the original markdown content from the message
      const message = messages.find(m => m.id === messageId);
      let contentToUse = text;
      
      // If this is an assistant message, try to find the selected portion in original markdown
      if (message && message.role === 'assistant') {
        // For now, use the selected text as-is
        // The API will handle formatting conversion
        contentToUse = text;
      }
      
      setSelectedText(contentToUse);
      setSelectedMessageId(messageId);
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setSelectionPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      }
    } else {
      setSelectedText('');
      setSelectedMessageId(null);
      setSelectionPosition(null);
    }
  };

  const handleAddToNotes = async () => {
    if (!selectedText || !documentId || addingToNotes) return;

    setAddingToNotes(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/user-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: selectedText }),
      });

      if (!response.ok) {
        throw new Error('Failed to add to notes');
      }

      // Clear selection
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setSelectedMessageId(null);
      setSelectionPosition(null);

      // Show success message with option to view notes
      if (confirm('Note added successfully! Would you like to view your notes?')) {
        window.location.href = `/documents/${documentId}/notes`;
      }
    } catch (err) {
      console.error('Error adding to notes:', err);
      alert('Failed to add note. Please try again.');
    } finally {
      setAddingToNotes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to UI immediately
    const tempUserMessage: ChatMessage = {
      id: 'temp-user',
      document_id: documentId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const response = await fetch(`/api/documents/${documentId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Replace temp message and add assistant response
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'temp-user'),
        data.userMessage,
        data.assistantMessage,
      ]);
    } catch (err) {
      console.error('Error sending message:', err);
      setMessages(prev => prev.filter(m => m.id !== 'temp-user'));
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingHistory) {
    return (
      <div className="min-h-screen p-8 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-100">Loading chat history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex flex-col bg-gray-900">
      <div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
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

        <h1 className="text-4xl font-bold mb-8 text-gray-100">AI Tutor</h1>

        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>Start asking questions about your document!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 relative ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 border border-gray-700 text-gray-100'
                  }`}
                  onMouseUp={(e) => {
                    if (message.role === 'assistant') {
                      handleTextSelection(e, message.id);
                    }
                  }}
                >
                  {message.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  ) : (
                    <div className="prose prose-sm max-w-none break-words select-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          h1: ({children, ...props}) => <h1 className="text-2xl font-bold mt-4 mb-2 text-gray-100" {...props}>{children}</h1>,
                          h2: ({children, ...props}) => <h2 className="text-xl font-bold mt-3 mb-2 text-gray-100" {...props}>{children}</h2>,
                          h3: ({children, ...props}) => <h3 className="text-lg font-bold mt-2 mb-1 text-gray-100" {...props}>{children}</h3>,
                          p: ({children, ...props}) => <p className="mb-3 leading-relaxed text-gray-200" {...props}>{children}</p>,
                          ul: ({children, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4" {...props}>{children}</ul>,
                          ol: ({children, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4" {...props}>{children}</ol>,
                          li: ({children, ...props}) => <li className="mb-1 text-gray-200" {...props}>{children}</li>,
                          code: ({inline, children, className, ...props}: any) => 
                            inline ? (
                              <code className="bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-100" {...props}>{children}</code>
                            ) : (
                              <code className="block bg-gray-700 p-3 rounded overflow-x-auto text-sm font-mono text-gray-100 mb-3" {...props}>{children}</code>
                            ),
                          pre: ({children, ...props}) => <pre className="bg-gray-700 p-3 rounded overflow-x-auto mb-3" {...props}>{children}</pre>,
                          blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-blue-500 pl-4 italic my-3 text-gray-300" {...props}>{children}</blockquote>,
                          strong: ({children, ...props}) => <strong className="font-bold text-gray-100" {...props}>{children}</strong>,
                          em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                          a: ({children, href, ...props}) => <a href={href} className="text-blue-400 hover:text-blue-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                          hr: ({...props}) => <hr className="my-4 border-gray-600" {...props} />,
                          table: ({children, ...props}) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse border border-gray-600" {...props}>{children}</table></div>,
                          th: ({children, ...props}) => <th className="border border-gray-600 px-4 py-2 bg-gray-700 font-bold text-left text-gray-100" {...props}>{children}</th>,
                          td: ({children, ...props}) => <td className="border border-gray-600 px-4 py-2 text-gray-200" {...props}>{children}</td>,
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <p className="text-gray-200">Thinking...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {selectedText && selectedMessageId && selectionPosition && (
          <div
            ref={floatingButtonRef}
            className="fixed z-50 pointer-events-auto"
            style={{
              left: `${selectionPosition.x}px`,
              top: `${Math.max(10, selectionPosition.y)}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <button
              onClick={handleAddToNotes}
              disabled={addingToNotes}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 shadow-lg text-sm font-medium flex items-center gap-2 pointer-events-auto"
            >
              {addingToNotes ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Adding...
                </>
              ) : (
                <>
                  <span>📝</span>
                  Add to Notes
                </>
              )}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your document..."
            className="flex-1 px-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-gray-100 placeholder-gray-400"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

