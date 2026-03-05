import {Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, GMBuddySettings, GMBuddySettingTab} from "./settings";

export default class GMBuddyPlugin extends Plugin {
	settings: GMBuddySettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GMBuddySettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GMBuddySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
