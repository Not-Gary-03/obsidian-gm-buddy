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
    const rarityOrder: Record<string, number> = { common: 0, uncommon: 1, rare: 2 };
    const ingredients = this.registry.getIngredients()
      .sort((a, b) => {
        const rarityDiff = (rarityOrder[a.rarity] ?? 99) - (rarityOrder[b.rarity] ?? 99);
        if (rarityDiff !== 0) return rarityDiff;
        const aMax = Math.max(a.alchemical, a.mystical, a.divine);
        const bMax = Math.max(b.alchemical, b.mystical, b.divine);
        if (aMax !== bMax) return aMax - bMax;
        if (a.cost !== b.cost) return a.cost - b.cost;
        return a.name.localeCompare(b.name);
      });

    const lines = [
      `*${ingredients.length} ingredient${ingredients.length !== 1 ? "s" : ""}*`,
      "",
    ];

    lines.push(`| **Name** | *Rarity* | Cost | Alc | Mys | Div |\n` +
               `|----------|----------|------|-----|-----|-----|`);
    for (const ing of ingredients) {
      lines.push(
        `| [[${ing.name}]] | *${ing.rarity}* | ${ing.cost} **GP**` +
        `| **${ing.alchemical}** | **${ing.mystical}** | **${ing.divine}** |`
      );
    }

    await this.writeNote(this.settings.ingredientListNote, lines.join("\n"));
  }

  async rebuildAlchemyList(): Promise<void> {
    const propertyOrder: Record<string, number> = { alchemical: 0, mystical: 1, divine: 2, unique: 3 };
    const craftables = this.registry.getAlchemyCraftables()
      .sort((a, b) => {
        const propDiff = (propertyOrder[a.typeProperty] ?? 99) - (propertyOrder[b.typeProperty] ?? 99);
        if (propDiff !== 0) return propDiff;
        return a.typeIndexMax - b.typeIndexMax;
      });

    const lines = [
      `*${craftables.length} craftable${craftables.length !== 1 ? "s" : ""}*`,
      "",
    ];

    lines.push(`| **Name** | *Rarity* | Cost | Type | Index |\n` +
               `|----------|----------|------|------|-------|`);
    for (const item of craftables) {
      lines.push(
        `| [[${item.name}]] | *${item.rarity}* | ${item.cost} **GP**` +
        `| ${item.typeProperty} | ${item.typeIndexMin > 0 && item.typeIndexMin < item.typeIndexMax ? "***" + item.typeIndexMin + "*** - " : ""}` +
                                 `${item.typeIndexMax > 0 ? "***" + item.typeIndexMax + "***" : ""} |`
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
