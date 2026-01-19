import PDFDocument from 'pdfkit';
import { IEntry } from '../models/Entry.js';

export function generateJournalPdf(
  entries: IEntry[],
  options: {
    title?: string;
    includeMetadata?: boolean;
  } = {}
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: options.title || 'Journal Entries',
        Author: 'Caderno',
        Creator: 'Caderno',
      },
    });

    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Title page
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text(options.title || 'Journal Entries', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.text(`${entries.length} entries`, { align: 'center' });

    doc.addPage();

    // Table of contents
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('Table of Contents');
    doc.moveDown();

    doc.fontSize(10).font('Helvetica');
    entries.forEach((entry, index) => {
      const date = entry.createdAt.toLocaleDateString();
      doc.text(`${index + 1}. ${entry.title} (${date})`);
    });

    doc.addPage();

    // Entries
    entries.forEach((entry, index) => {
      if (index > 0) {
        doc.addPage();
      }

      // Entry title
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(entry.title);
      doc.moveDown(0.5);

      // Metadata
      if (options.includeMetadata) {
        doc.fontSize(10).font('Helvetica').fillColor('#666666');
        doc.text(`Created: ${entry.createdAt.toLocaleString()}`);
        if (entry.tags.length > 0) {
          doc.text(`Tags: ${entry.tags.join(', ')}`);
        }
        doc.moveDown();
      }

      // Entry content (plain text)
      doc.fontSize(12).font('Helvetica').fillColor('#000000');

      // Split content into paragraphs and handle long text
      const paragraphs = entry.plainText.split('\n\n');
      paragraphs.forEach((paragraph, pIndex) => {
        if (paragraph.trim()) {
          doc.text(paragraph.trim(), {
            align: 'left',
            lineGap: 4,
          });
          if (pIndex < paragraphs.length - 1) {
            doc.moveDown();
          }
        }
      });

      // Add separator line
      doc.moveDown();
      doc.strokeColor('#cccccc').lineWidth(1);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    });

    // Footer with page numbers
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(10).font('Helvetica').fillColor('#999999');
      doc.text(
        `Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 }
      );
    }

    doc.end();
  });
}
