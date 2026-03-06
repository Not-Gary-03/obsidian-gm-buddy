import {Modal, Setting} from 'obsidian';
import GMBuddyPlugin from '../main';
import {AlchemyItem, AlchemyType, Ingredient, Rarity} from '../types';
import {saveIngredientNote, saveItemNote, deleteIngredientNote, deleteItemNote} from './vault-store';

const RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'very rare'];
const ALCHEMY_TYPES: AlchemyType[] = ['Alchemical', 'Mystical', 'Divine'];

export function renderAlchemySettings(
	containerEl: HTMLElement,
	plugin: GMBuddyPlugin,
	refresh: () => void
): void {
	// ---- Ingredients section ----
	new Setting(containerEl).setName('Ingredients').setHeading();

	for (const ingredient of plugin.ingredients) {
		new Setting(containerEl)
			.setName(ingredient.name)
			.setDesc(`${ingredient.rarity}, ${ingredient.gpCost}gp — A:${ingredient.alchemical} M:${ingredient.mystical} D:${ingredient.divine}`)
			.addButton(btn => btn
				.setButtonText('Edit')
				.onClick(() => {
					new IngredientEditModal(plugin, ingredient, refresh).open();
				}))
			.addButton(btn => btn
				.setButtonText('Delete')
				.setWarning()
				.onClick(async () => {
					await deleteIngredientNote(plugin, ingredient.name);
					refresh();
				}));
	}

	new Setting(containerEl)
		.addButton(btn => btn
			.setButtonText('Add ingredient')
			.setCta()
			.onClick(() => {
				new IngredientEditModal(plugin, null, refresh).open();
			}));

	// ---- Items section ----
	new Setting(containerEl).setName('Alchemy items').setHeading();

	for (const item of plugin.alchemyItems) {
		const rangeStr = item.indexMin === item.indexMax ? `#${item.indexMin}` : `#${item.indexMin}-${item.indexMax}`;
		new Setting(containerEl)
			.setName(item.name)
			.setDesc(`${item.type} ${rangeStr}, ${item.rarity}, ${item.gpCost}gp`)
			.addButton(btn => btn
				.setButtonText('Edit')
				.onClick(() => {
					new ItemEditModal(plugin, item, refresh).open();
				}))
			.addButton(btn => btn
				.setButtonText('Delete')
				.setWarning()
				.onClick(async () => {
					await deleteItemNote(plugin, item.name);
					refresh();
				}));
	}

	new Setting(containerEl)
		.addButton(btn => btn
			.setButtonText('Add item')
			.setCta()
			.onClick(() => {
				new ItemEditModal(plugin, null, refresh).open();
			}));
}

// ---- Ingredient edit modal ----

class IngredientEditModal extends Modal {
	private plugin: GMBuddyPlugin;
	private ingredient: Ingredient | null;
	private refresh: () => void;
	private draft: Ingredient;

	constructor(plugin: GMBuddyPlugin, ingredient: Ingredient | null, refresh: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.ingredient = ingredient;
		this.refresh = refresh;
		this.draft = ingredient
			? {...ingredient}
			: {name: '', rarity: 'common', gpCost: 0, alchemical: 0, mystical: 0, divine: 0, description: ''};
	}

	onOpen() {
		const {contentEl} = this;
		this.setTitle(this.ingredient ? 'Edit ingredient' : 'New ingredient');

		new Setting(contentEl).setName('Name')
			.addText(t => t.setValue(this.draft.name).setPlaceholder('Ingredient name')
				.onChange(v => { this.draft.name = v; }));

		new Setting(contentEl).setName('Rarity')
			.addDropdown(d => {
				for (const r of RARITIES) d.addOption(r, r);
				d.setValue(this.draft.rarity).onChange(v => { this.draft.rarity = v as Rarity; });
			});

		new Setting(contentEl).setName('GP cost')
			.addText(t => {
				t.setValue(String(this.draft.gpCost)).onChange(v => { this.draft.gpCost = parseInt(v) || 0; });
				t.inputEl.type = 'number'; t.inputEl.min = '0';
			});

		new Setting(contentEl).setName('Alchemical')
			.addText(t => {
				t.setValue(String(this.draft.alchemical)).onChange(v => { this.draft.alchemical = parseInt(v) || 0; });
				t.inputEl.type = 'number';
			});

		new Setting(contentEl).setName('Mystical')
			.addText(t => {
				t.setValue(String(this.draft.mystical)).onChange(v => { this.draft.mystical = parseInt(v) || 0; });
				t.inputEl.type = 'number';
			});

		new Setting(contentEl).setName('Divine')
			.addText(t => {
				t.setValue(String(this.draft.divine)).onChange(v => { this.draft.divine = parseInt(v) || 0; });
				t.inputEl.type = 'number';
			});

		new Setting(contentEl).setName('Description')
			.addText(t => t.setValue(this.draft.description).setPlaceholder('Description')
				.onChange(v => { this.draft.description = v; }));

		new Setting(contentEl)
			.addButton(btn => btn.setButtonText('Save').setCta().onClick(async () => {
				if (!this.draft.name.trim()) return;
				const oldName = this.ingredient?.name;
				await saveIngredientNote(this.plugin, this.draft, oldName);
				this.refresh();
				this.close();
			}));
	}

	onClose() { this.contentEl.empty(); }
}

// ---- Item edit modal ----

class ItemEditModal extends Modal {
	private plugin: GMBuddyPlugin;
	private item: AlchemyItem | null;
	private refresh: () => void;
	private draft: AlchemyItem;

	constructor(plugin: GMBuddyPlugin, item: AlchemyItem | null, refresh: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.item = item;
		this.refresh = refresh;
		this.draft = item
			? {...item}
			: {name: '', rarity: 'common', type: 'Alchemical' as AlchemyType, indexMin: 0, indexMax: 0, gpCost: 0, description: ''};
	}

	onOpen() {
		const {contentEl} = this;
		this.setTitle(this.item ? 'Edit alchemy item' : 'New alchemy item');

		new Setting(contentEl).setName('Name')
			.addText(t => t.setValue(this.draft.name).setPlaceholder('Item name')
				.onChange(v => { this.draft.name = v; }));

		new Setting(contentEl).setName('Type')
			.addDropdown(d => {
				for (const t of ALCHEMY_TYPES) d.addOption(t, t);
				d.setValue(this.draft.type).onChange(v => { this.draft.type = v as AlchemyType; });
			});

		new Setting(contentEl).setName('Index min')
			.addText(t => {
				t.setValue(String(this.draft.indexMin)).onChange(v => { this.draft.indexMin = parseInt(v) || 0; });
				t.inputEl.type = 'number'; t.inputEl.min = '0';
			});

		new Setting(contentEl).setName('Index max')
			.addText(t => {
				t.setValue(String(this.draft.indexMax)).onChange(v => { this.draft.indexMax = parseInt(v) || 0; });
				t.inputEl.type = 'number'; t.inputEl.min = '0';
			});

		new Setting(contentEl).setName('Rarity')
			.addDropdown(d => {
				for (const r of RARITIES) d.addOption(r, r);
				d.setValue(this.draft.rarity).onChange(v => { this.draft.rarity = v as Rarity; });
			});

		new Setting(contentEl).setName('GP cost')
			.addText(t => {
				t.setValue(String(this.draft.gpCost)).onChange(v => { this.draft.gpCost = parseInt(v) || 0; });
				t.inputEl.type = 'number'; t.inputEl.min = '0';
			});

		new Setting(contentEl).setName('Description')
			.addText(t => t.setValue(this.draft.description).setPlaceholder('Item description')
				.onChange(v => { this.draft.description = v; }));

		new Setting(contentEl)
			.addButton(btn => btn.setButtonText('Save').setCta().onClick(async () => {
				if (!this.draft.name.trim()) return;
				const oldName = this.item?.name;
				await saveItemNote(this.plugin, this.draft, oldName);
				this.refresh();
				this.close();
			}));
	}

	onClose() { this.contentEl.empty(); }
}
