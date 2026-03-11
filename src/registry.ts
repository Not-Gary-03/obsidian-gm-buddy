// registry.ts
import { TFile, App } from "obsidian";
import { Ingredient, AlchemyCraftable, EquipmentCraftable } from "./models";

export class ItemRegistry {
  private ingredients: Map<string, Ingredient> = new Map();
  private alchemyCraftables: Map<string, AlchemyCraftable> = new Map();
  private equipmentCraftables: Map<string, EquipmentCraftable> = new Map();

  // Folder paths (configurable in plugin settings)
  static FOLDERS = {
    ingredient: "Crafting/Ingredients",
    alchemy_craftable: "Crafting/Alchemy",
    equipment_craftable: "Crafting/Equipment",
  };

  constructor(private app: App) {}

  /** Call once on plugin load — full vault scan */
  async initialize(): Promise<void> {
    const { vault, metadataCache } = this.app;

    for (const [, folder] of Object.entries(ItemRegistry.FOLDERS)) {
      const files = vault.getFiles().filter(
        (f) => f.path.startsWith(folder) && f.extension === "md"
      );
      for (const file of files) {
        this.indexFile(file);
      }
    }

    // Live sync: re-index whenever frontmatter changes
    metadataCache.on("changed", (file) => this.indexFile(file));
    vault.on("delete", (file) => {
      if (file instanceof TFile) this.removeFile(file);
    });
    vault.on("rename", (file, oldPath) => {
      this.removeByPath(oldPath);
      if (file instanceof TFile) this.indexFile(file);
    });
  }

  /** Parse frontmatter and insert into the right map */
  private indexFile(file: TFile): void {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm?.typeItem || !fm?.nameNormalized) return;

    switch (fm.typeItem) {
      case "ingredient":
        this.ingredients.set(fm.nameNormalized, {
          nameNormalized: fm.nameNormalized,
          name: fm.name,
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          rarity: fm.rarity ?? 0,
          cost: fm.cost ?? 0,
          alchemical: fm.alchemical ?? 0,
          mystical: fm.mystical ?? 0,
          divine: fm.divine ?? 0,
        });
        break;
      case "alchemy_craftable":
        this.alchemyCraftables.set(fm.nameNormalized, {
          nameNormalized: fm.nameNormalized,
          name: fm.name,
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          typeProperty: fm.typeProperty ?? 0,
          typeValue: fm.typeValue ?? 0,
          rarity: fm.rarity ?? 0,
          cost: fm.cost ?? 0,
          recipes: fm.recipes ?? [],
        });
        break;
      case "equipment_craftable":
        this.equipmentCraftables.set(fm.nameNormalized, {
          nameNormalized: fm.nameNormalized,
          name: fm.name,
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          rarity: fm.rarity ?? 0,
          cost: fm.cost ?? 0,
          recipes: fm.recipes ?? [],
        });
        break;
    }
  }

  private removeFile(file: TFile): void {
    this.removeByPath(file.path);
  }

  private removeByPath(path: string): void {
    for (const [typeItem, folder] of Object.entries(ItemRegistry.FOLDERS)) {
      if (path.startsWith(folder)) {
        const name = path.split("/").pop()?.replace(".md", "") ?? "";
        if (typeItem === "ingredient") this.ingredients.delete(name);
        if (typeItem === "alchemy_craftable") this.alchemyCraftables.delete(name);
        if (typeItem === "equipment_craftable") this.equipmentCraftables.delete(name);
      }
    }
  }

  // --- Public accessors ---
  getIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values());
  }
  getIngredient(nameNormalized: string): Ingredient | undefined {
    return this.ingredients.get(nameNormalized);
  }
  getAlchemyCraftables(): AlchemyCraftable[] {
    return Array.from(this.alchemyCraftables.values());
  }
  getEquipmentCraftables(): EquipmentCraftable[] {
    return Array.from(this.equipmentCraftables.values());
  }

  /** The lookup your crafting function needs */
  findAlchemyByPropertyAndValue(
    typeProperty: number,
    typeValue: number
  ): AlchemyCraftable | undefined {
    return Array.from(this.alchemyCraftables.values()).find(
      (c) => c.typeProperty === typeProperty && c.typeValue === typeValue
    );
  }
}
