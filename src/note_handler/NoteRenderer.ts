import {
	Plugin,
	App,
	Vault
} from 'obsidian';

export class NoteRenderer extends Plugin {

	async renderBandNote(band) {
		const noteFilename = `bands/${band.name}`;

		const vault = this.app.vault;
		const newNote = vault.create(noteFilename, "");

		await vault.save(newNote);
	}
}


