// registry.ts
import { TFile, App } from "obsidian";
import { Ingredient, AlchemyCraftable, EquipmentCraftable } from "./models";

/** Shared normalization: lowercase, strip all non-alphanumeric characters. */
export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export class ItemRegistry {
  private ingredients: Map<string, Ingredient> = new Map();
  private alchemyCraftables: Map<string, AlchemyCraftable> = new Map();
  private equipmentCraftables: Map<string, EquipmentCraftable> = new Map();

  private updateCallback: (() => void) | null = null;
  private initializing = false;

  static FOLDERS = {
    ingredient: "Crafting/Ingredients",
    alchemy_craftable: "Crafting/Alchemy",
    equipment_craftable: "Crafting/Equipment",
  };

  constructor(private app: App) {}

  setUpdateCallback(cb: () => void): void {
    this.updateCallback = cb;
  }

  /** Call once on plugin load — full vault scan */
  async initialize(): Promise<void> {
    const { vault, metadataCache } = this.app;

    this.initializing = true;
    for (const [, folder] of Object.entries(ItemRegistry.FOLDERS)) {
      const files = vault.getFiles().filter(
        (f) => f.path.startsWith(folder) && f.extension === "md"
      );
      for (const file of files) {
        this.indexFile(file);
      }
    }
    this.initializing = false;

    // Fire once after full initial scan
    this.updateCallback?.();

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

    // Always normalize the key on the way in so lookups are consistent
    const key = normalizeName(String(fm.nameNormalized));

    switch (fm.typeItem) {
      case "ingredient":
        this.ingredients.set(key, {
          nameNormalized: key,
          name: fm.name ?? "",
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          rarity: fm.rarity ?? "",
          cost: fm.cost ?? 0,
          alchemical: fm.alchemical ?? 0,
          mystical: fm.mystical ?? 0,
          divine: fm.divine ?? 0,
        });
        break;
      case "alchemy_craftable":
        this.alchemyCraftables.set(key, {
          nameNormalized: key,
          name: fm.name ?? "",
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          typeProperty: fm.typeProperty ?? "",
          typeValue: fm.typeValue ?? 0,
          rarity: fm.rarity ?? "",
          cost: fm.cost ?? 0,
          recipes: fm.recipes ?? [],
        });
        break;
      case "equipment_craftable":
        this.equipmentCraftables.set(key, {
          nameNormalized: key,
          name: fm.name ?? "",
          description: fm.description ?? "",
          typeItem: fm.typeItem,
          rarity: fm.rarity ?? "",
          cost: fm.cost ?? 0,
          recipes: fm.recipes ?? [],
        });
        break;
      default:
        return;
    }

    if (!this.initializing) {
      this.updateCallback?.();
    }
  }

  private removeFile(file: TFile): void {
    this.removeByPath(file.path);
  }

  private removeByPath(path: string): void {
    for (const [typeItem, folder] of Object.entries(ItemRegistry.FOLDERS)) {
      if (path.startsWith(folder)) {
        const raw = path.split("/").pop()?.replace(".md", "") ?? "";
        const key = normalizeName(raw);
        if (typeItem === "ingredient") this.ingredients.delete(key);
        if (typeItem === "alchemy_craftable") this.alchemyCraftables.delete(key);
        if (typeItem === "equipment_craftable") this.equipmentCraftables.delete(key);
      }
    }
    this.updateCallback?.();
  }

  // --- Public accessors ---
  getIngredients(): Ingredient[] {
    return Array.from(this.ingredients.values());
  }
  getIngredient(nameNormalized: string): Ingredient | undefined {
    return this.ingredients.get(normalizeName(nameNormalized));
  }

  /** Looks up an ingredient from raw user input by normalizing both sides. */
  getIngredientByInput(input: string): Ingredient | undefined {
    const needle = normalizeName(input);
    return Array.from(this.ingredients.values()).find(
      (ing) => normalizeName(ing.nameNormalized) === needle
    );
  }
  getAlchemyCraftables(): AlchemyCraftable[] {
    return Array.from(this.alchemyCraftables.values());
  }
  getEquipmentCraftables(): EquipmentCraftable[] {
    return Array.from(this.equipmentCraftables.values());
  }

  /** Looks up an alchemy craftable from raw user input by normalizing the input and using it as the map key. */
  getAlchemyCraftableByInput(input: string): AlchemyCraftable | undefined {
    return this.alchemyCraftables.get(normalizeName(input));
  }

  /** The lookup your crafting function needs */
  findAlchemyByPropertyAndValue(
    typeProperty: string,
    typeValue: number
  ): AlchemyCraftable | undefined {
    return Array.from(this.alchemyCraftables.values()).find(
      (c) => c.typeProperty === typeProperty && c.typeValue === typeValue
    );
  }

  /** Looks up an alchemy craftable whose recipes array contains the given key. */
  findAlchemyByRecipe(recipeKey: string): AlchemyCraftable | undefined {
    return Array.from(this.alchemyCraftables.values()).find(
      (c) => c.recipes.includes(recipeKey)
    );
  }
}
