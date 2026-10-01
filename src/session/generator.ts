import { App, TFile, getFrontMatterInfo } from "obsidian";
import { Song, resolveSheet } from "./parser";

export interface SetlistEntry {
  song: Song;
  key: string;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildBody(entries: SetlistEntry[]): string {
  const lines = [
    "> [!warning] This file is auto-generated. Do not edit — changes will be lost on regeneration.",
    "",
    ...entries.map((e) => {
      const sheet = resolveSheet(e.song.sheets, e.key);
      const sheetPart = sheet ? ` sheet: [[${sheet.file.path}]]` : "";
      return `- [[${e.song.file.basename}]] key: ${e.key}${sheetPart}`;
    }),
  ];
  return lines.join("\n");
}

function buildSessionContent(entries: SetlistEntry[], date: Date): string {
  const frontmatter = ["---", `date: ${formatDate(date)}`, "generated: true", "---", ""];
  return frontmatter.join("\n") + "\n" + buildBody(entries);
}

export async function updateSessionNote(
  app: App,
  sessionFile: TFile,
  entries: SetlistEntry[]
): Promise<void> {
  const raw = await app.vault.read(sessionFile);
  const info = getFrontMatterInfo(raw);
  const frontmatterBlock = raw.slice(0, info.contentStart);
  await app.vault.modify(sessionFile, frontmatterBlock + buildBody(entries) + "\n");
}

async function findAvailablePath(
  app: App,
  sessionsFolder: string,
  baseName: string
): Promise<string> {
  let path = `${sessionsFolder}/${baseName}.md`;
  let suffix = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = `${sessionsFolder}/${baseName} ${suffix}.md`;
    suffix++;
  }
  return path;
}

export async function linkPdfInSession(
  app: App,
  sessionFile: TFile,
  key: "lyrics_pdf" | "sheet_pdf",
  pdfFile: TFile
): Promise<void> {
  await app.fileManager.processFrontMatter(sessionFile, (fm: Record<string, unknown>) => {
    fm[key] = `[[${pdfFile.path}]]`;
  });
}

export async function generateSessionNote(
  app: App,
  entries: SetlistEntry[],
  sessionsFolder: string,
  customName?: string
): Promise<TFile> {
  const date = new Date();
  const baseName = customName || `Session ${formatDate(date)}`;
  const path = await findAvailablePath(app, sessionsFolder, baseName);
  const content = buildSessionContent(entries, date);
  return app.vault.create(path, content);
}
