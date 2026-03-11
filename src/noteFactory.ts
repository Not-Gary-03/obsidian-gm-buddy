// noteFactory.ts
import { App, TFile, normalizePath } from "obsidian";
import { Ingredient, AlchemyCraftable, EquipmentCraftable } from "./models";
import { ItemRegistry } from "./registry";

export class NoteFactory {
  constructor(private app: App) {}

  renderIngredientBody(data: Partial<Ingredient>): string {
    return [
      `# ${data.name ?? "New Ingredient"}`,
      "",
      `**Rarity:** ${data.rarity ?? "n/a"} · **Cost:** ${data.cost ?? 0}g`,
      "",
      "| Alchemical | Mystical | Divine |",
      "|------------|----------|--------|",
      `| ${data.alchemical ?? 0} | ${data.mystical ?? 0} | ${data.divine ?? 0} |`,
      "",
      data.description ?? "",
    ].join("\n");
  }

  renderAlchemyBody(data: Partial<AlchemyCraftable>): string {
    const recipeLines = (data.recipes ?? []).map((r) =>
      r.split(",").map((name) => `[[${name.trim()}]]`).join(" + ")
    );
    return [
      `# ${data.name ?? "New Alchemy Craftable"}`,
      "",
      `**Rarity:** ${data.rarity ?? "n/a"} · **Cost:** ${data.cost ?? 0}g`,
      `**Property:** ${data.typeProperty ?? "n/a"} · **Value:** ${data.typeValue ?? 0}`,
      "",
      "## Recipes",
      ...recipeLines.map((l) => `- ${l}`),
      "",
      data.description ?? "",
    ].join("\n");
  }

  renderEquipmentBody(data: Partial<EquipmentCraftable>): string {
    const recipeLines = (data.recipes ?? []).map((r) =>
      r.split(",").map((name) => `[[${name.trim()}]]`).join(" + ")
    );
    return [
      `# ${data.name ?? "New Equipment Craftable"}`,
      "",
      `**Rarity:** ${data.rarity ?? "n/a"} · **Cost:** ${data.cost ?? 0}g`,
      "",
      "## Recipes",
      ...recipeLines.map((l) => `- ${l}`),
      "",
      data.description ?? "",
    ].join("\n");
  }

  async createIngredient(data: Partial<Ingredient>): Promise<TFile> {
    const normalized = data.nameNormalized
      ?? data.name?.toLowerCase().replace(/\s+/g, "_") ?? "unnamed";
    const folder = ItemRegistry.FOLDERS.ingredient;
    const path = normalizePath(`${folder}/${normalized}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      nameNormalized: normalized,
      name: data.name ?? "New Ingredient",
      description: data.description ?? "",
      typeItem: "ingredient",
      rarity: data.rarity ?? "n/a",
      cost: data.cost ?? 0,
      alchemical: data.alchemical ?? 0,
      mystical: data.mystical ?? 0,
      divine: data.divine ?? 0,
    });

    const body = this.renderIngredientBody(data);
    return await this.app.vault.create(path, `${frontmatter}\n${body}`);
  }

  async createAlchemyCraftable(data: Partial<AlchemyCraftable>): Promise<TFile> {
    const normalized = data.nameNormalized
      ?? data.name?.toLowerCase().replace(/\s+/g, "_") ?? "unnamed";
    const folder = ItemRegistry.FOLDERS.alchemy_craftable;
    const path = normalizePath(`${folder}/${normalized}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      nameNormalized: normalized,
      name: data.name ?? "New Alchemy Craftable",
      description: data.description ?? "",
      typeItem: "alchemy_craftable",
      typeProperty: data.typeProperty ?? "n/a",
      typeValue: data.typeValue ?? 0,
      rarity: data.rarity ?? "n/a",
      cost: data.cost ?? 0,
      recipes: data.recipes ?? [],
    });

    const body = this.renderAlchemyBody(data);
    return await this.app.vault.create(path, `${frontmatter}\n${body}`);
  }

  async createEquipmentCraftable(data: Partial<EquipmentCraftable>): Promise<TFile> {
    const normalized = data.nameNormalized
      ?? data.name?.toLowerCase().replace(/\s+/g, "_") ?? "unnamed";
    const folder = ItemRegistry.FOLDERS.equipment_craftable;
    const path = normalizePath(`${folder}/${normalized}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      nameNormalized: normalized,
      name: data.name ?? "New Equipment Craftable",
      description: data.description ?? "",
      typeItem: "equipment_craftable",
      rarity: data.rarity ?? "n/a",
      cost: data.cost ?? 0,
      recipes: data.recipes ?? [],
    });

    const body = this.renderEquipmentBody(data);
    return await this.app.vault.create(path, `${frontmatter}\n${body}`);
  }

  private buildFrontmatter(data: Record<string, unknown>): string {
    const lines = ["---"];
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach((v) => lines.push(`  - "${v}"`));
      } else if (typeof value === "string") {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    lines.push("---");
    return lines.join("\n");
  }

  private async ensureFolder(path: string): Promise<void> {
    if (!this.app.vault.getAbstractFileByPath(path)) {
      await this.app.vault.createFolder(path);
    }
  }
}
