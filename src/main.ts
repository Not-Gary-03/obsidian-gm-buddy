import {Editor, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, GMBuddySettings, GMBuddySettingTab} from "./settings";
import {HitPointListModal} from "./hit-point-list-modal";
import {registerDiceBlockProcessors} from "./dice/dice-block-processor";
import {registerAlchemyBlockProcessor} from "./alchemy/alchemy-block-processor";
import {initAlchemyVault, registerAlchemyVaultListeners} from "./alchemy/vault-store";
import {AlchemyItem, Ingredient} from "./types";

export default class GMBuddyPlugin extends Plugin {
	settings: GMBuddySettings;
	ingredients: Ingredient[] = [];
	alchemyItems: AlchemyItem[] = [];

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

		registerDiceBlockProcessors(this);
		registerAlchemyBlockProcessor(this);

		await initAlchemyVault(this);
		registerAlchemyVaultListeners(this);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GMBuddySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
