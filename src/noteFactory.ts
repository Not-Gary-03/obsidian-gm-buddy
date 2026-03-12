// noteFactory.ts
import { App, Modal, Setting, TFile, normalizePath } from "obsidian";
import { Ingredient, AlchemyCraftable, EquipmentCraftable } from "./models";
import { ItemRegistry, normalizeName } from "./registry";

export class NameModal extends Modal {
  private name = "";

  constructor(app: App, private onSubmit: (name: string) => void) {
    super(app)
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "New Item" });

    new Setting(contentEl)
      .setName("Name")
      .addText(text => {
        text.setPlaceholder("input name")
          .onChange(value => { this.name = value; });
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && this.name.trim()) {
            e.preventDefault();
            this.close();
            this.onSubmit(this.name.trim());
          }
        });
      });
    
    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          this.close();
          this.onSubmit(this.name.trim());
        }));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class NoteFactory {
  constructor(private app: App) {}

  renderIngredientBody(data: Partial<Ingredient>): string {
    let returnstring: string = `# ${data.name ? data.name + "\n" : ""}`;

    if (data.rarity) {
      returnstring += `**Rarity:** *` + data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1) + "*\n";
    }
    if (data.cost) {
      returnstring += `**Cost:** ` + data.cost + " **GP**\n";
    }

    returnstring += "\n" + (data.description ?? "No description.");

    return returnstring;
  }

  renderAlchemyBody(data: Partial<AlchemyCraftable>): string {
    let returnstring: string = `# ${data.name ? data.name + "\n" : ""}`;

    if (data.typeProperty) {
      returnstring += `**Type:** *` + data.typeProperty.charAt(0).toUpperCase() + data.typeProperty.slice(1) + "*\n";
    }
    if (data.rarity) {
      returnstring += `**Rarity:** *` + data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1) + "*\n";
    }
    if (data.cost) {
      returnstring += `**Cost:** ` + data.cost + " **GP**\n";
    }

    returnstring += "\n" + (data.description ?? "No description.");

    return returnstring;
  }

  renderEquipmentBody(data: Partial<EquipmentCraftable>): string {
    let returnstring: string = `# ${data.name ? data.name + "\n" : ""}`;

    if (data.rarity) {
      returnstring += `**Rarity:** *` + data.rarity.charAt(0).toUpperCase() + data.rarity.slice(1) + "*\n";
    }
    if (data.cost) {
      returnstring += `**Cost:** ` + data.cost + " **GP**\n";
    }

    returnstring += "\n" + (data.description ?? "No description.");

    return returnstring;
  }

  async createIngredient(data: Partial<Ingredient>): Promise<TFile> {
    const normalized = normalizeName(data.nameNormalized ?? data.name ?? "unnamed");
    const folder = ItemRegistry.FOLDERS.ingredient;
    const path = normalizePath(`${folder}/${data.name}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      name: data.name ?? "",
      typeItem: "ingredient",
      rarity: data.rarity ?? null,
      cost: data.cost ?? 0,
      description: data.description ?? "",
      alchemical: data.alchemical ?? 0,
      mystical: data.mystical ?? 0,
      divine: data.divine ?? 0,
      nameNormalized: normalized,
    });

    const body = this.renderIngredientBody(data);
    return await this.app.vault.create(path, `${frontmatter}\n${body}`);
  }

  async createAlchemyCraftable(data: Partial<AlchemyCraftable>): Promise<TFile> {
    const normalized = normalizeName(data.nameNormalized ?? data.name ?? "unnamed");
    const folder = ItemRegistry.FOLDERS.alchemy_craftable;
    const path = normalizePath(`${folder}/${data.name}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      name: data.name ?? "",
      typeProperty: data.typeProperty ?? "",
      typeValue: data.typeValue ?? 0,
      rarity: data.rarity ?? "",
      cost: data.cost ?? 0,
      description: data.description ?? "",
      typeItem: "alchemy_craftable",
      nameNormalized: normalized,
      recipes: data.recipes ?? [],
    });

    const body = this.renderAlchemyBody(data);
    return await this.app.vault.create(path, `${frontmatter}\n${body}`);
  }

  async createEquipmentCraftable(data: Partial<EquipmentCraftable>): Promise<TFile> {
    const normalized = normalizeName(data.nameNormalized ?? data.name ?? "unnamed");
    const folder = ItemRegistry.FOLDERS.equipment_craftable;
    const path = normalizePath(`${folder}/${data.name}.md`);

    await this.ensureFolder(folder);

    const frontmatter = this.buildFrontmatter({
      name: data.name ?? "",
      rarity: data.rarity ?? "",
      cost: data.cost ?? 0,
      description: data.description ?? "",
      typeItem: "equipment_craftable",
      nameNormalized: normalized,
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
