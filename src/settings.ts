import {App, PluginSettingTab, Setting} from "obsidian";
import GMBuddyPlugin from "./main";

export interface GMBuddySettings {
	ingredientFolder: string;
	alchemyFolder: string;
	equipmentFolder: string;
	ingredientListNote: string;
	alchemyListNote: string;
	craftingOutputNote: string;
	monsterListNote: string;
}

export const DEFAULT_SETTINGS: GMBuddySettings = {
	ingredientFolder: "Crafting/Ingredients",
	alchemyFolder: "Crafting/Alchemy",
	equipmentFolder: "Crafting/Equipment",
	ingredientListNote: "Crafting/Ingredient List",
	alchemyListNote: "Crafting/Alchemy List",
	craftingOutputNote: "Crafting/Crafting Log",
	monsterListNote: "Content/Creatures/Monster List"
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

		containerEl.createEl("h2", { text: "GM Buddy — Crafting" });

		new Setting(containerEl)
			.setName("Ingredient folder")
			.setDesc("Vault folder where ingredient notes are stored.")
			.addText(text => text
				.setPlaceholder("Crafting/Ingredients")
				.setValue(this.plugin.settings.ingredientFolder)
				.onChange(async (value) => {
					this.plugin.settings.ingredientFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Alchemy craftable folder")
			.setDesc("Vault folder where alchemy craftable notes are stored.")
			.addText(text => text
				.setPlaceholder("Crafting/Alchemy")
				.setValue(this.plugin.settings.alchemyFolder)
				.onChange(async (value) => {
					this.plugin.settings.alchemyFolder = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Equipment craftable folder")
			.setDesc("Vault folder where equipment craftable notes are stored.")
			.addText(text => text
				.setPlaceholder("Crafting/Equipment")
				.setValue(this.plugin.settings.equipmentFolder)
				.onChange(async (value) => {
					this.plugin.settings.equipmentFolder = value;
					await this.plugin.saveSettings();
				}));

		containerEl.createEl("h2", { text: "GM Buddy — List Notes" });

		new Setting(containerEl)
			.setName("Ingredient list note")
			.setDesc("Path to the auto-generated note listing all ingredients (omit .md).")
			.addText(text => text
				.setPlaceholder("Crafting/Ingredient List")
				.setValue(this.plugin.settings.ingredientListNote)
				.onChange(async (value) => {
					this.plugin.settings.ingredientListNote = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Alchemy craftable list note")
			.setDesc("Path to the auto-generated note listing all alchemy craftables (omit .md).")
			.addText(text => text
				.setPlaceholder("Crafting/Alchemy List")
				.setValue(this.plugin.settings.alchemyListNote)
				.onChange(async (value) => {
					this.plugin.settings.alchemyListNote = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName("Crafting output note")
			.setDesc("Path to the note where crafting results are logged (omit .md).")
			.addText(text => text
				.setPlaceholder("Crafting/Crafting Log")
				.setValue(this.plugin.settings.craftingOutputNote)
				.onChange(async (value) => {
					this.plugin.settings.craftingOutputNote = value;
					await this.plugin.saveSettings();
				}));
	}
}
