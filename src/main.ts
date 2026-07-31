import {
	Notice,
	Plugin,
	App
} from 'obsidian';

import {
	DEFAULT_SETTINGS,
	MyPluginSettings as MusicSessionPDFSettings,
	SampleSettingTab as MusicSessionPDFSettingTab,
} from './settings';

import { getAllSongs } from './session/parser';
import { SessionModal } from './session/modal';

import { LYRICS_FOLDER, SHEETS_FOLDER, SESSIONS_FOLDER } from './constants';

async function ensureFolders(app: App): Promise<void> {
  for (const path of [LYRICS_FOLDER, SHEETS_FOLDER, SESSIONS_FOLDER]) {
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

		this.addCommand({
			id: "log-all-songs",
			name: "Log all songs (debug)",
			callback: () => {
				const songs = getAllSongs(this.app);
				console.log(songs);
			},
		});

		// This creates an session icon in the left ribbon.
		this.addRibbonIcon('notepad-text-dashed', 'Create Music Session', (_evt: MouseEvent) => {
			new SessionModal(this.app).open();
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MusicSessionPDFSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(activeDocument, 'click', (_evt: MouseEvent) => {
			new Notice('Click');
		});

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

