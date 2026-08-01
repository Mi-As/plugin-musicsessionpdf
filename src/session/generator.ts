import { App, TFile } from "obsidian";
import { SESSIONS_FOLDER } from "../constants";
import { Song, resolveSheet } from "./parser";

export interface SetlistEntry {
  song: Song;
  key: string;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildSessionContent(entries: SetlistEntry[], date: Date): string {
  const lines = [
    "---",
    `date: ${formatDate(date)}`,
    "generated: true",
    "---",
    "",
    "> [!warning] This file is auto-generated. Do not edit — changes will be lost on regeneration.",
    "",
    ...entries.map((e) => {
      const sheet = resolveSheet(e.song.sheets, e.key);
      const sheetPart = sheet ? ` sheet: [[${sheet.file.path}]]` : "";
      return `- [[${e.song.file.path}]] key: ${e.key}${sheetPart}`;
    }),
  ];
  return lines.join("\n");
}

async function findAvailablePath(app: App, baseName: string): Promise<string> {
  let path = `${SESSIONS_FOLDER}/${baseName}.md`;
  let suffix = 2;
  while (app.vault.getAbstractFileByPath(path)) {
    path = `${SESSIONS_FOLDER}/${baseName} ${suffix}.md`;
    suffix++;
  }
  return path;
}

export async function generateSessionNote(
  app: App,
  entries: SetlistEntry[]
): Promise<TFile> {
  const date = new Date();
  const baseName = `Session ${formatDate(date)}`;
  const path = await findAvailablePath(app, baseName);
  const content = buildSessionContent(entries, date);
  return app.vault.create(path, content);
}