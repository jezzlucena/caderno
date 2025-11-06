import { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { XMarkIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { useJournalStore } from '../../store/useStore';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportPDFModalProps {
  onClose: () => void;
}

export default function ExportPDFModal({ onClose }: ExportPDFModalProps) {
  const { entries } = useJournalStore();
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIds(new Set(entries.map(e => e.id)));
  }, [entries]);

  const toggleEntry = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === entries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(entries.map(e => e.id)));
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleExportPDF = async () => {
    if (selectedIds.size === 0) return;

    setIsExporting(true);
    setProgress(0);

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const selectedEntries = entries
        .filter(e => selectedIds.has(e.id))
        .sort((a, b) => b.createdAt - a.createdAt);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - (margin * 2);

      for (let i = 0; i < selectedEntries.length; i++) {
        const entry = selectedEntries[i];
        setProgress(Math.round(((i + 1) / selectedEntries.length) * 100));

        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.width = '794px';
        tempContainer.style.padding = '40px';
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.fontFamily = 'Georgia, serif';
        
        const entryTitle = entry.title.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const formattedDate = formatDate(entry.createdAt);
        
        tempContainer.innerHTML = '<div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #4F46E5;"><h1 style="margin: 0 0 10px 0; color: #1F2937; font-size: 28px; font-weight: bold;">' + entryTitle + '</h1><p style="margin: 0; color: #6B7280; font-size: 14px;">' + formattedDate + '</p></div><div class="prose" style="color: #374151; font-size: 14px; line-height: 1.6;">' + entry.content + '</div>';

        document.body.appendChild(tempContainer);

        const contentDiv = tempContainer.querySelector('.prose') as HTMLElement;
        if (contentDiv) {
          contentDiv.querySelectorAll('h1').forEach(el => {
            (el as HTMLElement).style.fontSize = '24px';
            (el as HTMLElement).style.fontWeight = 'bold';
            (el as HTMLElement).style.marginTop = '20px';
            (el as HTMLElement).style.marginBottom = '10px';
          });
          contentDiv.querySelectorAll('h2').forEach(el => {
            (el as HTMLElement).style.fontSize = '20px';
            (el as HTMLElement).style.fontWeight = 'bold';
            (el as HTMLElement).style.marginTop = '16px';
            (el as HTMLElement).style.marginBottom = '8px';
          });
          contentDiv.querySelectorAll('h3').forEach(el => {
            (el as HTMLElement).style.fontSize = '16px';
            (el as HTMLElement).style.fontWeight = 'bold';
            (el as HTMLElement).style.marginTop = '12px';
            (el as HTMLElement).style.marginBottom = '6px';
          });
          
          contentDiv.querySelectorAll('ul, ol').forEach(el => {
            (el as HTMLElement).style.marginLeft = '20px';
            (el as HTMLElement).style.marginTop = '8px';
            (el as HTMLElement).style.marginBottom = '8px';
          });
          
          contentDiv.querySelectorAll('p').forEach(el => {
            (el as HTMLElement).style.marginTop = '8px';
            (el as HTMLElement).style.marginBottom = '8px';
          });
          
          contentDiv.querySelectorAll('code').forEach(el => {
            (el as HTMLElement).style.backgroundColor = '#F3F4F6';
            (el as HTMLElement).style.padding = '2px 6px';
            (el as HTMLElement).style.borderRadius = '4px';
            (el as HTMLElement).style.fontFamily = 'monospace';
            (el as HTMLElement).style.fontSize = '13px';
          });

          contentDiv.querySelectorAll('img').forEach(el => {
            (el as HTMLElement).style.maxWidth = '100%';
            (el as HTMLElement).style.height = 'auto';
            (el as HTMLElement).style.display = 'block';
            (el as HTMLElement).style.marginTop = '12px';
            (el as HTMLElement).style.marginBottom = '12px';
          });
        }

        const images = tempContainer.querySelectorAll('img');
        await Promise.all(
          Array.from(images).map(img => {
            if ((img as HTMLImageElement).complete) return Promise.resolve();
            return new Promise(resolve => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            });
          })
        );

        const canvas = await html2canvas(tempContainer, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });

        document.body.removeChild(tempContainer);

        if (i > 0) {
          pdf.addPage();
        }

        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight > pageHeight - (margin * 2)) {
          const pageCanvas = document.createElement('canvas');
          const ctx = pageCanvas.getContext('2d');
          if (!ctx) continue;

          pageCanvas.width = canvas.width;
          const maxPageHeight = ((pageHeight - (margin * 2)) * canvas.width) / contentWidth;
          
          let sourceY = 0;
          let pageNum = 0;

          while (sourceY < canvas.height) {
            if (pageNum > 0) {
              pdf.addPage();
            }

            pageCanvas.height = Math.min(maxPageHeight, canvas.height - sourceY);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, pageCanvas.height,
              0, 0,
              canvas.width, pageCanvas.height
            );

            const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;
            const imgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, pageImgHeight);

            sourceY += maxPageHeight;
            pageNum++;
          }
        } else {
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        }
      }

      const fileName = 'caderno-export-' + new Date().toISOString().split('T')[0] + '.pdf';
      pdf.save(fileName);

      setProgress(100);
      toast.success(`PDF exported successfully with ${selectedEntries.length} entries`);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('exportPDF.error'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 ${
        isClosing ? 'animate-fadeOut' : 'animate-fadeIn'
      }`}
      onClick={handleClose}
    >
      <div
        className={`bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] flex flex-col ${
          isClosing ? 'animate-slideDown' : 'animate-slideUp'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{t('exportPDF.title')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isExporting}
          >
            <XMarkIcon width={24} />
          </button>
        </div>

        <p className="text-gray-600 mb-4">
          {t('exportPDF.description')}
        </p>

        {!isExporting ? (
          <>
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === entries.length}
                  onChange={toggleAll}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <span className="font-medium text-indigo-900">
                  {t('exportPDF.selectAll')} ({selectedIds.size}/{entries.length})
                </span>
              </label>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-2 border border-gray-200 rounded-lg p-3">
              {entries.length === 0 ? (
                <p className="text-gray-500 text-center py-8">{t('journalList.noEntries')}</p>
              ) : (
                entries.map(entry => (
                  <label
                    key={entry.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(entry.id)}
                      onChange={() => toggleEntry(entry.id)}
                      className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{entry.title}</h3>
                      <p className="text-sm text-gray-500">{formatDate(entry.createdAt)}</p>
                    </div>
                  </label>
                ))
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('exportPDF.cancel')}
              </button>
              <button
                onClick={handleExportPDF}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon width={18} />
                <span>{t('exportPDF.export')}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <div className="w-full max-w-md">
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{t('exportPDF.exporting')}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: progress + '%' }}
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-500">
                {t('exportPDF.pleaseWait')}
              </p>
            </div>
          </div>
        )}
      </div>

      <div ref={previewRef} style={{ position: 'absolute', left: '-9999px' }} />
    </div>
  );
}
