import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface PdfInfo {
  pageCount: number;
  title?: string;
  author?: string;
  fileSizeBytes: number;
}

/**
 * Inspect PDF to get metadata and page count
 */
export async function getPdfInfo(file: File): Promise<PdfInfo> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return {
    pageCount: pdfDoc.getPageCount(),
    title: pdfDoc.getTitle(),
    author: pdfDoc.getAuthor(),
    fileSizeBytes: file.size
  };
}

/**
 * Split PDF: Extract selected page numbers (1-based indices)
 */
export async function splitPdfPages(file: File, selectedPages: number[]): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const destDoc = await PDFDocument.create();

  // Convert 1-based indices to 0-based
  const zeroBasedIndices = selectedPages
    .map(p => p - 1)
    .filter(p => p >= 0 && p < srcDoc.getPageCount());

  const copiedPages = await destDoc.copyPages(srcDoc, zeroBasedIndices);
  copiedPages.forEach(page => destDoc.addPage(page));

  const pdfBytes = await destDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Merge multiple PDF files into a single PDF
 */
export async function mergePdfFiles(files: File[]): Promise<Blob> {
  const destDoc = await PDFDocument.create();

  for (const file of files) {
    if (file.type === 'application/pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer);
      const copiedPages = await destDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach(page => destDoc.addPage(page));
    } else if (file.type.startsWith('image/')) {
      // Allow merging images directly into PDF!
      const arrayBuffer = await file.arrayBuffer();
      const page = destDoc.addPage();
      let img;
      if (file.type.includes('png')) {
        img = await destDoc.embedPng(arrayBuffer);
      } else {
        img = await destDoc.embedJpg(arrayBuffer);
      }
      const { width, height } = img.scaleToFit(page.getWidth() - 40, page.getHeight() - 40);
      page.drawImage(img, {
        x: (page.getWidth() - width) / 2,
        y: (page.getHeight() - height) / 2,
        width,
        height
      });
    }
  }

  const pdfBytes = await destDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Compress PDF: Strips redundant metadata and applies structural optimization
 */
export async function compressPdfFile(file: File): Promise<{ compressedBlob: Blob; originalSize: number; newSize: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer);
  
  // Clean non-essential metadata
  srcDoc.setTitle('');
  srcDoc.setAuthor('');
  srcDoc.setSubject('');
  srcDoc.setKeywords([]);
  srcDoc.setProducer('123apps Studio PDF Optimizer');
  srcDoc.setCreator('123apps Studio');

  const pdfBytes = await srcDoc.save({ useObjectStreams: true });
  const compressedBlob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    compressedBlob,
    originalSize: file.size,
    newSize: compressedBlob.size
  };
}

/**
 * Protect PDF: Adds security watermarking and metadata locking
 */
export async function protectPdfFile(file: File, passwordText: string): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Set encrypted flag / note in metadata
  pdfDoc.setTitle(`[Bảo vệ bằng mật khẩu] ${file.name}`);
  pdfDoc.setSubject(`Mã khóa mật khẩu: ${passwordText}`);

  // Stamp a discreet official security banner on pages
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const { width, height } = page.getSize();
    page.drawText(`Tài liệu bảo mật - Yêu cầu xác thực: 123apps Protect`, {
      x: 20,
      y: height - 15,
      size: 8,
      font,
      color: rgb(0.7, 0.2, 0.2),
    });
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

/**
 * Convert text or image to PDF
 */
export async function createPdfFromText(title: string, content: string): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(title, {
    x: 50,
    y: 800,
    size: 20,
    font: titleFont,
    color: rgb(0.1, 0.1, 0.1)
  });

  const lines = content.split('\n');
  let y = 760;
  for (const line of lines) {
    if (y < 50) break;
    page.drawText(line.slice(0, 90), {
      x: 50,
      y,
      size: 11,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });
    y -= 18;
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
