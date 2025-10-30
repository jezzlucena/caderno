import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  CodeBracketIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  PhotoIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useJournalStore } from '../store/useStore';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCompletion, getStoredApiKey } from '../services/aiCompletion';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import SettingsModal from './SettingsModal';

export default function RichTextEditor() {
  const { getCurrentEntry, updateEntry, setCurrentEntry, setIsAISummarizing } = useJournalStore();
  const { t } = useTranslation();
  const currentEntry = getCurrentEntry();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string>('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const apiKey = getStoredApiKey();
  const summaryTimerRef = useRef<number | null>(null);
  const [showAISetupModal, setShowAISetupModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      ImageResize.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: currentEntry?.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px] p-8',
      },
      handleKeyDown: (_view, event) => {
        // Shift + Space to trigger autocomplete
        if (event.key === ' ' && (event.shiftKey || event.metaKey)) {
          event.preventDefault();
          // Show instructional modal if no API key
          if (!apiKey) {
            setShowAISetupModal(true);
          } else {
            handleGetSuggestion();
          }
          return true;
        }

        // Tab to accept suggestion
        if (event.key === 'Tab' && showSuggestion && suggestion) {
          event.preventDefault();
          acceptSuggestion();
          return true;
        }

        // Escape to dismiss suggestion
        if (event.key === 'Escape' && showSuggestion) {
          event.preventDefault();
          dismissSuggestion();
          return true;
        }

        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (currentEntry) {
        const content = editor.getHTML();
        updateEntry(currentEntry.id, content);

        // Clear existing timer
        if (summaryTimerRef.current) {
          clearTimeout(summaryTimerRef.current);
        }

        // Set new timer for debounced summary generation (10 seconds)
        summaryTimerRef.current = window.setTimeout(() => {
          handleGenerateSummary(content);
        }, 10000);
      }
      // Hide suggestion when user types
      if (showSuggestion) {
        setShowSuggestion(false);
      }
    },
  });

  useEffect(() => {
    if (editor && currentEntry && editor.getHTML() !== currentEntry.content) {
      editor.commands.setContent(currentEntry.content);
    }
  }, [currentEntry, editor]);

  // Check if AI setup modal should be shown
  useEffect(() => {
    const dismissed = localStorage.getItem('caderno-ai-setup-dismissed');
    if (!apiKey && !dismissed) {
      setShowAISetupModal(true);
    }
  }, [apiKey]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (summaryTimerRef.current) {
        clearTimeout(summaryTimerRef.current);
      }
    };
  }, []);

  const handleBack = () => {
    if (currentEntry && editor) {
      const content = editor.getHTML();

      // Clear pending timer if any
      if (summaryTimerRef.current) {
        clearTimeout(summaryTimerRef.current);
        summaryTimerRef.current = null;
      }

      // Update entry with current content first
      updateEntry(currentEntry.id, content, currentEntry.title);

      // Immediately generate summary when leaving the editor
      handleGenerateSummary(content);
    }

    setCurrentEntry(null);
  };

  const handleGenerateSummary = (content: string) => {
    if (!currentEntry) return;

    if (apiKey) {
      // Set summarizing state to true
      setIsAISummarizing(currentEntry.id, true);

      getCompletion(content, apiKey, {
        maxTokens: 1000,
        temperature: 0.7,
        mode: 'summarize',
      }).then(prediction => {
        const summary = prediction.split('</think>\n\n')[1];
        updateEntry(currentEntry.id, content, currentEntry.title, summary);
        // Set summarizing state to false when done
        setIsAISummarizing(currentEntry.id, false);
      }).catch(() => {
        // Silently fail - summary generation is optional
        setIsAISummarizing(currentEntry.id, false);
      });
    }
  };

  const getTextContext = (): string => {
    if (!editor) return '';

    // Get plain text from the editor
    const text = editor.getText();

    // Get last 200 characters for context
    return text.slice(-200);
  };

  const handleGetSuggestion = async () => {
    if (!apiKey) {
      setSuggestionError(t('autocomplete.noApiKey'));
      setShowSuggestion(true);
      return;
    }

    const context = getTextContext();

    if (!context.trim()) {
      return;
    }

    setIsLoadingSuggestion(true);
    setSuggestionError('');
    setShowSuggestion(true);

    try {
      const prediction = await getCompletion(context, apiKey, {
        maxTokens: 15,
        temperature: 0.7,
        mode: 'predict',
      });
      const completion = prediction.split('</think>\n')[1];

      setSuggestion(completion);
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : t('autocomplete.error'));
      setSuggestion('');
    } finally {
      setIsLoadingSuggestion(false);
    }
  };

  const acceptSuggestion = () => {
    const text = editor.getText();
    
    if (editor && suggestion) {
      editor.commands.insertContent((!/\s/gi.test(text.slice(-1)) ? ' ' : '') + suggestion);
      dismissSuggestion();
    }
  };

  const dismissSuggestion = () => {
    setShowSuggestion(false);
    setSuggestion('');
    setSuggestionError('');
  };

  const handleDismissAISetupModal = () => {
    if (dontShowAgain) {
      localStorage.setItem('caderno-ai-setup-dismissed', 'true');
    }
    setShowAISetupModal(false);
  };

  if (!currentEntry) {
    return null;
  }

  if (!editor) {
    return null;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const ToolbarButton = ({ onClick, active, children, title, label }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
    label?: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 transition-all duration-200 ${
        active
          ? 'bg-indigo-600 text-white shadow-md'
          : 'bg-white hover:bg-gray-100 text-gray-700 hover:shadow-sm'
      }`}
      title={title}
      type="button"
    >
      {children}
      {label && <span className="text-xs font-medium hidden sm:inline">{label}</span>}
    </button>
  );

  return (
    <>
      {/* AI Setup Instructional Modal */}
      {showAISetupModal && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={handleDismissAISetupModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">AI Autocomplete</h2>
              <button
                onClick={handleDismissAISetupModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon width={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                  <SparklesIcon className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Set Up AI Autocomplete
                </h3>
                <p className="text-gray-600">
                  Get AI-powered writing suggestions and automatic entry summaries
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg p-6 space-y-4">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">1</span>
                  Configure AI Autocomplete
                </h4>
                <p className="text-sm text-gray-700 ml-8">
                  Go to <strong>Settings → AI Autocomplete</strong> to enter your HuggingFace API key
                </p>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">2</span>
                  Get Your API Key
                </h4>
                <div className="text-sm text-gray-700 ml-8 space-y-2">
                  <p>To use AI features, you need a HuggingFace API key:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Visit <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-700 underline">huggingface.co/settings/tokens</a></li>
                    <li>Create a free account</li>
                    <li>Generate your API key</li>
                    <li>Add it in Settings</li>
                  </ul>
                </div>

                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full text-sm">3</span>
                  Start Using AI Features
                </h4>
                <p className="text-sm text-gray-700 ml-8">
                  Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Shift + Space</kbd> for writing suggestions
                </p>
              </div>

              {/* Don't Show Again Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="dontShowAgain"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="dontShowAgain" className="text-sm text-gray-700 cursor-pointer">
                  Don't show this again
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    handleDismissAISetupModal();
                    setShowSettingsModal(true);
                  }}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Cog6ToothIcon width={20} />
                  <span>Go to Settings to Configure</span>
                </button>
                
                <button
                  onClick={handleDismissAISetupModal}
                  className="w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {dontShowAgain ? "Don't Show Again" : "Maybe Later"}
                </button>
              </div>

              {/* Help Link */}
              <div className="text-center">
                <a
                  href="https://github.com/jezzlucena/caderno/blob/main/AI_AUTOCOMPLETE_GUIDE.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:text-indigo-700 underline"
                >
                  View Full Setup Guide →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-full w-full bg-gradient-to-br from-blue-50 to-indigo-100 overflow-auto">
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors"
          >
            <ArrowLeftIcon width={20} />
            <span className="font-medium">{t('editor.backToEntries')}</span>
          </button>
        </div>

        <div className="w-full max-w-5xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Entry Title */}
            <div className="px-8 pt-6 pb-2">
              <h2 className="text-2xl font-bold text-gray-800">{currentEntry.title}</h2>
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-2 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              title={t('editor.bold')}
            >
              <BoldIcon className="w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              title={t('editor.italic')}
            >
              <ItalicIcon className="w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive('code')}
              title={t('editor.code')}
            >
              <CodeBracketIcon className="w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px bg-gray-300" />

          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive('heading', { level: 1 })}
              title={t('editor.largeHeading')}
            >
              <span className="font-bold text-base">H1</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              title={t('editor.mediumHeading')}
            >
              <span className="font-bold text-sm">H2</span>
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              title={t('editor.smallHeading')}
            >
              <span className="font-bold text-xs">H3</span>
            </ToolbarButton>
          </div>

          <div className="w-px bg-gray-300" />

          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              title={t('editor.bulletList')}
            >
              <ListBulletIcon className="w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive('orderedList')}
              title={t('editor.numberedList')}
            >
              <NumberedListIcon className="w-4" />
            </ToolbarButton>
          </div>

          <div className="w-px bg-gray-300" />

          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              title={t('editor.insertImage')}
              active={editor.isActive('image')}
            >
              <PhotoIcon className="w-4" />
            </ToolbarButton>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          <div className="w-px bg-gray-300" />

          <div className="flex gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title={t('editor.undo')}
            >
              <ArrowUturnLeftIcon className="w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title={t('editor.redo')}
            >
              <ArrowUturnRightIcon className="w-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white rounded-b-xl relative">
          <EditorContent editor={editor} />

          {/* Autocomplete Suggestion Overlay */}
          {showSuggestion && (
            <div className="fixed bottom-4 right-4 max-w-md bg-white border-2 border-indigo-500 rounded-lg shadow-2xl p-4 z-50">
              <div className="flex items-start gap-3">
                <SparklesIcon className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {isLoadingSuggestion ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                      <p className="text-sm text-gray-600">{t('autocomplete.loading')}</p>
                    </div>
                  ) : suggestionError ? (
                    <div>
                      <p className="text-sm text-red-600 mb-2">{suggestionError}</p>
                      <button
                        onClick={dismissSuggestion}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        {t('autocomplete.pressEsc')}
                      </button>
                    </div>
                  ) : suggestion ? (
                    <div>
                      <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap break-words">
                        {suggestion}
                      </p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {t('autocomplete.pressTab')}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {t('autocomplete.pressEsc')}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Autocomplete Hint */}
        <div 
          className="px-8 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => {
            if (!apiKey) {
              setShowAISetupModal(true);
            } else {
              handleGetSuggestion();
            }
          }}
          title={!apiKey ? 'Click to set up AI Autocomplete' : 'Click to get AI suggestions'}
        >
          <p className="text-xs text-gray-500 text-center">
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">Shift + Space</kbd>
            {' '}{t('autocomplete.trigger')}
          </p>
        </div>
      </div>
        </div>
      </div>
      </div>

      {/* Settings Modal */}
      {showSettingsModal && (
        <SettingsModal 
          onClose={() => setShowSettingsModal(false)}
          initialScreen="ai"
        />
      )}
    </>
  );
}
