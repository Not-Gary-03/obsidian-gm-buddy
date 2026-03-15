// noteFactory.ts
import { App, Modal, Setting, TFile, normalizePath } from "obsidian";
import { Ingredient, AlchemyCraftable, EquipmentCraftable } from "./models";
import { ItemRegistry, normalizeName } from "./registry";

// ###############################################################################################
// MODALS
export class NumberModal extends Modal {
  private value = "";

  constructor(app: App, private prompt: string, private onSubmit: (value: number) => void) {
    super(app);
  }

  private parse(raw: string): number | null {
    const fraction = raw.match(/^(-?\d+)\s*\/\s*(-?\d+)$/);
    if (fraction) {
      const denominator = parseFloat(fraction[2]!);
      if (denominator === 0) return null;
      return parseFloat(fraction[1]!) / denominator;
    }
    const n = parseFloat(raw);
    return isNaN(n) ? null : n;
  }

  onOpen(): void {
    const { contentEl } = this;

    const submit = () => {
      const n = this.parse(this.value);
      if (n !== null) {
        this.close();
        this.onSubmit(n);
      }
    };

    new Setting(contentEl)
      .setName(this.prompt)
      .addText(text => {
        text.inputEl.type = "number";
        text.onChange(value => { this.value = value; });
        text.inputEl.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); submit(); }
        });
      });

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("OK")
        .setCta()
        .onClick(submit));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

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

export class ShiftIndexModal extends Modal {
  private typeProperty = "alchemical";
  private range: "all" | "gt" | "lt" = "all";
  private compareValue = 0;
  private shift = 0;

  constructor(
    app: App,
    private onSubmit: (typeProperty: string, range: "all" | "gt" | "lt", compareValue: number | null, shift: number) => void
  ) {
    super(app);
  }

  onOpen(): void {
    this.showTypeStep();
  }

  private showTypeStep(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Shift Indexes (1/3) — Type" });

    new Setting(contentEl).setName("Type property").addDropdown(dd => {
      dd.addOption("alchemical", "Alchemical");
      dd.addOption("mystical", "Mystical");
      dd.addOption("divine", "Divine");
      dd.setValue(this.typeProperty);
      dd.onChange(v => { this.typeProperty = v; });
    });

    new Setting(contentEl).addButton(btn => btn.setButtonText("Next").setCta().onClick(() => this.showRangeStep()));
  }

  private showRangeStep(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Shift Indexes (2/3) — Range" });

    new Setting(contentEl).setName("Target items").addDropdown(dd => {
      dd.addOption("all", "All");
      dd.addOption("gt", "Greater than");
      dd.addOption("lt", "Less than");
      dd.setValue(this.range);
      dd.onChange(v => { this.range = v as "all" | "gt" | "lt"; });
    });

    new Setting(contentEl).addButton(btn => btn.setButtonText("Next").setCta().onClick(() => {
      if (this.range === "all") this.showShiftStep();
      else this.showCompareStep();
    }));
  }

  private showCompareStep(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Shift Indexes (2.5/3) — Compare value" });

    new Setting(contentEl).setName("typeIndexMax compare value").addText(text => {
      text.inputEl.type = "number";
      text.setValue(String(this.compareValue));
      text.onChange(v => { this.compareValue = parseInt(v) || 0; });
      text.inputEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); this.showShiftStep(); } });
    });

    new Setting(contentEl).addButton(btn => btn.setButtonText("Next").setCta().onClick(() => this.showShiftStep()));
  }

  private showShiftStep(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Shift Indexes (3/3) — Shift amount" });

    const submit = () => {
      this.close();
      this.onSubmit(this.typeProperty, this.range, this.range === "all" ? null : this.compareValue, this.shift);
    };

    new Setting(contentEl).setName("Shift amount (positive or negative integer)").addText(text => {
      text.inputEl.type = "number";
      text.setValue(String(this.shift));
      text.onChange(v => { this.shift = parseInt(v) || 0; });
      text.inputEl.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    });

    new Setting(contentEl).addButton(btn => btn.setButtonText("Apply").setCta().onClick(submit));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
// END MODALS
// ###############################################################################################

// ###############################################################################################
// NOTE FACTORY
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
      typeIndexMin: data.typeIndexMin ?? null,
      typeIndexMax: data.typeIndexMax ?? null,
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

  async rebuildFrontmatterInFolder(folder: string): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder));
    for (const file of files) {
      await this.rebuildFrontmatter(file);
    }
  }

  // ###############################################################################################
  // SCALE INDEXES ALCHEMY
  async scaleIndexesInFolderAlchemy(folder: string, factor: number): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder));
    for (const file of files) {
      await this.scaleIndexAlchemyCraftable(file, factor);
    }
  }
  async scaleIndexAlchemyCraftable(file: TFile, factor: number): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (fm?.typeItem !== "alchemy_craftable") return;

    const raw = await this.app.vault.read(file);
    const bodyMatch = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : raw;

    let newFrontmatter: string;

    newFrontmatter = this.buildFrontmatter({
      name: fm.name ?? "",
      typeProperty: fm.typeProperty ?? "",
      typeIndexMin: fm.typeIndexMin != null ? Math.round(factor * fm.typeIndexMin) : null,
      typeIndexMax: fm.typeIndexMax != null ? Math.round(factor * fm.typeIndexMax) : null,
      rarity: fm.rarity ?? "",
      cost: fm.cost ?? 0,
      description: fm.description ?? "",
      typeItem: "alchemy_craftable",
      nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
      recipes: fm.recipes ?? [],
    });

    await this.app.vault.modify(file, `${newFrontmatter}\n${body}`);
  }
  //
  // ###############################################################################################

  // ###############################################################################################
  // SHIFT INDEXES ALCHEMY
  async shiftIndexesAlchemyCraftable(typeProperty: string, range: "all" | "gt" | "lt", compareValue: number | null, shift: number): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(ItemRegistry.FOLDERS.alchemy_craftable));
    for (const file of files) {
      const cache = this.app.metadataCache.getFileCache(file);
      const fm = cache?.frontmatter;
      if (fm?.typeItem !== "alchemy_craftable") continue;
      if (fm.typeProperty !== typeProperty) continue;
      if (range === "gt" && compareValue !== null && !(fm.typeIndexMax > compareValue)) continue;
      if (range === "lt" && compareValue !== null && !(fm.typeIndexMax < compareValue)) continue;

      const raw = await this.app.vault.read(file);
      const bodyMatch = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
      const body = bodyMatch ? bodyMatch[1] : raw;

      const newFrontmatter = this.buildFrontmatter({
        name: fm.name ?? "",
        typeProperty: fm.typeProperty ?? "",
        typeIndexMin: fm.typeIndexMin != null ? Number(fm.typeIndexMin) + shift : null,
        typeIndexMax: fm.typeIndexMax != null ? Number(fm.typeIndexMax) + shift : null,
        rarity: fm.rarity ?? "",
        cost: fm.cost ?? 0,
        description: fm.description ?? "",
        typeItem: "alchemy_craftable",
        nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
        recipes: fm.recipes ?? [],
      });

      await this.app.vault.modify(file, `${newFrontmatter}\n${body}`);
    }
  }
  // END SHIFT INDEXES ALCHEMY
  // ###############################################################################################

  // ###############################################################################################
  // SCALE INDEXES INGREDIENTS
  async scaleIndexesInFolderIngredient(folder: string, factor: number): Promise<void> {
    const files = this.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder));
    for (const file of files) {
      await this.scaleIndexIngredient(file, factor);
    }
  }
  async scaleIndexIngredient(file: TFile, factor: number): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (fm?.typeItem !== "ingredient") return;

    const raw = await this.app.vault.read(file);
    const bodyMatch = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : raw;

    let newFrontmatter: string;

    newFrontmatter = this.buildFrontmatter({
      name: fm.name ?? "",
      typeItem: "ingredient",
      rarity: fm.rarity ?? "",
      cost: fm.cost ?? 0,
      description: fm.description ?? "",
      alchemical: fm.alchemical != null ? Math.round(factor * fm.alchemical) : null,
      mystical: fm.mystical != null ? Math.round(factor * fm.mystical) : null,
      divine: fm.divine != null ? Math.round(factor * fm.divine) : null,
      
      nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
    });

    await this.app.vault.modify(file, `${newFrontmatter}\n${body}`);
  }
  //END SCALE INDEXES INGREDIENTS
  // ###############################################################################################


  async rebuildFrontmatter(file: TFile): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm?.typeItem) return;

    const raw = await this.app.vault.read(file);
    const bodyMatch = raw.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
    const body = bodyMatch ? bodyMatch[1] : raw;

    let newFrontmatter: string;

    switch (fm.typeItem) {
      case "alchemy_craftable":
        newFrontmatter = this.buildFrontmatter({
          name: fm.name ?? "",
          typeProperty: fm.typeProperty ?? "",
          typeIndexMin: fm.typeIndexMin ?? null,
          typeIndexMax: fm.typeIndexMax ?? fm.typeValue ?? null,
          rarity: fm.rarity ?? "",
          cost: fm.cost ?? 0,
          description: fm.description ?? "",
          typeItem: "alchemy_craftable",
          nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
          recipes: fm.recipes ?? [],
        });
        break;
      case "equipment_craftable":
        newFrontmatter = this.buildFrontmatter({
          name: fm.name ?? "",
          rarity: fm.rarity ?? "",
          cost: fm.cost ?? 0,
          description: fm.description ?? "",
          typeItem: "equipment_craftable",
          nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
          recipes: fm.recipes ?? [],
        });
        break;
      default:
        return;
    }

    await this.app.vault.modify(file, `${newFrontmatter}\n${body}`);
  }

  private buildFrontmatter(data: Record<string, unknown>): string {
    const lines = ["---"];
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach((v) => lines.push(`  - "${v}"`));
      } else if (typeof value === "string") {
        const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
        lines.push(`${key}: "${escaped}"`);
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
// END NOTE FACTORY
// ###############################################################################################
