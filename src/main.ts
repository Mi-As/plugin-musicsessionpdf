import {
	Notice,
	Plugin,
	App,
	TFile
} from 'obsidian';

import { generateLyricsPdf, generateSheetPdf } from './pdfmaker';
import { parseSessionEntries, parseSong } from './session/parser';
import { SessionModal } from './session/modal';
import { linkPdfInSession, SetlistEntry } from './session/generator';

import { sessionsPdfFolder } from './settings';


import {
	DEFAULT_SETTINGS,
	MusicSessionPDFSettings,
	MusicSessionPDFSettingTab,
} from './settings';

async function ensureFolders(app: App, settings: MusicSessionPDFSettings): Promise<void> {
  const paths = [
    settings.lyricsFolder,
    settings.sheetsFolder,
    settings.sessionsFolder,
    sessionsPdfFolder(settings),
  ];
  for (const path of paths) {
    if (app.vault.getAbstractFileByPath(path)) continue;
    try {
      await app.vault.createFolder(path);
    } catch (e) {
      if (!(e instanceof Error && e.message.includes("already exists"))) {
        throw e;
      }
    }
  }
}

export default class MusicSessionPDF extends Plugin {
	settings!: MusicSessionPDFSettings;

	async onload() {
		await this.loadSettings();
		await ensureFolders(this.app, this.settings);

		this.addRibbonIcon("notepad-text-dashed", "Create music session", () => {
			new SessionModal(this.app, this.settings).open();
		});

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
			if (!(file instanceof TFile)) return;
			if (!file.path.startsWith(this.settings.sessionsFolder + "/")) return;
			if (file.extension !== "md") return;

			const pdfFolder = sessionsPdfFolder(this.settings);

			menu.addItem((item) => {
				item
				.setTitle("Generate lyrics PDF")
				.setIcon("file-text")
				.onClick(async () => {
					const entries = await parseSessionEntries(this.app, file);
					if (entries.length === 0) {
					new Notice("No songs found in this session file.");
					return;
					}
					const pdfFile = await generateLyricsPdf(this.app, entries, file.basename, pdfFolder);
					await linkPdfInSession(this.app, file, "lyrics_pdf", pdfFile);
					new Notice(`Lyrics PDF created: ${pdfFile.basename}`);
				});
			});

			menu.addItem((item) => {
				item
				.setTitle("Generate sheet PDF")
				.setIcon("music")
				.onClick(async () => {
					const entries = await parseSessionEntries(this.app, file);
					if (entries.length === 0) {
					new Notice("No songs found in this session file.");
					return;
					}
					const pdfFile = await generateSheetPdf(this.app, entries, file.basename, pdfFolder);
					if (pdfFile) {
					await linkPdfInSession(this.app, file, "sheet_pdf", pdfFile);
					new Notice(`Sheet PDF created: ${pdfFile.basename}`);
					}
				});
			});

			menu.addItem((item) => {
			item
				.setTitle("Edit music session")
				.setIcon("list-music")
				.onClick(async () => {
				const sessionEntries = await parseSessionEntries(this.app, file);
				const setlistEntries: SetlistEntry[] = [];
				const missing: string[] = [];

				for (const se of sessionEntries) {
					const song = parseSong(this.app, se.file);
					if (!song) {
					missing.push(se.file.basename);
					continue;
					}
					setlistEntries.push({ song, key: se.key });
				}

				if (missing.length > 0) {
					new Notice(
					`Could not load from database: ${missing.join(", ")} (note missing or no longer tagged as worship)`
					);
				}

				new SessionModal(this.app, this.settings, file, setlistEntries).open();
				});
			});
			})
		);

		this.addSettingTab(new MusicSessionPDFSettingTab(this.app, this));
		}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<MusicSessionPDFSettings>,
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

