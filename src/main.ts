import {Editor, Plugin} from 'obsidian';
import {DEFAULT_SETTINGS, GMBuddySettings, GMBuddySettingTab} from "./settings";
import {HitPointListModal} from "./hit-point-list-modal";
import {ItemRegistry} from "./registry";
import {NameModal, NumberModal, NoteFactory, ShiftIndexModal} from "./noteFactory";
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
		this.addCommand({
			id: "add-recipe",
			name: "Add Recipe",
			callback: () => this.craftingEngine.openAddRecipeModal(),
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

		this.addCommand({
  			id: "scale-index-alchemy",
  			name: "Scale Indexes: All Alchemy Craftables",
			callback: () => {
				new NumberModal(this.app, "Scale factor", (factor) => {
					void this.noteFactory.scaleIndexesInFolderAlchemy(ItemRegistry.FOLDERS.alchemy_craftable, factor);
				}).open();
			}
		});

		this.addCommand({
  			id: "scale-index-ingredient",
  			name: "Scale Indexes: All Ingredients",
			callback: () => {
				new NumberModal(this.app, "Scale factor", (factor) => {
					void this.noteFactory.scaleIndexesInFolderIngredient(ItemRegistry.FOLDERS.ingredient, factor);
				}).open();
			}
		});

		this.addCommand({
			id: "shift-index-alchemy",
			name: "Shift Indexes: Alchemy Craftables",
			callback: () => {
				new ShiftIndexModal(this.app, (typeProperty, range, compareValue, shift) => {
					void this.noteFactory.shiftIndexesAlchemyCraftable(typeProperty, range, compareValue, shift);
				}).open();
			}
		});

		this.addCommand({
  			id: "rebuild-frontmatter-alchemy",
  			name: "Rebuild Frontmatter: All Alchemy Craftables",
  			callback: () => this.noteFactory.rebuildFrontmatterInFolder(ItemRegistry.FOLDERS.alchemy_craftable),
		});
		
		this.addCommand({
  			id: "rebuild-frontmatter-equipment",
  			name: "Rebuild Frontmatter: All Equipment Craftables",
  			callback: () => this.noteFactory.rebuildFrontmatterInFolder(ItemRegistry.FOLDERS.equipment_craftable),
		});

	}

	private async promptAndCreate(type: string) {
		let file;
		switch (type) {
			case "ingredient":
				new NameModal(this.app, async (name) => {
					file = await this.noteFactory.createIngredient({ name });
					await this.app.workspace.getLeaf().openFile(file);
				}).open();
				break;
			case "alchemy_craftable":
				new NameModal(this.app, async (name) => {
					file = await this.noteFactory.createAlchemyCraftable({ name });
					await this.app.workspace.getLeaf().openFile(file);
				}).open();
				break;
			case "equipment_craftable":
				new NameModal(this.app, async (name) => {
					file = await this.noteFactory.createEquipmentCraftable({ name });
					await this.app.workspace.getLeaf().openFile(file);
				}).open();
				break;
			default:
				return;
		}
		
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData() as Partial<GMBuddySettings>);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
