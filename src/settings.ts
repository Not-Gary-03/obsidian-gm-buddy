import {App, PluginSettingTab} from "obsidian";
import GMBuddyPlugin from "./main";

export interface GMBuddySettings {
}

export const DEFAULT_SETTINGS: GMBuddySettings = {
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
	}
}
