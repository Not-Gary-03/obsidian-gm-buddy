import {DiceMacro, NamedRoll} from '../types';
import {parseDiceNotation} from './parser';

export function parseMacroDefinition(source: string): Omit<DiceMacro, 'id'> {
	const lines = source.split('\n').map(l => l.trim()).filter(Boolean);

	let name = '';
	const rolls: NamedRoll[] = [];
	let inRolls = false;

	for (const line of lines) {
		if (line.toLowerCase().startsWith('name:')) {
			name = line.slice(5).trim();
			inRolls = false;
		} else if (line.toLowerCase().startsWith('rolls:')) {
			inRolls = true;
		} else if (inRolls && line.startsWith('-')) {
			const content = line.slice(1).trim();
			const colonIdx = content.indexOf(':');
			if (colonIdx === -1) {
				throw new Error(`Invalid roll entry: "${line}". Expected "- Label: notation"`);
			}
			const label = content.slice(0, colonIdx).trim();
			const notation = content.slice(colonIdx + 1).trim();
			// Validate notation
			parseDiceNotation(notation);
			rolls.push({label, notation});
		}
	}

	if (!name) {
		throw new Error('Macro definition is missing a "name:" field');
	}
	if (rolls.length === 0) {
		throw new Error('Macro definition has no rolls');
	}

	return {name, rolls};
}
