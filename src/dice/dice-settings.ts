import {Modal, Setting} from 'obsidian';
import GMBuddyPlugin from '../main';
import {DiceMacro, NamedRoll} from '../types';
import {parseDiceNotation} from './parser';

export function renderDiceSettings(
	containerEl: HTMLElement,
	plugin: GMBuddyPlugin,
	refresh: () => void
): void {
	new Setting(containerEl).setName('Dice macros').setHeading();

	for (const macro of plugin.settings.macros) {
		const rollSummary = macro.rolls.map(r => `${r.label}: ${r.notation}`).join(', ');

		new Setting(containerEl)
			.setName(macro.name)
			.setDesc(rollSummary)
			.addButton(btn => btn
				.setButtonText('Edit')
				.onClick(() => {
					new MacroEditModal(plugin, macro, refresh).open();
				}))
			.addButton(btn => btn
				.setButtonText('Delete')
				.setWarning()
				.onClick(async () => {
					plugin.settings.macros = plugin.settings.macros.filter(m => m.id !== macro.id);
					await plugin.saveSettings();
					refresh();
				}));
	}

	new Setting(containerEl)
		.addButton(btn => btn
			.setButtonText('Add macro')
			.setCta()
			.onClick(() => {
				new MacroEditModal(plugin, null, refresh).open();
			}));
}

class MacroEditModal extends Modal {
	private plugin: GMBuddyPlugin;
	private macro: DiceMacro | null;
	private refresh: () => void;
	private name: string;
	private rolls: NamedRoll[];

	constructor(plugin: GMBuddyPlugin, macro: DiceMacro | null, refresh: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.macro = macro;
		this.refresh = refresh;
		this.name = macro?.name ?? '';
		this.rolls = macro ? [...macro.rolls.map(r => ({...r}))] : [{label: '', notation: ''}];
	}

	onOpen() {
		this.rebuild();
	}

	private rebuild() {
		const {contentEl} = this;
		contentEl.empty();
		this.setTitle(this.macro ? 'Edit macro' : 'New macro');

		new Setting(contentEl)
			.setName('Macro name')
			.addText(text => text
				.setValue(this.name)
				.setPlaceholder('e.g. Goblin Attack')
				.onChange(value => { this.name = value; }));

		for (let i = 0; i < this.rolls.length; i++) {
			const roll = this.rolls[i]!;
			new Setting(contentEl)
				.setName(`Roll ${i + 1}`)
				.addText(text => text
					.setValue(roll.label)
					.setPlaceholder('Label')
					.onChange(value => { roll.label = value; }))
				.addText(text => text
					.setValue(roll.notation)
					.setPlaceholder('e.g. 1d20+4')
					.onChange(value => { roll.notation = value; }))
				.addButton(btn => btn
					.setButtonText('Remove')
					.setWarning()
					.onClick(() => {
						this.rolls.splice(i, 1);
						if (this.rolls.length === 0) {
							this.rolls.push({label: '', notation: ''});
						}
						this.rebuild();
					}));
		}

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Add roll')
				.onClick(() => {
					this.rolls.push({label: '', notation: ''});
					this.rebuild();
				}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Save')
				.setCta()
				.onClick(async () => {
					if (!this.validateAndSave()) return;
					this.close();
				}));
	}

	private validateAndSave(): boolean {
		if (!this.name.trim()) return false;

		const validRolls: NamedRoll[] = [];
		for (const roll of this.rolls) {
			if (!roll.label.trim() || !roll.notation.trim()) continue;
			try {
				parseDiceNotation(roll.notation);
			} catch {
				return false;
			}
			validRolls.push({label: roll.label.trim(), notation: roll.notation.trim()});
		}
		if (validRolls.length === 0) return false;

		if (this.macro) {
			this.macro.name = this.name.trim();
			this.macro.rolls = validRolls;
		} else {
			const newMacro: DiceMacro = {
				id: crypto.randomUUID(),
				name: this.name.trim(),
				rolls: validRolls,
			};
			this.plugin.settings.macros.push(newMacro);
		}

		void this.plugin.saveSettings().then(() => this.refresh());
		return true;
	}

	onClose() {
		this.contentEl.empty();
	}
}
