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
  }
}
