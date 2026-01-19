import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEntriesStore, useSettingsStore } from '../stores';
import { Editor } from '../components/entries';
import { Button, Input, Alert } from '../components/ui';

export function EntryEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { preferences } = useSettingsStore();
  const {
    currentEntry,
    isLoading,
    error,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    clearCurrentEntry,
    clearError,
  } = useEntriesStore();

  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [plainText, setPlainText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [includeInSafetyTimer, setIncludeInSafetyTimer] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetchEntry(id);
    }

    return () => {
      clearCurrentEntry();
      clearError();
    };
  }, [id, isNew, fetchEntry, clearCurrentEntry, clearError]);

  useEffect(() => {
    if (currentEntry && !isNew) {
      setTitle(currentEntry.title);
      setContent(currentEntry.content);
      setPlainText(currentEntry.plainText);
      setTags(currentEntry.tags);
      setIncludeInSafetyTimer(currentEntry.includeInSafetyTimer);
    }
  }, [currentEntry, isNew]);

  const handleEditorChange = useCallback(
    (newContent: Record<string, unknown>, newPlainText: string) => {
      setContent(newContent);
      setPlainText(newPlainText);
    },
    []
  );

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      if (isNew) {
        const entry = await createEntry({
          title: title.trim(),
          content,
          plainText,
          tags,
          includeInSafetyTimer,
        });
        navigate(`/entries/${entry.id}`, { replace: true });
      } else if (id) {
        await updateEntry(id, {
          title: title.trim(),
          content,
          plainText,
          tags,
          includeInSafetyTimer,
        });
      }
    } catch {
      // Error handled by store
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || isNew) return;

    try {
      await deleteEntry(id);
      navigate('/entries', { replace: true });
    } catch {
      // Error handled by store
    }
  };

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 transition-colors">
          {isNew ? t('entries.newEntry') : t('entries.editEntry')}
        </h1>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => navigate('/entries')}>
            {t('common.cancel')}
          </Button>
          {!isNew && (
            <Button
              variant="danger"
              onClick={() => setShowDeleteConfirm(true)}
            >
              {t('common.delete')}
            </Button>
          )}
          <Button onClick={handleSave} isLoading={isSaving} disabled={!title.trim()}>
            {t('common.save')}
          </Button>
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-4">
        <Input
          placeholder={t('entries.titlePlaceholder')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-xl font-semibold"
        />

        <Editor
          initialContent={isNew ? undefined : content}
          onChange={handleEditorChange}
          placeholder={t('entries.contentPlaceholder')}
          fontSize={preferences.editorFontSize}
        />

        <div className="space-y-2">
          <label className="label">{t('entries.tags')}</label>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 transition-colors"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-primary-900 dark:hover:text-primary-100 transition-colors"
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t('entries.addTag')}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={handleAddTag}>
              {t('common.add')}
            </Button>
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInSafetyTimer}
            onChange={(e) => setIncludeInSafetyTimer(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 transition-colors">
            {t('entries.includeInSafetyTimer')}
          </span>
        </label>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-slate-900 transition-colors">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 transition-colors">
              {t('entries.deleteConfirm')}
            </h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 transition-colors">
              {t('entries.deleteWarning')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
