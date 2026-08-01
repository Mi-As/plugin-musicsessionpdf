import Sortable from "sortablejs";
import { App, Modal, Setting, FuzzySuggestModal, setIcon, TextComponent, Notice } from "obsidian";

import { Song, SheetOption, getAllSongs, resolveSheet } from "./parser";
import { generateSessionNote } from "./generator";

const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface SetlistEntry {
  song: Song;
  key: string;
}

function findSheetForKey(song: Song, key: string): SheetOption | undefined {
  return song.sheets.find((s) => s.key === key);
}

function defaultKeyFor(song: Song): string {
  if (song.preferredKey && KEYS.includes(song.preferredKey)) {
    return song.preferredKey;
  }
  const firstKeyed = song.sheets.find((s) => s.key !== null);
  return firstKeyed?.key ?? "C";
}


class SongPickerModal extends FuzzySuggestModal<Song> {
  constructor(
    app: App,
    private songs: Song[],
    private onChoose: (song: Song) => void
  ) {
    super(app);
    this.setPlaceholder("Search song database...");
  }

  getItems(): Song[] {
    return this.songs;
  }

  getItemText(song: Song): string {
    return song.title;
  }

  onChooseItem(song: Song): void {
    this.onChoose(song);
  }
}

export class SessionModal extends Modal {
  private allSongs: Song[];
  private entries: SetlistEntry[] = [];
  private listEl: HTMLElement;
  private sortable: Sortable | undefined;
   private nameInput: TextComponent;

  constructor(app: App) {
    super(app);
    this.allSongs = getAllSongs(this.app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create a set list" });

    new Setting(contentEl)
      .setName("Session name")
      .setDesc("Leave empty to use today's date")
      .addText((text) => {
        text.setPlaceholder(`Session ${new Date().toISOString().slice(0, 10)}`);
        this.nameInput = text;
    });

    new Setting(contentEl)
      .setName("Search song database")
      .addButton((btn) =>
        btn.setButtonText("+ Choose Song ").onClick(() => {
          const alreadyChosen = new Set(
            this.entries.map((e) => e.song.file.path)
          );
          const available = this.allSongs.filter(
            (s) => !alreadyChosen.has(s.file.path)
          );

          new SongPickerModal(this.app, available, (song) => {
            this.entries.push({ song, key: defaultKeyFor(song) });
            this.renderList();
          }).open();
        })
    );

    this.listEl = contentEl.createDiv({ cls: "setlist-container" });

    this.sortable = new Sortable(this.listEl, {
      animation: 150,
      handle: ".setlist-drag-handle",
      onEnd: (evt) => {
        if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
        const [moved] = this.entries.splice(evt.oldIndex, 1);
        this.entries.splice(evt.newIndex, 0, moved);
      },
    });

    this.renderList();

    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText("Generate")
        .setCta()
        .onClick(async () => {
          const file = await generateSessionNote(this.app, this.entries, this.nameInput.getValue());
          new Notice(`Session created: ${file.basename}`);
          await this.app.workspace.getLeaf(false).openFile(file);
          this.close();
        })
    );
  }

  private renderList() {
    this.listEl.empty();

    if (this.entries.length === 0) {
        this.listEl.createEl("p", {
        text: "No songs have been chosen.",
        cls: "setlist-empty",
        });
        return;
    }

    this.entries.forEach((entry, index) => {
        const row = this.listEl.createDiv({ cls: "setlist-row" });

        const handle = row.createSpan({ cls: "setlist-drag-handle" });
        setIcon(handle, "grip-vertical");

        const titleEl = row.createSpan({
        text: entry.song.title,
        cls: "setlist-title",
        });

        const select = row.createEl("select", { cls: "setlist-key-select" });
        KEYS.forEach((key) => {
          const isPreferred = key === entry.song.preferredKey;
          const opt = select.createEl("option", {
            text: isPreferred ? `${key} ★` : key,
            value: key,
          });
          if (entry.key === key) opt.selected = true;
        });

        const updateHighlight = () => {
			  const match = resolveSheet(entry.song.sheets, entry.key);
			  titleEl.toggleClass("setlist-no-sheet", !match);
		    };
        updateHighlight();

        select.onchange = () => {
        entry.key = select.value;
        updateHighlight();
        };

        const removeBtn = row.createEl("button", {
        text: "✕",
        cls: "setlist-remove-btn",
        });
        removeBtn.onclick = () => {
        this.entries.splice(index, 1);
        this.renderList();
        };
    });
  } 

  onClose() {
    this.contentEl.empty();
  }
}