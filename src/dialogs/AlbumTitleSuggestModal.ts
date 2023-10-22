import {
	App,
	Notice,
	SuggestModal,
	request
} from 'obsidian';


interface Album {
	title: string,
	band: string,
	refUrl: string
}

export class AlbumTitleSuggestModal extends SuggestModal<Band> {
	onSubmit: (result: Album) => void;

	constructor(App: app, onSubmit: (result: Album) => void) {
		super(app);
		super.setPlaceholder("Enter album title");
		this.onSubmit = onSubmit;
	}

	getSuggestions(query: string): Band[] {

		if (query.length >= 1) {
			const albumList = request(`https://www.metal-archives.com/search/ajax-album-search/?field=name&query=${query.toLowerCase()}&DisplayLength=200`)
				.then(chunk => {
					let albums = [];
					JSON.parse(chunk)['aaData'].forEach( (entry) => {
						
						albums.push({
							title: entry[1].replaceAll(/<[^>]*>/g, '').trim(),
							band: entry[0].replaceAll(/<[^>]*>/g, '').trim(),
							type: entry[2],
							refUrl: entry[1].match(/(?<=href=").*(?=")/)[0]
						})
					});
					return albums;
				});
			return albumList;
		}
	}

	renderSuggestion(album: Album, el: HTMLElement) {
		el.createEl("div", { text: album.title } );
		el.createEl("small", { text: `${album.band} (${album.type})` });
	}

	onChooseSuggestion(album: Album, evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(album);
	}

	
}
