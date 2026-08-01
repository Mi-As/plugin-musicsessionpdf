import {
	Notice,
	Plugin,
	App,
	TFile
} from 'obsidian';

import { generateLyricsPdf } from './pdfmaker';
import { parseSessionEntries } from './session/parser';
import { SessionModal } from './session/modal';

import {
	DEFAULT_SETTINGS,
	MyPluginSettings as MusicSessionPDFSettings,
	SampleSettingTab as MusicSessionPDFSettingTab,
} from './settings';

import { LYRICS_FOLDER, SHEETS_FOLDER, SESSIONS_FOLDER, SESSIONS_PDF_FOLDER } from './constants';

async function ensureFolders(app: App): Promise<void> {
  for (const path of [LYRICS_FOLDER, SHEETS_FOLDER, SESSIONS_FOLDER, SESSIONS_PDF_FOLDER]) {
	if (!app.vault.getAbstractFileByPath(path)) {
	  await app.vault.createFolder(path);
	}
  }
}

export default class MusicSessionPDF extends Plugin {
	settings!: MusicSessionPDFSettings;

	async onload() {
		await this.loadSettings();

		await ensureFolders(this.app);

		// This creates an session icon in the left ribbon.
		this.addRibbonIcon('notepad-text-dashed', 'Create Music Session', (_evt: MouseEvent) => {
			new SessionModal(this.app).open();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MusicSessionPDFSettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile)) return;
				if (!file.path.startsWith(SESSIONS_FOLDER + "/")) return;
				if (file.extension !== "md") return;

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
					const pdfFile = await generateLyricsPdf(this.app, entries, file.basename);
					new Notice(`Lyrics PDF created: ${pdfFile.basename}`);
					});
				});
			})
		);

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

