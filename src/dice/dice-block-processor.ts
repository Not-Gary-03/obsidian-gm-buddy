import {MarkdownRenderChild, Notice} from 'obsidian';
import GMBuddyPlugin from '../main';
import {DiceMacro, RollResult} from '../types';
import {parseDiceNotation, rollDice} from './parser';
import {parseMacroDefinition} from './macro';

export function registerDiceBlockProcessors(plugin: GMBuddyPlugin): void {
	// ---- dice-macro: define and save a macro ----
	plugin.registerMarkdownCodeBlockProcessor('dice-macro', (source, el, ctx) => {
		try {
			const parsed = parseMacroDefinition(source);
			const existing = plugin.settings.macros.find(m => m.name === parsed.name);
			if (existing) {
				existing.rolls = parsed.rolls;
			} else {
				plugin.settings.macros.push({
					id: crypto.randomUUID(),
					name: parsed.name,
					rolls: parsed.rolls,
				});
			}
			void plugin.saveSettings();

			const container = el.createDiv({cls: 'gm-buddy-macro-def'});
			container.createEl('strong', {text: parsed.name});
			container.createEl('span', {text: ` — ${parsed.rolls.length} roll(s) registered`});
		} catch (e) {
			el.createEl('div', {
				text: `Macro error: ${e instanceof Error ? e.message : String(e)}`,
				cls: 'gm-buddy-error',
			});
		}
	});

	// ---- dice: invoke a macro ----
	plugin.registerMarkdownCodeBlockProcessor('dice', (source, el, ctx) => {
		const macroName = source.trim();
		const macro = plugin.settings.macros.find(m => m.name === macroName);

		if (!macro) {
			el.createEl('div', {
				text: `Macro "${macroName}" not found. Define it with a dice-macro block or in Settings → GM Buddy → Dice macros.`,
				cls: 'gm-buddy-error',
			});
			return;
		}

		const child = new DiceRollRenderChild(el, macro);
		ctx.addChild(child);
	});
}

class DiceRollRenderChild extends MarkdownRenderChild {
	private macro: DiceMacro;
	private resultsEl: HTMLElement;

	constructor(containerEl: HTMLElement, macro: DiceMacro) {
		super(containerEl);
		this.macro = macro;

		const btn = containerEl.createEl('button', {
			text: `Roll: ${macro.name}`,
			cls: 'gm-buddy-dice-btn',
		});

		this.resultsEl = containerEl.createDiv({cls: 'gm-buddy-dice-results'});

		this.registerDomEvent(btn, 'click', () => this.roll());
	}

	private roll() {
		const resultBlock = this.resultsEl.createDiv({cls: 'gm-buddy-dice-result'});

		for (const namedRoll of this.macro.rolls) {
			try {
				const expr = parseDiceNotation(namedRoll.notation);
				const result = rollDice(expr);
				resultBlock.createDiv({text: formatRollResult(namedRoll.label, result)});
			} catch {
				resultBlock.createDiv({
					text: `${namedRoll.label}: invalid notation "${namedRoll.notation}"`,
					cls: 'gm-buddy-error',
				});
			}
		}
	}
}

function formatRollResult(label: string, result: RollResult): string {
	const dice = `${result.expression.raw}`;
	const rolls = `[${result.individualRolls.join(', ')}]`;
	const modStr = result.expression.modifier !== 0
		? ` ${result.expression.modifier > 0 ? '+' : ''}${result.expression.modifier}`
		: '';
	return `${label}: ${result.total} (${dice}) ${rolls}${modStr}`;
}
