import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface PDFGenerationOptions {
  entries: JournalEntry[];
  fileName?: string;
}

export class PDFGenerator {
  private templatePath: string;

  constructor() {
    this.templatePath = path.join(__dirname, '../../templates/pdf-template.html');
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private generateHTML(entries: JournalEntry[]): string {
    const template = fs.readFileSync(this.templatePath, 'utf-8');

    const entriesHTML = entries
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(
        (entry) => `
      <div class="entry">
        <div class="entry-header">
          <h1 class="entry-title">${this.escapeHtml(entry.title)}</h1>
          <p class="entry-date">${this.formatDate(entry.createdAt)}</p>
        </div>
        <div class="entry-content">
          ${entry.content}
        </div>
      </div>
    `
      )
      .join('\n');

    return template.replace('{{ENTRIES}}', entriesHTML);
  }

  async generatePDF(options: PDFGenerationOptions): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = this.generateHTML(options.entries);

      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // Wait for any images to load
      await page.evaluate(() => {
        // @ts-expect-error - document is available in browser context via Puppeteer
        const images = Array.from(document.images);
        return Promise.all(
          images.map((img: any) => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.addEventListener('load', resolve);
              img.addEventListener('error', resolve);
            });
          })
        );
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: true,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }

  async generatePDFFile(options: PDFGenerationOptions, outputPath: string): Promise<void> {
    const pdfBuffer = await this.generatePDF(options);
    fs.writeFileSync(outputPath, pdfBuffer);
  }
}
