// alchemy-craft-modal.ts
import { App, Modal, Setting } from "obsidian";
import { normalizeName } from "./registry";

export class AlchemyCraftModal extends Modal {
  private ingredient1 = "";
  private ingredient2 = "";
  private ingredient3 = "";

  constructor(
    app: App,
    private onSubmit: (names: [string, string, string]) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Perform Alchemy" });

    let input1: HTMLInputElement;
    let input2: HTMLInputElement;
    let input3: HTMLInputElement;

    new Setting(contentEl)
      .setName("Ingredient 1")
      .addText(text => {
        text.setPlaceholder("e.g. Coal Root")
          .onChange(value => { this.ingredient1 = value; });
        input1 = text.inputEl;
        input1.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient1.trim()) {
            e.preventDefault();
            input2.focus();
          }
        });
      });

    new Setting(contentEl)
      .setName("Ingredient 2")
      .addText(text => {
        text.setPlaceholder("e.g. Common Herb")
          .onChange(value => { this.ingredient2 = value; });
        input2 = text.inputEl;
        input2.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient2.trim()) {
            e.preventDefault();
            input3.focus();
          }
        });
      });

    new Setting(contentEl)
      .setName("Ingredient 3")
      .addText(text => {
        text.setPlaceholder("e.g. Rish Gum")
          .onChange(value => { this.ingredient3 = value; });
        input3 = text.inputEl;
        input3.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient3.trim()) {
            e.preventDefault();
            this.close();
            this.onSubmit([this.ingredient1, this.ingredient2, this.ingredient3]);
          }
        });
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Craft")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit([this.ingredient1, this.ingredient2, this.ingredient3]);
        }));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class AddRecipeModal extends Modal {
  private craftableName = "";
  private ingredient1 = "";
  private ingredient2 = "";
  private ingredient3 = "";

  constructor(
    app: App,
    private onSubmit: (craftableName: string, ingredientNames: [string, string, string]) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Add Recipe" });

    let inputCraftable: HTMLInputElement;
    let input1: HTMLInputElement;
    let input2: HTMLInputElement;
    let input3: HTMLInputElement;

    new Setting(contentEl)
      .setName("Alchemy Craftable")
      .addText(text => {
        text.setPlaceholder("e.g. Healing Potion")
          .onChange(value => { this.craftableName = value; });
        inputCraftable = text.inputEl;
        inputCraftable.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.craftableName.trim()) {
            e.preventDefault();
            input1.focus();
          }
        });
      });

    new Setting(contentEl)
      .setName("Ingredient 1")
      .addText(text => {
        text.setPlaceholder("e.g. Coal Root")
          .onChange(value => { this.ingredient1 = value; });
        input1 = text.inputEl;
        input1.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient1.trim()) {
            e.preventDefault();
            input2.focus();
          }
        });
      });

    new Setting(contentEl)
      .setName("Ingredient 2")
      .addText(text => {
        text.setPlaceholder("e.g. Common Herb")
          .onChange(value => { this.ingredient2 = value; });
        input2 = text.inputEl;
        input2.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient2.trim()) {
            e.preventDefault();
            input3.focus();
          }
        });
      });

    new Setting(contentEl)
      .setName("Ingredient 3")
      .addText(text => {
        text.setPlaceholder("e.g. Rish Gum")
          .onChange(value => { this.ingredient3 = value; });
        input3 = text.inputEl;
        input3.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.ingredient3.trim()) {
            e.preventDefault();
            this.close();
            this.onSubmit(this.craftableName, [this.ingredient1, this.ingredient2, this.ingredient3]);
          }
        });
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Add Recipe")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.craftableName, [this.ingredient1, this.ingredient2, this.ingredient3]);
        }));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
