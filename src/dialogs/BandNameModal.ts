export class BandNameModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h1", { text: "Enter the band name" });

		new Setting(contentEl)
			.setName("Band Name")
			.addText((text) => 
				text.onChange((value) => {
					this.result = value
				})
			);
		
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Submit")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.result);
					})
				});
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}
