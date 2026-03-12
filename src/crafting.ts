// crafting.ts
import { App, Notice, TFile, normalizePath } from "obsidian";
import { Ingredient } from "./models";
import { ItemRegistry } from "./registry";
import { AlchemyCraftModal } from "./alchemy-craft-modal";
import { TieBreakModal } from "./tie-break-modal";
import { GMBuddySettings } from "./settings";

export class CraftingEngine {
  constructor(
    private registry: ItemRegistry,
    private app: App,
    private settings: GMBuddySettings
  ) {}

  openCraftingModal(): void {
    new AlchemyCraftModal(this.app, (rawNames) => {
      void this.performCraft(rawNames);
    }).open();
  }

  private async performCraft(rawNames: [string, string, string]): Promise<void> {
    // 1. Normalize (strip all spaces and special characters, lowercase) and look up ingredients
    const ingredients: Ingredient[] = [];
    for (const raw of rawNames) {
      const ing = this.registry.getIngredientByInput(raw);
      if (!ing) {
        new Notice(`Crafting failed: ingredient "${raw.trim()}" not found.`);
        return;
      }
      ingredients.push(ing);
    }

    // 2. Sum properties
    const totalAlchemical = ingredients.reduce((s, i) => s + i.alchemical, 0);
    const totalMystical = ingredients.reduce((s, i) => s + i.mystical, 0);
    const totalDivine = ingredients.reduce((s, i) => s + i.divine, 0);

    const properties: Record<string, number> = {
      alchemical: totalAlchemical,
      mystical: totalMystical,
      divine: totalDivine,
    };

    const sorted = Object.entries(properties).sort((a, b) => b[1] - a[1]);
    const top = sorted[0];
    if (!top) return;

    const maxVal = top[1];
    const ties = sorted.filter(([, v]) => v === maxVal).map(([k]) => k);

    if (ties.length > 1) {
      // 3a. Tie — ask user to choose
      new TieBreakModal(this.app, ties, (chosen) => {
        void this.finalizeCraft(chosen, properties[chosen] ?? 0, ingredients);
      }).open();
    } else {
      // 3b. No tie
      await this.finalizeCraft(top[0], maxVal, ingredients);
    }
  }

  private async finalizeCraft(
    dominantProperty: string,
    totalValue: number,
    ingredients: Ingredient[]
  ): Promise<void> {
    // 4. Find matching craftable by dominant property name and total value
    const result = this.registry.findAlchemyByPropertyAndValue(dominantProperty, totalValue);
    if (!result) {
      new Notice(`No alchemy craftable found for ${dominantProperty} value ${totalValue}.`);
      return;
    }

    // 5. Build output block
    const [ing1, ing2, ing3] = ingredients;
    const ingredientList = `${ing1?.name ?? ""}, ${ing2?.name ?? ""}, and ${ing3?.name ?? ""}`;
    const propDisplay = dominantProperty.charAt(0).toUpperCase() + dominantProperty.slice(1);

    const outputBlock = [
      `#### ${result.name}`,
      `${propDisplay} result of combining ${ingredientList}:`,
      "",
      `*(${result.rarity})* | **Cost: ${result.cost}**`,
      result.description,
      "",
      "___",
      "",
    ].join("\n");

    // 6. Prepend to crafting output note
    const path = normalizePath(`${this.settings.craftingOutputNote}.md`);
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const existing = await this.app.vault.read(file);
      await this.app.vault.modify(file, outputBlock + "\n" + existing);
    } else {
      const folderPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
      if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }
      await this.app.vault.create(path, outputBlock);
    }

    new Notice(`Crafted: ${result.name}`);
  }
}
