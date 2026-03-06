import {App, FuzzySuggestModal, SuggestModal} from 'obsidian';
import {AlchemyType, Ingredient} from '../types';

export class IngredientSelectModal extends FuzzySuggestModal<Ingredient> {
	private ingredients: Ingredient[];
	private onChoose: (ingredient: Ingredient) => void;

	constructor(app: App, ingredients: Ingredient[], placeholder: string, onChoose: (ingredient: Ingredient) => void) {
		super(app);
		this.ingredients = ingredients;
		this.onChoose = onChoose;
		this.setPlaceholder(placeholder);
	}

	getItems(): Ingredient[] {
		return this.ingredients;
	}

	getItemText(item: Ingredient): string {
		return item.name;
	}

	onChooseItem(item: Ingredient): void {
		this.onChoose(item);
	}
}

export class TieBreakerModal extends SuggestModal<AlchemyType> {
	private types: AlchemyType[];
	private onChoose: (type: AlchemyType) => void;

	constructor(app: App, types: AlchemyType[], onChoose: (type: AlchemyType) => void) {
		super(app);
		this.types = types;
		this.onChoose = onChoose;
		this.setPlaceholder('Properties are tied. Choose which to prioritize.');
	}

	getSuggestions(): AlchemyType[] {
		return this.types;
	}

	renderSuggestion(value: AlchemyType, el: HTMLElement): void {
		el.setText(value);
	}

	onChooseSuggestion(item: AlchemyType): void {
		this.onChoose(item);
	}
}

export function pickIngredient(app: App, ingredients: Ingredient[], prompt: string): Promise<Ingredient> {
	return new Promise((resolve) => {
		new IngredientSelectModal(app, ingredients, prompt, resolve).open();
	});
}

export function pickTieBreaker(app: App, types: AlchemyType[]): Promise<AlchemyType> {
	return new Promise((resolve) => {
		new TieBreakerModal(app, types, resolve).open();
	});
}
