import {
	Editor,
	MarkdownView,
	MarkdownFileInfo,
	Modal,
	Notice,
	Plugin,
} from 'obsidian';

import {
	DEFAULT_SETTINGS,
	MyPluginSettings as MusicSessionPDFSettings,
	SampleSettingTab as MusicSessionPDFSettingTab,
} from './settings';

import { ensureFolders, getAllSongs } from './session_creator';

// Remember to rename these classes and interfaces!

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


		// This creates an icon in the left ribbon.
		/* this.addRibbonIcon('dice', 'Sample', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		}); */

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		/* const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status bar text'); */

		// This adds a simple command that can be triggered anywhere
		/* this.addCommand({
			id: 'open-modal-simple',
			name: 'Open modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			},
		}); */
		// This adds an editor command that can perform some operation on the current editor instance
		/* this.addCommand({
			id: 'replace-selected',
			name: 'Replace selected content',
			editorCallback: (
				editor: Editor,
				_ctx: MarkdownView | MarkdownFileInfo,
			) => {
				editor.replaceSelection('Sample editor command');
			},
		}); */
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		/* this.addCommand({
			id: 'open-modal-complex',
			name: 'Open modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
				return false;
			},
		}); */

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MusicSessionPDFSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(activeDocument, 'click', (_evt: MouseEvent) => {
			new Notice('Click');
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		/* this.registerInterval(
			window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000),
		); */
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

/* class SampleModal extends Modal {
	onOpen() {
		const { contentEl } = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
} */
