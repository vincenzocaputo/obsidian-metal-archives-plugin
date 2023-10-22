import { 
	Plugin,
	Editor,
	Workspace,
	Vault,
	App,
	requests,
} from 'obsidian';

import {
	BandNameSuggestModal
} from 'src/dialogs/BandNameSuggestModal';

import {
	AlbumTitleSuggestModal
} from 'src/dialogs/AlbumTitleSuggestModal';

import {
	MetalArchivesApi
} from 'src/api/MetalArchivesApi';

import {
	MetalArchivesSettingTab
} from 'settings/MetalArchivesSettingTab';

interface MetalArchivesPluginSettings {
  bandsPathLocation: string;
  albumsPathLocation: string;
}

const DEFAULT_SETTINGS: Partial<MetalArchivesPluginSettings> = {
  bandsPathLocation: "bands",
  albumsPathLocation: "albums"
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

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new MetalArchivesSettingTab(this.app, this));

		this.maApi = new MetalArchivesApi();
		const vault = this.app.vault;
		this.addCommand({
			id: "metal-archives-band",
			name: "Pick a band and create a note",
			callback: () => {
				new BandNameSuggestModal(this.app, (band) => {
					// I need to replace spaces with underscores
					band = this.maApi.getBandInfo(band.refUrl);
					band.then((b)=>{
						return this.maApi.getBandDescription(b);
					}).then((b)=>{
						return this.maApi.getBandDiscography(b);
					}).then((b)=>{
						this.renderBandNote(b);
					});
				}).open()
			}
		});
		this.addCommand({
			id: "metal-archives-album",
			name: "Pick an album and create a note",
			callback: () => {
				new AlbumTitleSuggestModal(this.app, (album) => {
					album = this.maApi.getAlbum(album.refUrl);
					album.then((a) => {
						this.renderAlbumNote(a);
					});
				}).open()
			}
		})
	}


	async renderAlbumNote(album: Album) {
		const vaultBasePath = this.app.vault.adapter.basePath;

		const albumsDir = `${vaultBasePath}/${this.settings.albumsPathLocation}/${album.band}`;
	
		const fs = require("fs");
		if (!fs.existsSync(albumsDir)) {
			fs.mkdirSync(albumsDir, { recursive: true });
		} 
		const noteFilename = `${this.settings.albumsPathLocation}/${album.band}/${album.name}.md`;
		
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
---

![](${album.cover})

## Songs
|Title|Length|
|---|---|
${songsTable}

`
		const vault = this.app.vault;
		const newNote = vault.create(noteFilename, body);

	}

	async renderBandNote(band) {
		const vaultBasePath = this.app.vault.adapter.basePath;
	
		const bandsDir = `${vaultBasePath}/${this.settings.bandsPathLocation}`;
		const fs = require("fs");
		if (!fs.existsSync(bandsDir)) {
			fs.mkdirSync(bandsDir, { recursive: true });
		}

		const noteFilename = `${this.settings.bandsPathLocation}/${band.name}.md`;

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
			if ("Full-length" === disc.discType) {
				discogTable += `|**${disc.discName}**|${disc.discType}|${disc.discYear}|\n`;
			} else {
				discogTable += `|${disc.discName}|${disc.discType}|${disc.discYear}|\n`;
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
tags: 
${tags}
---
${band.description.replace(/Compilation (a|A)ppearances:.*(?:\n.*)*/g, "")}
## Members
| | |
|---|---|
${membersTable}
## Discography
|Name|Type|Year|
|---|---|---|
${discogTable}
`
		const vault = this.app.vault;
		const newNote = vault.create(noteFilename, body);

	}

	async onunload() {
		console.log("unloading plugin");
	}
}

