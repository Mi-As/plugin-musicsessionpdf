import { App, TFile, getFrontMatterInfo, Notice } from "obsidian";
import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";

import { SESSIONS_PDF_FOLDER } from "./constants";
import { SessionEntry } from "./session/parser";

// "Mobile" page size (narrow portrait, roughly phone aspect ratio)
const PAGE_WIDTH = 350;
const PAGE_HEIGHT = 620;
const MARGIN = 28;
const TITLE_SIZE = 20;
const BODY_SIZE = 14;
const LINE_GAP = 6;

async function getSongBody(app: App, file: TFile): Promise<string> {
  const raw = await app.vault.cachedRead(file);
  const info = getFrontMatterInfo(raw);
  return raw.slice(info.contentStart).trim();
}

function wrapLine(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (text.trim() === "") return [""]; // keep blank lines for verse spacing

  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateLyricsPdf(
  app: App,
  entries: SessionEntry[],
  fileNameBase: string
): Promise<TFile> {
  const pdfDoc = await PDFDocument.create();
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const maxWidth = PAGE_WIDTH - MARGIN * 2;

  let page!: PDFPage;
  let y!: number;

  const newPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    y = PAGE_HEIGHT - MARGIN;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) newPage();
  };

  const drawLine = (text: string, font: PDFFont, size: number) => {
    ensureSpace(size + LINE_GAP);
    page.drawText(text, { x: MARGIN, y, size, font, color: rgb(0, 0, 0) });
    y -= size + LINE_GAP;
  };

  for (const entry of entries) {
    newPage();
    drawLine(entry.file.basename, titleFont, TITLE_SIZE);
    y -= 8;

    const body = await getSongBody(app, entry.file);
    for (const rawLine of body.split("\n")) {
      for (const line of wrapLine(rawLine, bodyFont, BODY_SIZE, maxWidth)) {
        drawLine(line, bodyFont, BODY_SIZE);
      }
    }
  }

  const bytes = await pdfDoc.save();
  const path = `${SESSIONS_PDF_FOLDER}/${fileNameBase} - Lyrics.pdf`;

  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) {
    await app.vault.modifyBinary(existing, bytes);
    return existing;
  }
  return app.vault.createBinary(path, bytes);
}

export async function generateSheetPdf(
  app: App,
  entries: SessionEntry[],
  fileNameBase: string
): Promise<TFile | null> {
  const outDoc = await PDFDocument.create();
  const missing: string[] = [];

  for (const entry of entries) {
    if (!entry.sheetFile) {
      missing.push(entry.file.basename);
      continue;
    }
    const bytes = await app.vault.readBinary(entry.sheetFile);
    const srcDoc = await PDFDocument.load(bytes);
    const pages = await outDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((p) => outDoc.addPage(p));
  }

  if (missing.length > 0) {
    new Notice(
      `No sheet found for: ${missing.join(", ")} — PDF generated without ${
        missing.length === 1 ? "it" : "them"
      }.`
    );
  }

  if (outDoc.getPageCount() === 0) {
    new Notice("No sheets available at all — PDF not created.");
    return null;
  }

  const bytes = await outDoc.save();
  const path = `${SESSIONS_PDF_FOLDER}/${fileNameBase} - Sheets.pdf`;
  const existing = app.vault.getAbstractFileByPath(path);
  if (existing instanceof TFile) {
    await app.vault.modifyBinary(existing, bytes);
    return existing;
  }
  return app.vault.createBinary(path, bytes);
}