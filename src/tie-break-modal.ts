// tie-break-modal.ts
import { App, Modal } from "obsidian";

export class TieBreakModal extends Modal {
  constructor(
    app: App,
    private tiedProperties: string[],
    private onChoose: (property: string) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Tie Detected" });
    contentEl.createEl("p", {
      text: "Multiple properties tied for the highest value. Choose which to prioritize:",
    });

    const btnRow = contentEl.createDiv({ cls: "modal-button-container" });
    for (const prop of this.tiedProperties) {
      const label = prop.charAt(0).toUpperCase() + prop.slice(1);
      const btn = btnRow.createEl("button", { text: label });
      btn.style.marginRight = "8px";
      btn.addEventListener("click", () => {
        this.close();
        this.onChoose(prop);
      });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
