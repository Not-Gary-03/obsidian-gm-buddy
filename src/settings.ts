import {App, PluginSettingTab} from "obsidian";
import GMBuddyPlugin from "./main";
import {DiceMacro} from "./types";
import {renderDiceSettings} from "./dice/dice-settings";
import {renderAlchemySettings} from "./alchemy/alchemy-settings";

export interface GMBuddySettings {
	macros: DiceMacro[];
}

export const DEFAULT_SETTINGS: GMBuddySettings = {
	macros: [],
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

		renderDiceSettings(containerEl, this.plugin, () => this.display());
		renderAlchemySettings(containerEl, this.plugin, () => this.display());
	}
}
