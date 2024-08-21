import MetalArchivesPlugin from "./main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class MetalArchivesSettingTab extends PluginSettingTab {
  plugin: MetalArchivesPlugin;

  constructor(app: App, plugin: MetalArchivesPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
	new Setting(containerEl)
		.setName("Band notes path")
		.setDesc("Choose the folder where band notes will be saved")
		.addDropdown(dropdown => {
		  const folders = app.vault.getAllLoadedFiles().filter(i => i.children).map(folder => folder.path);
		  for (const folder of folders) {
			  dropdown.addOption(folder, folder);
		  }
		  if (!folders.includes(this.plugin.settings.bandsPathLocation)) {
			  dropdown.addOption(this.plugin.settings.bandsPathLocation, this.plugin.settings.bandsPathLocation);
		  }
		  dropdown.onChange(async (value) => {
			  this.plugin.settings.bandsPathLocation = value;
			  await this.plugin.saveSettings();
		  });
		  dropdown.setValue(this.plugin.settings.bandsPathLocation);
	  });
	new Setting(containerEl)
		.setName("Album notes path")
		.setDesc("Choose the folder where album notes will be saved")
		.addDropdown(dropdown => {
		  const folders = app.vault.getAllLoadedFiles().filter(i => i.children).map(folder => folder.path);
		  for (const folder of folders) {
			  dropdown.addOption(folder, folder);
		  }
		  if (!folders.includes(this.plugin.settings.albumsPathLocation)) {
			  dropdown.addOption(this.plugin.settings.albumsPathLocation, this.plugin.settings.albumsPathLocation);
		  }
		  dropdown.onChange(async (value) => {
			  this.plugin.settings.albumsPathLocation = value;
			  await this.plugin.saveSettings();
		  });
		  dropdown.setValue(this.plugin.settings.albumsPathLocation);
	  });

	containerEl.createEl("h2", { text: "Band Discopgraphy" })

	new Setting(containerEl)
		.setName("Allow band notes update")
		.setDesc("Automatically update a band note whenever you select a band already present in your vault")
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.bandUpdate);
			toggle.onChange(async (value) => {
				this.plugin.settings.bandUpdate = value;
				await this.plugin.saveSettings();
			});
	  });

	containerEl.createEl("h2", { text: "Band Discopgraphy" })
	
	new Setting(containerEl)
		.setName("Download main discography")
		.setDesc("The discography section in the band notes will contain full-length albums")
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.mainDiscs);
			toggle.onChange(async (value) => {
				this.plugin.settings.mainDiscs = value;
				await this.plugin.saveSettings();
			});
		});
	new Setting(containerEl)
		.setName("Download lives")
		.setDesc("The discography section in the band notes will contain live albums")
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.liveDiscs);
			toggle.onChange(async (value) => {
				this.plugin.settings.liveDiscs = value;
				await this.plugin.saveSettings();
			});
		});
	new Setting(containerEl)
		.setName("Download demos")
		.setDesc("The discography section in the band notes will contain demo albums")
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.demoDiscs);
			toggle.onChange(async (value) => {
				this.plugin.settings.demoDiscs = value;
				await this.plugin.saveSettings();
			});
		});
	new Setting(containerEl)
		.setName("Download misc.")
		.setDesc("The discography section in the band notes will contain other type of albums (EPs, Singles, ...)")
		.addToggle(toggle => {
			toggle.setValue(this.plugin.settings.miscDiscs);
			toggle.onChange(async (value) => {
				this.plugin.settings.miscDiscs = value;
				await this.plugin.saveSettings();
			});
		});
  }
}
