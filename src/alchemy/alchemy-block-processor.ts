import {MarkdownRenderChild} from 'obsidian';
import GMBuddyPlugin from '../main';
import {combineIngredients, getTiedTypes} from './calculator';
import {pickIngredient, pickTieBreaker} from './ingredient-modal';

export function registerAlchemyBlockProcessor(plugin: GMBuddyPlugin): void {
	plugin.registerMarkdownCodeBlockProcessor('alchemy', (source, el, ctx) => {
		const child = new AlchemyRenderChild(el, plugin);
		ctx.addChild(child);
	});
}

class AlchemyRenderChild extends MarkdownRenderChild {
	private plugin: GMBuddyPlugin;
	private resultsEl: HTMLElement;

	constructor(containerEl: HTMLElement, plugin: GMBuddyPlugin) {
		super(containerEl);
		this.plugin = plugin;

		const btn = containerEl.createEl('button', {
			text: 'Combine ingredients',
			cls: 'gm-buddy-alchemy-btn',
		});

		this.resultsEl = containerEl.createDiv({cls: 'gm-buddy-alchemy-results'});

		this.registerDomEvent(btn, 'click', () => void this.combine());
	}

	private async combine() {
		const {ingredients, alchemyItems} = this.plugin;

		if (ingredients.length === 0) {
			this.resultsEl.setText('No ingredients configured. Add them in Settings → GM Buddy.');
			return;
		}

		const a = await pickIngredient(this.plugin.app, ingredients, 'Choose first ingredient');
		const b = await pickIngredient(this.plugin.app, ingredients, 'Choose second ingredient');
		const c = await pickIngredient(this.plugin.app, ingredients, 'Choose third ingredient');

		const tiedTypes = getTiedTypes(a, b, c);
		let chosenType = tiedTypes[0]!;
		if (tiedTypes.length > 1) {
			chosenType = await pickTieBreaker(this.plugin.app, tiedTypes);
		}

		const result = combineIngredients(a, b, c, alchemyItems, chosenType);

		const resultBlock = this.resultsEl.createDiv({cls: 'gm-buddy-alchemy-result'});
		if (result.item) {
			resultBlock.setText(
				`${result.resultType} result of combining ${a.name}, ${b.name}, and ${c.name}: ${result.item.description}`
			);
		} else {
			resultBlock.setText(
				`${result.resultType} result of combining ${a.name}, ${b.name}, and ${c.name}: No item found at index ${result.resultIndex}.`
			);
		}
	}
}
