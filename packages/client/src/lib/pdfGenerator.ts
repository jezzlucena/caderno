/**
 * PDF Generator for journal entries
 * Renders markdown as rich text (like preview mode) and generates styled PDF
 */

import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import { marked } from 'marked'

interface JournalEntry {
  title: string
  content: string
  createdAt: string
}

// Configure marked for safe HTML output
marked.setOptions({
  gfm: true,
  breaks: true
})

/**
 * CSS styles for rendered markdown content
 * Matches typical markdown preview styling
 */
const getMarkdownStyles = (): string => `
  .pdf-container {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    color: #1a1a1a;
    background: white;
    padding: 40px;
    max-width: 800px;
    margin: 0 auto;
  }

  .pdf-title-page {
    text-align: center;
    padding: 100px 40px;
    page-break-after: always;
  }

  .pdf-title-page h1 {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 20px;
    color: #1a1a1a;
  }

  .pdf-title-page .subtitle {
    font-size: 16px;
    color: #666;
  }

  .pdf-entry {
    page-break-after: always;
    margin-bottom: 40px;
  }

  .pdf-entry:last-child {
    page-break-after: auto;
  }

  .pdf-entry-header {
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 12px;
    margin-bottom: 20px;
  }

  .pdf-entry-title {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px 0;
    color: #1a1a1a;
  }

  .pdf-entry-date {
    font-size: 13px;
    color: #666;
    font-style: italic;
  }

  .pdf-entry-content {
    font-size: 14px;
    line-height: 1.8;
  }

  /* Markdown rendered elements */
  .pdf-entry-content h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 24px 0 12px 0;
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 8px;
  }

  .pdf-entry-content h2 {
    font-size: 20px;
    font-weight: 700;
    margin: 20px 0 10px 0;
    border-bottom: 1px solid #eee;
    padding-bottom: 6px;
  }

  .pdf-entry-content h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 18px 0 10px 0;
  }

  .pdf-entry-content h4, .pdf-entry-content h5, .pdf-entry-content h6 {
    font-size: 16px;
    font-weight: 600;
    margin: 16px 0 8px 0;
  }

  .pdf-entry-content p {
    margin: 0 0 16px 0;
  }

  .pdf-entry-content strong {
    font-weight: 700;
  }

  .pdf-entry-content em {
    font-style: italic;
  }

  .pdf-entry-content code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
    font-size: 13px;
  }

  .pdf-entry-content pre {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;
  }

  .pdf-entry-content pre code {
    background: none;
    padding: 0;
    font-size: 13px;
    line-height: 1.5;
  }

  .pdf-entry-content blockquote {
    border-left: 4px solid #ddd;
    margin: 16px 0;
    padding: 8px 16px;
    color: #555;
    background: #fafafa;
  }

  .pdf-entry-content ul, .pdf-entry-content ol {
    margin: 16px 0;
    padding-left: 24px;
  }

  .pdf-entry-content li {
    margin: 6px 0;
  }

  .pdf-entry-content hr {
    border: none;
    border-top: 2px solid #e0e0e0;
    margin: 24px 0;
  }

  .pdf-entry-content a {
    color: #0066cc;
    text-decoration: underline;
  }

  .pdf-entry-content img {
    max-width: 100%;
    height: auto;
    border-radius: 4px;
    margin: 16px 0;
  }

  .pdf-entry-content table {
    border-collapse: collapse;
    width: 100%;
    margin: 16px 0;
  }

  .pdf-entry-content th, .pdf-entry-content td {
    border: 1px solid #ddd;
    padding: 8px 12px;
    text-align: left;
  }

  .pdf-entry-content th {
    background: #f4f4f4;
    font-weight: 600;
  }

  .pdf-entry-content tr:nth-child(even) {
    background: #fafafa;
  }
`

/**
 * Generate HTML document from journal entries with markdown rendered
 */
function generateHtmlDocument(entries: JournalEntry[]): string {
  const entriesHtml = entries.map(entry => {
    const renderedContent = marked(entry.content) as string
    const formattedDate = new Date(entry.createdAt).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
      <div class="pdf-entry">
        <div class="pdf-entry-header">
          <h2 class="pdf-entry-title">${escapeHtml(entry.title)}</h2>
          <div class="pdf-entry-date">${formattedDate}</div>
        </div>
        <div class="pdf-entry-content">
          ${renderedContent}
        </div>
      </div>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>${getMarkdownStyles()}</style>
    </head>
    <body>
      <div class="pdf-container">
        <div class="pdf-title-page">
          <h1>Journal Entries</h1>
          <p class="subtitle">Generated on ${new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</p>
          <p class="subtitle">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        ${entriesHtml}
      </div>
    </body>
    </html>
  `
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Generate a PDF from journal entries with proper markdown rendering
 * Returns the PDF as a Blob
 */
export async function generateJournalPDF(entries: JournalEntry[]): Promise<Blob> {
  // Create a hidden container for rendering
  // Use an iframe to isolate from page styles (prevents html2canvas color parsing errors)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'absolute'
  iframe.style.left = '-9999px'
  iframe.style.top = '0'
  iframe.style.width = '800px'
  iframe.style.height = '10000px'
  iframe.style.border = 'none'
  document.body.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    document.body.removeChild(iframe)
    throw new Error('Failed to create isolated rendering context')
  }

  const container = iframeDoc.body

  try {
    // Inject the HTML content
    const htmlContent = generateHtmlDocument(entries)
    container.innerHTML = htmlContent
    container.style.margin = '0'
    container.style.padding = '0'
    container.style.background = 'white'

    // Wait for fonts and images to load
    await new Promise(resolve => setTimeout(resolve, 100))

    // Get the content element
    const contentElement = container.querySelector('.pdf-container') as HTMLElement
    if (!contentElement) {
      throw new Error('Failed to render PDF content')
    }

    // Capture as canvas using iframe's window context
    const canvas = await html2canvas(contentElement, {
      scale: 2, // Higher resolution
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 800,
      windowHeight: contentElement.scrollHeight
    })

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10

    // Calculate image dimensions to fit the page
    const imgWidth = pageWidth - (margin * 2)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // Split into pages if content is too long
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    let heightLeft = imgHeight
    let position = margin

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
    heightLeft -= (pageHeight - margin * 2)

    // Additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pageHeight - margin * 2)
    }

    return pdf.output('blob')
  } finally {
    // Clean up
    document.body.removeChild(iframe)
  }
}

/**
 * Convert PDF blob to base64 string for storage/transmission
 */
export async function pdfBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 string back to PDF blob
 */
export function base64ToPdfBlob(base64: string): Blob {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: 'application/pdf' })
}

/**
 * Trigger download of a PDF blob
 */
export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
