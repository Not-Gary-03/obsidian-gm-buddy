import {parseYaml, stringifyYaml, TFile, TFolder} from 'obsidian';
import GMBuddyPlugin from '../main';
import {AlchemyItem, AlchemyType, Ingredient, Rarity} from '../types';

const BASE_PATH = 'GM Buddy/Alchemy';
const INGREDIENTS_PATH = `${BASE_PATH}/Ingredients`;
const ITEMS_PATH = `${BASE_PATH}/Items`;
const INGREDIENT_LIST_PATH = `${BASE_PATH}/Ingredient List.md`;
const ITEM_LIST_PATH = `${BASE_PATH}/Item List.md`;

// ---- Initialization ----

export async function initAlchemyVault(plugin: GMBuddyPlugin): Promise<void> {
	await ensureFolder(plugin, INGREDIENTS_PATH);
	await ensureFolder(plugin, ITEMS_PATH);
	plugin.ingredients = await loadIngredientsFromVault(plugin);
	plugin.alchemyItems = await loadItemsFromVault(plugin);
}

async function ensureFolder(plugin: GMBuddyPlugin, path: string): Promise<void> {
	const parts = path.split('/');
	let current = '';
	for (const part of parts) {
		current = current ? `${current}/${part}` : part;
		if (!plugin.app.vault.getFolderByPath(current)) {
			await plugin.app.vault.createFolder(current);
		}
	}
}

// ---- Loading from vault ----

export async function loadIngredientsFromVault(plugin: GMBuddyPlugin): Promise<Ingredient[]> {
	const folder = plugin.app.vault.getFolderByPath(INGREDIENTS_PATH);
	if (!folder) return [];

	const ingredients: Ingredient[] = [];
	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === 'md') {
			const ingredient = await parseIngredientFile(plugin, child);
			if (ingredient) ingredients.push(ingredient);
		}
	}
	return ingredients.sort((a, b) => a.name.localeCompare(b.name));
}

export async function loadItemsFromVault(plugin: GMBuddyPlugin): Promise<AlchemyItem[]> {
	const folder = plugin.app.vault.getFolderByPath(ITEMS_PATH);
	if (!folder) return [];

	const items: AlchemyItem[] = [];
	for (const child of folder.children) {
		if (child instanceof TFile && child.extension === 'md') {
			const item = await parseItemFile(plugin, child);
			if (item) items.push(item);
		}
	}
	return items.sort((a, b) => a.name.localeCompare(b.name));
}

async function parseIngredientFile(plugin: GMBuddyPlugin, file: TFile): Promise<Ingredient | null> {
	const content = await plugin.app.vault.cachedRead(file);
	const fm = extractFrontmatter(content);
	if (!fm || fm.type !== 'ingredient') return null;

	return {
		name: file.basename,
		rarity: (fm.rarity as Rarity) ?? 'common',
		gpCost: Number(fm.gpCost) || 0,
		alchemical: Number(fm.alchemical) || 0,
		mystical: Number(fm.mystical) || 0,
		divine: Number(fm.divine) || 0,
		description: extractBody(content),
	};
}

async function parseItemFile(plugin: GMBuddyPlugin, file: TFile): Promise<AlchemyItem | null> {
	const content = await plugin.app.vault.cachedRead(file);
	const fm = extractFrontmatter(content);
	if (!fm || fm.type !== 'alchemy-item') return null;

	return {
		name: file.basename,
		rarity: (fm.rarity as Rarity) ?? 'common',
		type: (fm.alchemyType as AlchemyType) ?? 'Alchemical',
		indexMin: Number(fm.indexMin) || 0,
		indexMax: Number(fm.indexMax) || Number(fm.indexMin) || 0,
		gpCost: Number(fm.gpCost) || 0,
		description: extractBody(content),
	};
}

function extractFrontmatter(content: string): Record<string, unknown> | null {
	const match = content.match(/^---\n([\s\S]*?)\n---/);
	if (!match) return null;
	try {
		return parseYaml(match[1]!) as Record<string, unknown>;
	} catch {
		return null;
	}
}

function extractBody(content: string): string {
	const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
	return match ? match[1]!.trim() : content.trim();
}

// ---- Saving notes ----

export async function saveIngredientNote(plugin: GMBuddyPlugin, ingredient: Ingredient, oldName?: string): Promise<void> {
	const fm = stringifyYaml({
		type: 'ingredient',
		rarity: ingredient.rarity,
		gpCost: ingredient.gpCost,
		alchemical: ingredient.alchemical,
		mystical: ingredient.mystical,
		divine: ingredient.divine,
	});
	const noteContent = `---\n${fm}---\n${ingredient.description}`;
	const filePath = `${INGREDIENTS_PATH}/${ingredient.name}.md`;

	if (oldName && oldName !== ingredient.name) {
		const oldFile = plugin.app.vault.getFileByPath(`${INGREDIENTS_PATH}/${oldName}.md`);
		if (oldFile) {
			await plugin.app.vault.rename(oldFile, filePath);
		}
	}

	const existing = plugin.app.vault.getFileByPath(filePath);
	if (existing) {
		await plugin.app.vault.modify(existing, noteContent);
	} else {
		await plugin.app.vault.create(filePath, noteContent);
	}

	plugin.ingredients = await loadIngredientsFromVault(plugin);
	await regenerateListNotes(plugin);
}

export async function saveItemNote(plugin: GMBuddyPlugin, item: AlchemyItem, oldName?: string): Promise<void> {
	const fm = stringifyYaml({
		type: 'alchemy-item',
		rarity: item.rarity,
		alchemyType: item.type,
		indexMin: item.indexMin,
		indexMax: item.indexMax,
		gpCost: item.gpCost,
	});
	const noteContent = `---\n${fm}---\n${item.description}`;
	const filePath = `${ITEMS_PATH}/${item.name}.md`;

	if (oldName && oldName !== item.name) {
		const oldFile = plugin.app.vault.getFileByPath(`${ITEMS_PATH}/${oldName}.md`);
		if (oldFile) {
			await plugin.app.vault.rename(oldFile, filePath);
		}
	}

	const existing = plugin.app.vault.getFileByPath(filePath);
	if (existing) {
		await plugin.app.vault.modify(existing, noteContent);
	} else {
		await plugin.app.vault.create(filePath, noteContent);
	}

	plugin.alchemyItems = await loadItemsFromVault(plugin);
	await regenerateListNotes(plugin);
}

// ---- Deleting notes ----

export async function deleteIngredientNote(plugin: GMBuddyPlugin, name: string): Promise<void> {
	const file = plugin.app.vault.getFileByPath(`${INGREDIENTS_PATH}/${name}.md`);
	if (file) await plugin.app.vault.trash(file, true);
	plugin.ingredients = await loadIngredientsFromVault(plugin);
	await regenerateListNotes(plugin);
}

export async function deleteItemNote(plugin: GMBuddyPlugin, name: string): Promise<void> {
	const file = plugin.app.vault.getFileByPath(`${ITEMS_PATH}/${name}.md`);
	if (file) await plugin.app.vault.trash(file, true);
	plugin.alchemyItems = await loadItemsFromVault(plugin);
	await regenerateListNotes(plugin);
}

// ---- List note generation ----

async function regenerateListNotes(plugin: GMBuddyPlugin): Promise<void> {
	// Ingredient List
	const ingredientLines = ['# Ingredients', ''];
	for (const ing of plugin.ingredients) {
		ingredientLines.push(`- [[${ing.name}]] - ${ing.rarity}, ${ing.gpCost}gp (A:${ing.alchemical} M:${ing.mystical} D:${ing.divine})`);
	}
	await writeOrCreate(plugin, INGREDIENT_LIST_PATH, ingredientLines.join('\n'));

	// Item List
	const itemLines = ['# Alchemy items', ''];
	for (const item of plugin.alchemyItems) {
		const rangeStr = item.indexMin === item.indexMax ? `#${item.indexMin}` : `#${item.indexMin}-${item.indexMax}`;
		itemLines.push(`- [[${item.name}]] — ${item.type} ${rangeStr}, ${item.rarity}, ${item.gpCost}gp`);
	}
	await writeOrCreate(plugin, ITEM_LIST_PATH, itemLines.join('\n'));
}

async function writeOrCreate(plugin: GMBuddyPlugin, path: string, content: string): Promise<void> {
	const existing = plugin.app.vault.getFileByPath(path);
	if (existing) {
		await plugin.app.vault.modify(existing, content);
	} else {
		await plugin.app.vault.create(path, content);
	}
}

// ---- Vault change listeners ----

export function registerAlchemyVaultListeners(plugin: GMBuddyPlugin): void {
	plugin.registerEvent(
		plugin.app.metadataCache.on('changed', async (file) => {
			if (file.path.startsWith(INGREDIENTS_PATH + '/')) {
				plugin.ingredients = await loadIngredientsFromVault(plugin);
			} else if (file.path.startsWith(ITEMS_PATH + '/')) {
				plugin.alchemyItems = await loadItemsFromVault(plugin);
			}
		})
	);

	plugin.registerEvent(
		plugin.app.vault.on('delete', async (file) => {
			if (file.path.startsWith(INGREDIENTS_PATH + '/')) {
				plugin.ingredients = await loadIngredientsFromVault(plugin);
				await regenerateListNotes(plugin);
			} else if (file.path.startsWith(ITEMS_PATH + '/')) {
				plugin.alchemyItems = await loadItemsFromVault(plugin);
				await regenerateListNotes(plugin);
			}
		})
	);
}
