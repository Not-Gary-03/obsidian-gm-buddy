import {App, PluginSettingTab, Setting} from "obsidian";
import GMBuddyPlugin from "./main";

export interface GMBuddySettings {
	mySetting: string;
}

export const DEFAULT_SETTINGS: GMBuddySettings = {
	mySetting: 'default'
}

export class GMBuddySettingTab extends PluginSettingTab {
	plugin: GMBuddyPlugin;

	constructor(app: App, plugin: GMBuddyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('FIXME')
			.setDesc('not implemented yet');
	}
}
