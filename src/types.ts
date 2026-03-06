// ---- Dice types ----

export interface DiceExpression {
	count: number;
	sides: number;
	modifier: number;
	raw: string;
}

export interface RollResult {
	expression: DiceExpression;
	individualRolls: number[];
	subtotal: number;
	total: number;
}

export interface NamedRoll {
	label: string;
	notation: string;
}

export interface DiceMacro {
	id: string;
	name: string;
	rolls: NamedRoll[];
}

// ---- Alchemy types ----

export type Rarity = 'common' | 'uncommon' | 'rare' | 'very rare';
export type AlchemyType = 'Alchemical' | 'Mystical' | 'Divine';

export interface Ingredient {
	name: string;
	rarity: Rarity;
	gpCost: number;
	alchemical: number;
	mystical: number;
	divine: number;
	description: string;
}

export interface AlchemyItem {
	name: string;
	rarity: Rarity;
	type: AlchemyType;
	indexMin: number;
	indexMax: number;
	gpCost: number;
	description: string;
}

export interface AlchemyResult {
	ingredients: [Ingredient, Ingredient, Ingredient];
	sums: { alchemical: number; mystical: number; divine: number };
	resultType: AlchemyType;
	resultIndex: number;
	item: AlchemyItem | null;
}
