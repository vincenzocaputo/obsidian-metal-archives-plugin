import {
	App,
	Notice,
	SuggestModal,
	request
} from 'obsidian';


interface Band {
	name: string,
	genre: string,
	refUrl: string
}

export class BandNameSuggestModal extends SuggestModal<Band> {
	onSubmit: (result: Band) => void;

	constructor(App: app, onSubmit: (result: Band) => void) {
		super(app);
		super.setPlaceholder("Enter band name");
		this.onSubmit = onSubmit;
	}

	getSuggestions(query: string): Band[] {

		if (query.length >= 1) {
			const bandList = request(`https://www.metal-archives.com/search/ajax-band-search/?field=name&query=${query.toLowerCase()}*&sEcho=7&iColumns=3&sColumns=&iDisplayStart=0&iDisplayLength=200&mDataProp_1=1&mDataProp_1=1&mDataProp_2=2`)
				.then(chunk => {
					let bands = [];
					JSON.parse(chunk)['aaData'].forEach( (entry) => {
						
						bands.push({
							name: entry[0].replaceAll(/<[^>]*>/g, '').trim(),
							genre: entry[1],
							refUrl: entry[0].match(/(?<=href=").*(?=")/)[0]
						})
					});
					return bands;
				});
			return bandList;
		}
	}

	renderSuggestion(band: Band, el: HTMLElement) {
		el.createEl("div", { text: band.name } );
		el.createEl("small", { text: band.genre } );
	}

	onChooseSuggestion(band: Band, evt: MouseEvent | KeyboardEvent) {
		this.onSubmit(band);
	}

	
}
