// list-notes.ts
import { App, TFile, normalizePath } from "obsidian";
import { ItemRegistry } from "./registry";
import { GMBuddySettings } from "./settings";

export class ListNoteManager {
  constructor(
    private app: App,
    private registry: ItemRegistry,
    private settings: GMBuddySettings
  ) {}

  async rebuildIngredientList(): Promise<void> {
    const ingredients = this.registry.getIngredients()
      .sort((a, b) => a.name.localeCompare(b.name));

    const lines = [
      "# Ingredient List",
      "",
      `*${ingredients.length} ingredient${ingredients.length !== 1 ? "s" : ""}*`,
      "",
    ];

    for (const ing of ingredients) {
      lines.push(
        `- [[${ing.name}]] — Rarity: ${ing.rarity} | Cost: ${ing.cost}g` +
        ` | Alchemical: ${ing.alchemical} | Mystical: ${ing.mystical} | Divine: ${ing.divine}`
      );
    }

    await this.writeNote(this.settings.ingredientListNote, lines.join("\n"));
  }

  async rebuildAlchemyList(): Promise<void> {
    const craftables = this.registry.getAlchemyCraftables()
      .sort((a, b) => a.name.localeCompare(b.name));

    const lines = [
      "# Alchemy Craftable List",
      "",
      `*${craftables.length} craftable${craftables.length !== 1 ? "s" : ""}*`,
      "",
    ];

    for (const item of craftables) {
      lines.push(
        `- [[${item.name}]] — Rarity: ${item.rarity} | Cost: ${item.cost}g` +
        ` | Property: ${item.typeProperty} | Value: ${item.typeValue}`
      );
    }

    await this.writeNote(this.settings.alchemyListNote, lines.join("\n"));
  }

  private async writeNote(notePath: string, content: string): Promise<void> {
    const path = normalizePath(`${notePath}.md`);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
    } else {
      const folderPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
      if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }
      await this.app.vault.create(path, content);
    }
  }
}
