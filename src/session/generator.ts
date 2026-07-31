import { App, TFile } from "obsidian";
import { SESSIONS_FOLDER } from "../constants";

export interface SetlistEntry {
  song: { file: TFile; title: string };
  key: string;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

function buildSessionContent(entries: SetlistEntry[], date: Date): string {
  const lines = [
    "---",
    `date: ${formatDate(date)}`,
    "---",
    "",
    "> [!warning] This file is auto-generated. Do not edit — changes will be lost on regeneration.",
    "",
    ...entries.map((e) => `- [[${e.song.file.basename}]] key: ${e.key}`),
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