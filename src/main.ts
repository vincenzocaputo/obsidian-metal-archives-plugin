import { 
	Plugin,
	Editor,
	Workspace,
	Vault,
	App,
	requests,
	Notice,
	FileManager
} from 'obsidian';

import {
	BandNameSuggestModal
} from './dialogs/BandNameSuggestModal';

import {
	AlbumTitleSuggestModal
} from './dialogs/AlbumTitleSuggestModal';

import {
	MetalArchivesApi
} from './api/MetalArchivesApi';

import {
	MetalArchivesSettingTab
} from './settings/MetalArchivesSettingTab';

interface MetalArchivesPluginSettings {
  bandsPathLocation: string;
  albumsPathLocation: string;
}

const DEFAULT_SETTINGS: Partial<MetalArchivesPluginSettings> = {
  bandsPathLocation: "bands",
  albumsPathLocation: "albums",
  bandUpdate: false,
  mainDiscs: true,
  liveDiscs: false,
  demoDiscs: false,
  miscDiscs: false
};


export default class MetalArchivesPlugin extends Plugin {
	settings: MetalArchivesPluginSettings;
	maApi: MetalArchivesApi;

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async showErrorNotice(msg) {
		const notice = new Notice(`Error: ${msg}`, 5000);
		notice.noticeEl.style.backgroundColor = "#FF0000";
		notice.noticeEl.style.opacity = "80%";
	}

	async showOkNotice(msg) {
		const notice = new Notice(msg, 5000);
		notice.noticeEl.style.backgroundColor = "#3DD164";
		notice.noticeEl.style.opacity = "80%";
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MetalArchivesSettingTab(this.app, this));

		this.maApi = new MetalArchivesApi();
		const vault = this.app.vault;
		this.addCommand({
			id: "create-band-note",
			name: "Pick a band and create a note",
			callback: () => {
				new BandNameSuggestModal(this.app, (band) => {
					const loadingNotice = new Notice("Loading Note...", 0);
					// I need to replace spaces with underscores
					band = this.maApi.getBandInfo(band.refUrl, band.name);
					band.then((b)=>{
						return this.maApi.getBandDescription(b);
					}).then((b)=>{
						if(this.settings.mainDiscs) {
							return this.maApi.getBandDiscography(b, 'main');
						} else {
							return b;
						}
					}).then((b)=>{
						if(this.settings.liveDiscs) {
							return this.maApi.getBandDiscography(b, 'lives');
						} else {
							return b;
						}
					}).then((b)=>{
						if(this.settings.demoDiscs) {
							return this.maApi.getBandDiscography(b, 'demos');
						} else {
							return b;
						}
					}).then((b)=>{
						if(this.settings.miscDiscs) {
							return this.maApi.getBandDiscography(b, 'misc');
						} else {
							return b;
						}
					}).then((b)=>{
						this.renderBandNote(b);
						loadingNotice.hide();
					});
				}).open()
			}
		});
		this.addCommand({
			id: "create-album-note",
			name: "Pick an album and create a note",
			callback: () => {
				new AlbumTitleSuggestModal(this.app, (album) => {
					const loadingNotice = new Notice("Loading Note...", 0);
					album = this.maApi.getAlbum(album.refUrl);
					album.then((a) => {
						this.renderAlbumNote(a);
						loadingNotice.hide()
					});
				}).open()
			}
		});

		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			const target = evt.target as HTMLElement;
			if (target.matches("a.internal-link.is-unresolved")) {
				const activeFile = this.app.workspace.getActiveFile();
				this.app.fileManager.processFrontMatter(activeFile, (frontmatter) => {
					const url = frontmatter["Reference"] ?? "";
					if (url && url.includes("https://www.metal-archives.com/bands/")) {
						const loadingNotice = new Notice("Loading Note...", 0);
						const band = this.maApi.getBandInfo(url).then( (b) => {
							this.maApi.getBandDiscography(b, "main").then( (b) => {
								b.discography.forEach( (d) => {
									if (d.discName === target.textContent) {
										const album = this.maApi.getAlbum(d.discUrl);
										album.then( (a) => {
											this.renderAlbumNote(a);
											loadingNotice.hide();
										});
									}
								});
							});
						});
					}
				});
			}
		});
	}


	async renderAlbumNote(album: Album) {
		const vaultBasePath = this.app.vault.adapter.basePath;

		const bandFilename = album.band.replace(/[:\/]/g, " ");
		const albumFilename = album.name.replace(/[:\/]/g, " ");
		const albumsDir = `${vaultBasePath}/${this.settings.albumsPathLocation}/${bandFilename}`;
	
		this.app.vault.adapter.exists(albumsDir).then( (r) => {
			return this.app.vault.adapter.mkdir(this.settings.albumsPathLocation.toString());
		}).then((r) => {
			return this.app.vault.adapter.mkdir(`${this.settings.albumsPathLocation}/${bandFilename}`);
		}).then((r) => {
			const noteFilename = `${this.settings.albumsPathLocation}/${album.band}/${albumFilename}.md`;
			
			let songsTable = ``;
			for (const song of album.songs) {
				songsTable += `|**${song.title}**|${song.length}|\n`;
			}
			const body = `---
band: "[[${album.band}]]"
release_date: ${album.date}
type: ${album.type}
label: ${album.label}
format: ${album.format}
reference: ${album.url}
---

# ${album.name}

![cover|400x400](${album.cover})

## Songs
|Title|Length|
|---|---|
${songsTable}

`
			const vault = this.app.vault;
			this.app.vault.adapter.exists(noteFilename).then((r) => {
				if (r) {
					const file = vault.getFileByPath(noteFilename);
					const newNote = vault.modify(file, body);
					this.showOkNotice("Note updated");
				} else {
					const newNote = vault.create(noteFilename, body);
					this.showOkNotice("Note created");
				}
			});

		}); 

	}

	async renderBandNote(band) {
		const vaultBasePath = this.app.vault.adapter.basePath;
	
		const bandsDir = `${vaultBasePath}/${this.settings.bandsPathLocation}`;

		const albumsDir = `${this.settings.albumsPathLocation}/${band.name.replace(/[:\/]/g," ")}`;

		this.app.vault.adapter.exists(bandsDir).then( (r) => {
			return this.app.vault.adapter.mkdir(this.settings.bandsPathLocation.toString());
		}).then((r) => {

			const noteFilename = `${this.settings.bandsPathLocation}/${band.name.replace(/[:\/]/g, " ")}.md`;

			let tags = ``;
			for (const tag of band.tags) {
				tags += `- "#${tag}"\n`;
			}
			let membersTable = ``;
			for (const member of band.members) {
				membersTable += `|${member.memberName}|${member.memberRole.replace(/(\r\n|\n|\r)/gm, "")}|\n`;
			}

			let discogTable = ``;
			for (const disc of band.discography) {
				if (disc.discName.length > 0) {
					const albumDir = `${albumsDir}/${disc.discName.replace(/[:\/]/g, " ")}`
					if ("Full-length" === disc.discType) {
						discogTable += `|**[[${albumDir}\\|${disc.discName}]]**|${disc.discType}|${disc.discYear}|\n`;
					} else {
						discogTable += `|[[${disc.discName}]]|${disc.discType}|${disc.discYear}|\n`;
					}
				}
			}

			const body = `---
Country: ${band.country}
Status: ${band.status}
Formed in: "${band.formedYear}"
YearsActive: ${band.yearsActive.replace(/(\r\n|\n|\r)/gm, "")}
Genre: ${band.genre}
Themes: ${band.themes}
Current Label: ${band.currentLabel}
Reference: ${band.url}
tags: 
${tags}
---
# ${band.name}

${band.description.replace(/Compilation (a|A)ppearances:.*(?:\n.*)*/g, "")}
## Members
|Member name|Instrument|
|---|---|
${membersTable}
## Discography
|Name|Type|Year|
|---|---|---|
${discogTable}
`
			const vault = this.app.vault;
			this.app.vault.adapter.exists(noteFilename).then((r) => {
				if (r) {
					if (this.settings.bandUpdate) {
						const file = vault.getFileByPath(noteFilename);
						const newNote = vault.modify(file, body);
						this.showOkNotice("Note updated");
					} else {
						this.showErrorNotice("The band is already present in your vault");
					}
				} else {
					const newNote = vault.create(noteFilename, body);
					this.showOkNotice("Note created");
				}
			});
			
		});

	}

	async onunload() {
		console.log("unloading plugin");
	}
}

