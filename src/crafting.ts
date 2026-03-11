// crafting.ts
import { App, TFile } from "obsidian";
import { Ingredient, AlchemyCraftable } from "./models";
import { ItemRegistry } from "./registry";

export class CraftingEngine {
  constructor(
    private registry: ItemRegistry,
    private app: App
  ) {}

  /**
   * Takes a list of ingredient names, computes the result,
   * finds the matching craftable, and appends output to a note.
   */
  async craft(
    ingredientNames: string[],
    outputNotePath: string
  ): Promise<AlchemyCraftable | null> {
    // 1. Gather ingredients from registry
    const ingredients = ingredientNames
      .map((n) => this.registry.getIngredient(n))
      .filter((i): i is Ingredient => i !== undefined);

    if (ingredients.length === 0) return null;

    // 2. Perform your calculation
    //    (placeholder — replace with actual Nimble alchemy rules)
    const totalAlchemical = ingredients.reduce((s, i) => s + i.alchemical, 0);
    const totalMystical = ingredients.reduce((s, i) => s + i.mystical, 0);
    const totalDivine = ingredients.reduce((s, i) => s + i.divine, 0);

    // Determine which property dominates and its value
    const properties = { alchemical: totalAlchemical, mystical: totalMystical, divine: totalDivine };
    const sorted = Object.entries(properties).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0) return null;
    const dominantProperty = sorted[0][0];
    const resultValue = sorted[0][1];

    // 3. Look up the matching craftable
    const result = this.registry.findAlchemyByPropertyAndValue(
      dominantProperty,
      resultValue
    );
    if (!result) return null;

    // 4. Append result block to the output note
    const outputBlock = [
      "",
      "---",
      `## Crafting Result: ${result.name}`,
      "",
      `**Rarity:** ${result.rarity} · **Cost:** ${result.cost}g`,
      `**Property:** ${result.typeProperty} · **Value:** ${result.typeValue}`,
      "",
      result.description,
      "",
    ].join("\n");

    const outputFile = this.app.vault.getAbstractFileByPath(outputNotePath);
    if (outputFile instanceof TFile) {
      const existing = await this.app.vault.read(outputFile);
      await this.app.vault.modify(outputFile, existing + outputBlock);
    }

    return result;
  }
}
