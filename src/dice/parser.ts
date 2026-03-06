import {DiceExpression, RollResult} from '../types';

const DICE_REGEX = /^(\d+)?d(\d+)([+-]\d+)?$/i;

export function parseDiceNotation(notation: string): DiceExpression {
	const trimmed = notation.trim().replace(/\s/g, '');
	const match = trimmed.match(DICE_REGEX);
	if (!match) {
		throw new Error(`Invalid dice notation: "${notation}"`);
	}

	return {
		count: match[1] ? parseInt(match[1]) : 1,
		sides: parseInt(match[2]!),
		modifier: match[3] ? parseInt(match[3]) : 0,
		raw: trimmed,
	};
}

export function rollDice(expr: DiceExpression): RollResult {
	const individualRolls: number[] = [];
	for (let i = 0; i < expr.count; i++) {
		individualRolls.push(Math.floor(Math.random() * expr.sides) + 1);
	}
	const subtotal = individualRolls.reduce((a, b) => a + b, 0);
	return {
		expression: expr,
		individualRolls,
		subtotal,
		total: subtotal + expr.modifier,
	};
}
