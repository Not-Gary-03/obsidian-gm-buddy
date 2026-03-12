import {Editor, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, GMBuddySettings, GMBuddySettingTab} from "./settings";
import {HitPointListModal} from "./hit-point-list-modal";
import {ItemRegistry} from "./registry";
import {NoteFactory} from "./noteFactory";
import {CraftingEngine} from "./crafting";
import {NoteSync} from "./sync";
import {ListNoteManager} from "./list-notes";

export default class GMBuddyPlugin extends Plugin {
	settings: GMBuddySettings;
	registry: ItemRegistry;
	noteFactory: NoteFactory;
	craftingEngine: CraftingEngine;
	noteSync: NoteSync;
	listNoteManager: ListNoteManager;

	async onload() {
		await this.loadSettings();

		this.registry = new ItemRegistry(this.app);
		this.noteFactory = new NoteFactory(this.app);
		this.craftingEngine = new CraftingEngine(this.registry, this.app, this.settings);
		this.noteSync = new NoteSync(this.app, this.noteFactory);
		this.listNoteManager = new ListNoteManager(this.app, this.registry, this.settings);

		// Rebuild list notes whenever the registry updates
		this.registry.setUpdateCallback(() => {
			void this.listNoteManager.rebuildIngredientList();
			void this.listNoteManager.rebuildAlchemyList();
		});

		// Wire up sync: re-render body whenever frontmatter changes
		this.app.metadataCache.on("changed", (file) => this.noteSync.syncNoteBody(file));

		// Delay registry initialization until the metadata cache is fully populated.
		// Without this, getFileCache() returns null for existing files on startup.
		this.app.workspace.onLayoutReady(async () => {
			await this.registry.initialize();
		});

		this.addCommand({
			id: "create-ingredient",
			name: "New Ingredient",
			callback: () => this.promptAndCreate("ingredient"),
		});
		this.addCommand({
			id: "create-alchemy-craftable",
			name: "New Alchemy Craftable",
			callback: () => this.promptAndCreate("alchemy_craftable"),
		});
		this.addCommand({
			id: "create-equipment-craftable",
			name: "New Equipment Craftable",
			callback: () => this.promptAndCreate("equipment_craftable"),
		});
		this.addCommand({
			id: "perform-alchemy",
			name: "Perform Alchemy",
			callback: () => this.craftingEngine.openCraftingModal(),
		});

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

	private async promptAndCreate(type: string) {
		let file;
		switch (type) {
			case "ingredient":
				file = await this.noteFactory.createIngredient({ name: "New Ingredient" });
				break;
			case "alchemy_craftable":
				file = await this.noteFactory.createAlchemyCraftable({ name: "New Alchemy Craftable" });
				break;
			case "equipment_craftable":
				file = await this.noteFactory.createEquipmentCraftable({ name: "New Equipment Craftable" });
				break;
			default:
				return;
		}
		await this.app.workspace.getLeaf().openFile(file);
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GMBuddySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
