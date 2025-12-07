'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Note, UserNote } from '@/types';

export default function NotesPage() {
  const params = useParams();
  const documentId = params.id as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/notes`);
      if (response.status === 404) {
        // Notes don't exist yet
        setNote(null);
      } else if (!response.ok) {
        throw new Error('Failed to fetch notes');
      } else {
        const data = await response.json();
        setNote(data.note);
      }
    } catch (err) {
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  const fetchUserNotes = useCallback(async () => {
    try {
      const response = await fetch(`/api/documents/${documentId}/user-notes`);
      if (!response.ok) {
        throw new Error('Failed to fetch user notes');
      } else {
        const data = await response.json();
        setUserNotes(data.userNotes || []);
      }
    } catch (err) {
      console.error('Error fetching user notes:', err);
    }
  }, [documentId]);

  useEffect(() => {
    fetchNotes();
    fetchUserNotes();
  }, [fetchNotes, fetchUserNotes]);

  const handleGenerate = async () => {
    if (!confirm('Generate concise summary notes from this document?')) return;

    setGenerating(true);
    try {
      const response = await fetch('/api/notes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate notes');
      }

      const data = await response.json();
      setNote(data.note);
    } catch (err) {
      alert('Failed to generate notes. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleEditNote = (userNote: UserNote) => {
    setEditingNoteId(userNote.id);
    setEditTitle(userNote.title);
    setEditContent(userNote.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/user-notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: noteId, title: editTitle.trim(), content: editContent.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      await fetchUserNotes();
      setEditingNoteId(null);
      setEditTitle('');
      setEditContent('');
    } catch (err) {
      alert('Failed to update note. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/documents/${documentId}/user-notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      await fetchUserNotes();
    } catch (err) {
      alert('Failed to delete note. Please try again.');
    }
  };

  const convertMarkdownToHTML = (markdown: string): string => {
    let html = markdown;

    // Convert markdown tables first (before other conversions)
    const tableRegex = /^\|(.+)\|\r?\n\|([-:|\s]+)\|\r?\n((?:\|.+\|\r?\n?)+)/gm;
    html = html.replace(tableRegex, (match, header, separator, rows) => {
      const headers = header.split('|').map((h: string) => h.trim()).filter((h: string) => h);
      const rowLines = rows.trim().split('\n').filter((r: string) => r.trim());
      const rowData = rowLines.map((row: string) => 
        row.split('|').map((c: string) => c.trim()).filter((c: string) => c)
      );

      let tableHtml = '<table><thead><tr>';
      headers.forEach((h: string) => {
        tableHtml += `<th>${h.replace(/\*\*/g, '').replace(/\*/g, '')}</th>`;
      });
      tableHtml += '</tr></thead><tbody>';
      rowData.forEach((row: string[]) => {
        if (row.length > 0) {
          tableHtml += '<tr>';
          row.forEach((cell: string) => {
            const cellHtml = cell
              .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
              .replace(/\*(.*?)\*/g, '<em>$1</em>')
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/<br\s*\/?>/gi, '<br>');
            tableHtml += `<td>${cellHtml}</td>`;
          });
          tableHtml += '</tr>';
        }
      });
      tableHtml += '</tbody></table>';
      return tableHtml;
    });

    // Convert headers (with proper line breaks)
    html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // Convert code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Convert inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Convert blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');

    // Convert horizontal rules
    html = html.replace(/^---$/gim, '<hr>');

    // Convert lists
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    // Convert line breaks and paragraphs
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    
    // Wrap in paragraph tags if not already wrapped
    if (!html.startsWith('<') || (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<ul') && !html.startsWith('<ol') && !html.startsWith('<table'))) {
      html = `<p>${html}</p>`;
    }

    return html;
  };

  const handleExportPDF = () => {
    // Create a print-friendly window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }

    // Build HTML content for PDF
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Study Notes - ${date}</title>
          <style>
            @media print {
              @page {
                margin: 1.5cm;
                size: A4;
              }
              body {
                margin: 0;
                padding: 20px;
              }
              .note-card {
                page-break-inside: avoid;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.7;
              color: #1a1a1a;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            h1 {
              font-size: 32px;
              margin-bottom: 20px;
              margin-top: 0;
              color: #1a1a1a;
              border-bottom: 4px solid #3b82f6;
              padding-bottom: 15px;
            }
            h2 {
              font-size: 24px;
              margin-top: 40px;
              margin-bottom: 20px;
              color: #2563eb;
            }
            h3 {
              font-size: 20px;
              margin-top: 25px;
              margin-bottom: 15px;
              color: #1e40af;
            }
            h4 {
              font-size: 18px;
              margin-top: 20px;
              margin-bottom: 12px;
              color: #1e40af;
            }
            .note-card {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-left: 4px solid #3b82f6;
              border-radius: 8px;
              padding: 25px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .note-title {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #1a1a1a;
            }
            .note-content {
              color: #374151;
              margin-bottom: 15px;
            }
            .note-content p {
              margin-bottom: 12px;
            }
            .note-date {
              font-size: 11px;
              color: #6b7280;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px solid #e5e7eb;
            }
            p {
              margin-bottom: 12px;
            }
            ul, ol {
              margin-left: 25px;
              margin-bottom: 15px;
              padding-left: 0;
            }
            li {
              margin-bottom: 8px;
            }
            code {
              background: #f3f4f6;
              padding: 3px 8px;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 0.9em;
              color: #1f2937;
            }
            pre {
              background: #f3f4f6;
              padding: 15px;
              border-radius: 6px;
              overflow-x: auto;
              margin-bottom: 15px;
              border: 1px solid #e5e7eb;
            }
            pre code {
              background: transparent;
              padding: 0;
            }
            blockquote {
              border-left: 4px solid #3b82f6;
              padding-left: 20px;
              margin: 15px 0;
              color: #4b5563;
              font-style: italic;
              background: #f9fafb;
              padding: 15px 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 14px;
            }
            th, td {
              border: 1px solid #d1d5db;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background: #f3f4f6;
              font-weight: bold;
              color: #1a1a1a;
            }
            tr:nth-child(even) {
              background: #f9fafb;
            }
            .metadata {
              text-align: right;
              color: #6b7280;
              font-size: 12px;
              margin-bottom: 30px;
            }
            .section-divider {
              margin: 40px 0;
              border-top: 2px solid #e5e7eb;
            }
          </style>
        </head>
        <body>
          <div class="metadata">
            <div>Exported: ${date}</div>
          </div>
          <h1>Study Notes</h1>
          <div class="section-divider"></div>
    `;

    // Add user notes
    if (userNotes.length > 0) {
      htmlContent += '<h2>Your Notes</h2>';
      userNotes.forEach((userNote) => {
        const contentHtml = convertMarkdownToHTML(userNote.content);
        htmlContent += `
          <div class="note-card">
            <div class="note-title">${userNote.title}</div>
            <div class="note-content">${contentHtml}</div>
            <div class="note-date">Created: ${new Date(userNote.created_at).toLocaleString()}</div>
          </div>
        `;
      });
    } else {
      htmlContent += '<p style="color: #6b7280; font-style: italic;">No notes to export.</p>';
    }

    htmlContent += `
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print dialog
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 300);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-4xl font-bold text-foreground">Notes</h1>
          <div className="flex gap-3">
            {userNotes.length > 0 && (
              <button
                onClick={handleExportPDF}
                className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
              >
                📄 Export All Notes as PDF
              </button>
            )}
            {!note && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
              >
                {generating ? 'Generating...' : 'Generate Summary Notes'}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-12">
          {/* AI-Generated Summary Notes Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">AI-Generated Summary Notes</h2>
            {!note ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground mb-4">No summary notes generated yet.</p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
                >
                  {generating ? 'Generating concise notes...' : 'Generate Summary Notes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props}>{children}</h1>,
                        h2: ({children, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2 text-foreground" {...props}>{children}</h2>,
                        h3: ({children, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props}>{children}</h3>,
                        p: ({children, ...props}) => <p className="mb-3 leading-relaxed text-foreground" {...props}>{children}</p>,
                        ul: ({children, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4 text-foreground" {...props}>{children}</ul>,
                        ol: ({children, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4 text-foreground" {...props}>{children}</ol>,
                        li: ({children, ...props}) => <li className="mb-1 text-foreground" {...props}>{children}</li>,
                        code: ({inline, children, className, ...props}: any) => 
                          inline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>{children}</code>
                          ) : (
                            <code className="block bg-muted p-3 rounded overflow-x-auto text-sm font-mono text-foreground mb-3" {...props}>{children}</code>
                          ),
                        pre: ({children, ...props}) => <pre className="bg-muted p-3 rounded overflow-x-auto mb-3" {...props}>{children}</pre>,
                        blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground" {...props}>{children}</blockquote>,
                        strong: ({children, ...props}) => <strong className="font-bold text-foreground" {...props}>{children}</strong>,
                        em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                        a: ({children, href, ...props}) => <a href={href} className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                        hr: ({...props}) => <hr className="my-4 border-border" {...props} />,
                      }}
                    >
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="flex justify-end items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(note.updated_at).toLocaleString()}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 disabled:opacity-50 transition-colors font-medium border border-border"
                  >
                    {generating ? 'Regenerating...' : 'Regenerate Notes'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Notes Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Your Notes</h2>
            {userNotes.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-xl">
                <p className="text-muted-foreground">No user notes yet. Select text in chat to add notes!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userNotes.map((userNote) => (
                  <div key={userNote.id} className="bg-card border border-border rounded-xl p-6">
                    {editingNoteId === userNote.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all"
                          placeholder="Note title"
                        />
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={6}
                          className="w-full px-3 py-2 bg-background border border-input rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all resize-none"
                          placeholder="Note content"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(userNote.id)}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-foreground">{userNote.title}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditNote(userNote)}
                              className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteNote(userNote.id)}
                              className="px-4 py-2 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3 text-foreground" {...props}>{children}</h1>,
                              h2: ({children, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2 text-foreground" {...props}>{children}</h2>,
                              h3: ({children, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props}>{children}</h3>,
                              p: ({children, ...props}) => <p className="mb-3 leading-relaxed text-foreground" {...props}>{children}</p>,
                              ul: ({children, ...props}) => <ul className="list-disc list-inside mb-3 space-y-1 ml-4 text-foreground" {...props}>{children}</ul>,
                              ol: ({children, ...props}) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-4 text-foreground" {...props}>{children}</ol>,
                              li: ({children, ...props}) => <li className="mb-1 text-foreground" {...props}>{children}</li>,
                              code: ({inline, children, className, ...props}: any) => 
                                inline ? (
                                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground" {...props}>{children}</code>
                                ) : (
                                  <code className="block bg-muted p-3 rounded overflow-x-auto text-sm font-mono text-foreground mb-3" {...props}>{children}</code>
                                ),
                              pre: ({children, ...props}) => <pre className="bg-muted p-3 rounded overflow-x-auto mb-3" {...props}>{children}</pre>,
                              blockquote: ({children, ...props}) => <blockquote className="border-l-4 border-primary pl-4 italic my-3 text-muted-foreground" {...props}>{children}</blockquote>,
                              strong: ({children, ...props}) => <strong className="font-bold text-foreground" {...props}>{children}</strong>,
                              em: ({children, ...props}) => <em className="italic" {...props}>{children}</em>,
                              a: ({children, href, ...props}) => <a href={href} className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                              hr: ({...props}) => <hr className="my-4 border-border" {...props} />,
                              table: ({children, ...props}) => <div className="overflow-x-auto mb-3"><table className="min-w-full border-collapse border border-border" {...props}>{children}</table></div>,
                              th: ({children, ...props}) => <th className="border border-border px-4 py-2 bg-muted font-bold text-left text-foreground" {...props}>{children}</th>,
                              td: ({children, ...props}) => <td className="border border-border px-4 py-2 text-foreground" {...props}>{children}</td>,
                            }}
                          >
                            {userNote.content}
                          </ReactMarkdown>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {new Date(userNote.created_at).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

