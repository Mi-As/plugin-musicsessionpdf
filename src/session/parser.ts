import { App, TFile, CachedMetadata, getFrontMatterInfo } from "obsidian";

const CHORDS_PATTERN = /^Chords\s+(.+)$/i;

const SESSION_LINE_PATTERN = /^- \[\[(.+?)\]\] key: (\S+)(?: sheet: \[\[(.+?)\]\])?$/;

export interface SheetOption {
  label: string;         // e.g. "Chord Numbers" or "G"
  key: string | null;    // e.g. "G" or null 
  file: TFile;           // sheet pdf file
}

export interface Song {
  file: TFile;
  title: string;
  preferredKey: string | null;
  level: string | null;
  language: string | null;
  sheets: SheetOption[];
}

export interface SessionEntry {
  file: TFile;
  key: string;
  sheetFile: TFile | null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function parseSong(app: App, file: TFile): Song | null {
    const cache: CachedMetadata | null = app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return null;

    const fm = cache.frontmatter as Record<string, unknown>;

    const genere = fm["genere"] as string[] | undefined;
    if (genere && !genere.includes("worship")) return null;

    // populate SheetOption instance
    const sheets: SheetOption[] = [];

    for (const linkCache of cache.frontmatterLinks ?? []) {
        if (!linkCache.key.startsWith("sheet")) continue;

        const targetFile = app.metadataCache.getFirstLinkpathDest(
            linkCache.link,
            file.path
        );
        if (!targetFile) continue; 
        
        const alias = linkCache.displayText ?? targetFile.basename;
        const match = alias.match(CHORDS_PATTERN);

        sheets.push({
            label: alias,
            key: match?.[1]?.trim() ?? null,
            file: targetFile,
        });
    }

    // retun Song instance
    return {
        file: file,
        title: file.basename,
        preferredKey: asString(fm["preferred key"]),
        level: asString(fm["level"]),
        language: asString(fm["language"]),
        sheets: sheets,
    }
};

export function resolveSheet(sheets: SheetOption[], key: string): SheetOption | null {
  const exact = sheets.find((s) => s.key === key);
  if (exact) return exact;

  const numbers = sheets.find((s) => /^Chord Numbers$/i.test(s.label));
  if (numbers) return numbers;

  return null;
}

export function getAllSongs(app: App, lyricsFolder: string): Song[] {
  return app.vault
    .getMarkdownFiles()
    .filter((f) => f.path.startsWith(lyricsFolder + "/"))
    .map((f) => parseSong(app, f))
    .filter((s): s is Song => s !== null);
}

export async function parseSessionEntries(
  app: App,
  sessionFile: TFile
): Promise<SessionEntry[]> {
  const raw = await app.vault.cachedRead(sessionFile);
  const info = getFrontMatterInfo(raw);
  const body = raw.slice(info.contentStart);

  const entries: SessionEntry[] = [];
  for (const line of body.split("\n")) {
    const match = line.match(SESSION_LINE_PATTERN);
    if (!match) continue;

    const [, linkText, key, sheetLinkText] = match;
    if (!linkText || !key) continue;
    const target = app.metadataCache.getFirstLinkpathDest(linkText, sessionFile.path);
    if (!target) continue;

    const sheetFile = sheetLinkText
      ? app.metadataCache.getFirstLinkpathDest(sheetLinkText, sessionFile.path)
      : null;

    entries.push({ file: target, key: key.trim(), sheetFile: sheetFile ?? null });
  }
  return entries;
}