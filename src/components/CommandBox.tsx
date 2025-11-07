import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";
import { useTranslation } from 'react-i18next';

export default function CommandBox({ command }: { command: string }) {
  const { t } = useTranslation();
  return (
    <div className="relative group ml-2 font-mono text-sm">
      <div className="px-3 bg-gray-900 text-gray-100 p-1.5 rounded font-mono overflow-x-auto pr-12">
        {command}
      </div>
      <button
        onClick={() => {
          navigator.clipboard.writeText(command);
          toast.success(t('commandBox.copied'));
        }}
        className="absolute right-1 top-1/2 -translate-y-1/2 px-1.5 py-0.5 hover:bg-gray-600 text-white rounded transition-colors opacity-50 hover:opacity-100"
        title={t('commandBox.copyButton')}
      >
        <ClipboardDocumentListIcon width={20} />
      </button>
    </div>
  );
}