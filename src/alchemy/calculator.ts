import {AlchemyItem, AlchemyResult, AlchemyType, Ingredient} from '../types';

export function combineIngredients(
	a: Ingredient,
	b: Ingredient,
	c: Ingredient,
	items: AlchemyItem[],
	chosenType?: AlchemyType
): AlchemyResult {
	const sums = {
		alchemical: a.alchemical + b.alchemical + c.alchemical,
		mystical: a.mystical + b.mystical + c.mystical,
		divine: a.divine + b.divine + c.divine,
	};

	const max = Math.max(sums.alchemical, sums.mystical, sums.divine);
	const tiedTypes: AlchemyType[] = [];
	if (sums.alchemical === max) tiedTypes.push('Alchemical');
	if (sums.mystical === max) tiedTypes.push('Mystical');
	if (sums.divine === max) tiedTypes.push('Divine');

	const resultType = chosenType ?? tiedTypes[0]!;
	const resultIndex = max;

	const item = items.find(i => i.type === resultType && i.indexMin <= resultIndex && resultIndex <= i.indexMax) ?? null;

	return {
		ingredients: [a, b, c],
		sums,
		resultType,
		resultIndex,
		item,
	};
}

export function getTiedTypes(a: Ingredient, b: Ingredient, c: Ingredient): AlchemyType[] {
	const sums = {
		alchemical: a.alchemical + b.alchemical + c.alchemical,
		mystical: a.mystical + b.mystical + c.mystical,
		divine: a.divine + b.divine + c.divine,
	};

	const max = Math.max(sums.alchemical, sums.mystical, sums.divine);
	const tiedTypes: AlchemyType[] = [];
	if (sums.alchemical === max) tiedTypes.push('Alchemical');
	if (sums.mystical === max) tiedTypes.push('Mystical');
	if (sums.divine === max) tiedTypes.push('Divine');

	return tiedTypes;
}
