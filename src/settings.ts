import { App, PluginSettingTab, Setting } from "obsidian";
import MusicSessionPDF from "./main";
import {
  DEFAULT_LYRICS_FOLDER,
  DEFAULT_SHEETS_FOLDER,
  DEFAULT_SESSIONS_FOLDER,
} from "./constants";

export interface MusicSessionPDFSettings {
  lyricsFolder: string;
  sheetsFolder: string;
  sessionsFolder: string;
}

export const DEFAULT_SETTINGS: MusicSessionPDFSettings = {
  lyricsFolder: DEFAULT_LYRICS_FOLDER,
  sheetsFolder: DEFAULT_SHEETS_FOLDER,
  sessionsFolder: DEFAULT_SESSIONS_FOLDER,
};

export function sessionsPdfFolder(settings: MusicSessionPDFSettings): string {
  return `${settings.sessionsFolder}/PDFs`;
}

export class MusicSessionPDFSettingTab extends PluginSettingTab {
  plugin: MusicSessionPDF;

  constructor(app: App, plugin: MusicSessionPDF) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Lyrics folder")
      .setDesc("Folder containing your sheet pdfs")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.lyricsFolder)
          .onChange(async (value) => {
            this.plugin.settings.lyricsFolder = value.trim() || DEFAULT_LYRICS_FOLDER;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Sheets folder")
      .setDesc("Folder containing your sheet pdfs")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.sheetsFolder)
          .onChange(async (value) => {
            this.plugin.settings.sheetsFolder = value.trim() || DEFAULT_SHEETS_FOLDER;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Sessions folder")
      .setDesc("Folder where generated session notes and pdfs are stored")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.sessionsFolder)
          .onChange(async (value) => {
            this.plugin.settings.sessionsFolder = value.trim() || DEFAULT_SESSIONS_FOLDER;
            await this.plugin.saveSettings();
          })
      );
  }
}