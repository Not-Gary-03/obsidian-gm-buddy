import {App, Modal, Setting} from 'obsidian';

export class HitPointListModal extends Modal {
	private name = '';
	private quantity = '';
	private hitPoints = '';
	private onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;
		this.setTitle('Insert hit point list');

		let quantityInput: HTMLInputElement;
		let hpInput: HTMLInputElement;

		new Setting(contentEl)
			.setName('Name')
			.addText(text => {
				text.setPlaceholder('e.g. Goblin')
					.onChange(value => { this.name = value; });
				const input = text.inputEl;
				input.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter' && this.name.trim()) {
						e.preventDefault();
						quantityInput.focus();
					}
				});
				// Auto-focus the name field
				setTimeout(() => input.focus(), 10);
			});

		new Setting(contentEl)
			.setName('Quantity')
			.addText(text => {
				text.setPlaceholder('e.g. 5')
					.onChange(value => { this.quantity = value; });
				quantityInput = text.inputEl;
				quantityInput.type = 'number';
				quantityInput.min = '1';
				quantityInput.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter' && this.quantity.trim()) {
						e.preventDefault();
						hpInput.focus();
					}
				});
			});

		new Setting(contentEl)
			.setName('Hit Points')
			.addText(text => {
				text.setPlaceholder('e.g. 14')
					.onChange(value => { this.hitPoints = value; });
				hpInput = text.inputEl;
				hpInput.type = 'number';
				hpInput.min = '0';
				hpInput.addEventListener('keydown', (e: KeyboardEvent) => {
					if (e.key === 'Enter' && this.hitPoints.trim()) {
						e.preventDefault();
						this.submit();
					}
				});
			});
	}

	private submit() {
		const qty = parseInt(this.quantity);
		const hp = parseInt(this.hitPoints);
		if (!this.name.trim() || isNaN(qty) || qty < 1 || isNaN(hp)) return;

		const lines: string[] = [];
		for (let i = 1; i <= qty; i++) {
			lines.push(`${this.name}${i}: ${hp}`);
		}
		this.onSubmit(lines.join('\n'));
		this.close();
	}

	onClose() {
		this.contentEl.empty();
	}
}
