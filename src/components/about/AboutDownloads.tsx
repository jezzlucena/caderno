import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function AboutDownloads() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-gray-800">Download Mission & Vision Document</h3>
      <p className="text-gray-700 leading-relaxed">
        Download the complete Caderno Mission and Vision Document in your preferred format:
      </p>
      <div className="space-y-3">
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.md"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">Markdown (.md)</div>
            <div className="text-sm text-gray-600">Plain text format, great for developers and version control</div>
          </div>
        </a>
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.pdf"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">PDF (.pdf)</div>
            <div className="text-sm text-gray-600">Formatted document, easy to read and share</div>
          </div>
        </a>
        <a
          href="/src/assets/Caderno_Mission_and_Vision_Document.docx"
          download
          className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors group"
        >
          <ArrowDownTrayIcon className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
          <div className="flex-1">
            <div className="font-semibold text-gray-800 group-hover:text-indigo-600">Word (.docx)</div>
            <div className="text-sm text-gray-600">Editable document for Microsoft Word and compatible applications</div>
          </div>
        </a>
      </div>
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mt-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> These documents contain the full, detailed explanation of Caderno's mission, vision, ethos, and technical approach. The tabs above provide a summarized, practical overview.
        </p>
      </div>
    </div>
  );
}
