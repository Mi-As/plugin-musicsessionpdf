import { App, TFile, CachedMetadata } from "obsidian";

export const LYRICS_FOLDER = "Lyrics"; // TODO: make those changeable in settings

const CHORDS_PATTERN = /^Chords\s+(.+)$/i;

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

export function parseSong(app: App, file: TFile): Song | null {
    const cache: CachedMetadata | null = app.metadataCache.getFileCache(file);
    if (!cache?.frontmatter) return null;

    const fm = cache.frontmatter;

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
        preferredKey: fm["preferred key"] ?? null,
        level: fm["level"] ?? null,
        language: fm["language"] ?? null,
        sheets: sheets,
    }
};

export function getAllSongs(app: App): Song[] {
    return app.vault
        .getMarkdownFiles()
        .filter((f) => f.path.startsWith(LYRICS_FOLDER + "/"))
        .map((f) => parseSong(app, f))
        .filter((s): s is Song => s !== null);
}