import {Editor, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, GMBuddySettings, GMBuddySettingTab} from "./settings";
import {HitPointListModal} from "./hit-point-list-modal";

export default class GMBuddyPlugin extends Plugin {
	settings: GMBuddySettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new GMBuddySettingTab(this.app, this));

		this.addCommand({
			id: 'insert-hit-point-list',
			name: 'Insert hit point list',
			editorCallback: (editor: Editor) => {
				new HitPointListModal(this.app, (result) => {
					editor.replaceSelection(result);
				}).open();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GMBuddySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
