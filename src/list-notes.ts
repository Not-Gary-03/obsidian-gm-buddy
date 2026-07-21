// list-notes.ts
import { App, Modal, Setting, TFile, normalizePath } from "obsidian";
import { ItemRegistry } from "./registry";
import { GMBuddySettings } from "./settings";

export interface FilteredListQuery {
  folderPath: string;
  outputNotePath: string;
  requiredTags: string[];
  requiredProperties: Record<string, string>;
}

export class FilteredListNoteModal extends Modal {
  private folderPath = "";
  private outputNotePath = "";
  private requiredTags = "";
  private requiredProperties = "";

  constructor(
    app: App,
    private onSubmit: (query: FilteredListQuery) => Promise<void> | void,
    defaults: Partial<FilteredListQuery> = {}
  ) {
    super(app);
    this.folderPath = defaults.folderPath ?? "";
    this.outputNotePath = defaults.outputNotePath ?? "";
    this.requiredTags = (defaults.requiredTags ?? []).join(", ");
    this.requiredProperties = Object.entries(defaults.requiredProperties ?? {})
      .map(([key, value]) => `${key}=${value}`)
      .join(", ");
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Create Filtered List Note" });

    new Setting(contentEl)
      .setName("Folder to scan")
      .setDesc("Vault folder to search recursively for matching notes.")
      .addText(text => text
        .setPlaceholder("Content/Creatures")
        .setValue(this.folderPath)
        .onChange(value => { this.folderPath = value; }));

    new Setting(contentEl)
      .setName("List note path")
      .setDesc("Where the generated list will be written (omit .md).")
      .addText(text => text
        .setPlaceholder("Content/Creature List")
        .setValue(this.outputNotePath)
        .onChange(value => { this.outputNotePath = value; }));

    new Setting(contentEl)
      .setName("Required tags")
      .setDesc("Comma-separated tags that every matching note must include.")
      .addText(text => text
        .setPlaceholder("tag-a, tag-b")
        .setValue(this.requiredTags)
        .onChange(value => { this.requiredTags = value; }));

    new Setting(contentEl)
      .setName("Required properties")
      .setDesc("Comma-separated key=value pairs, for example type=beast, level=3.")
      .addText(text => text
        .setPlaceholder("type=beast, level=3")
        .setValue(this.requiredProperties)
        .onChange(value => { this.requiredProperties = value; }));

    new Setting(contentEl)
      .addButton(btn => btn
        .setButtonText("Create")
        .setCta()
        .onClick(() => {
          const query: FilteredListQuery = {
            folderPath: this.folderPath.trim(),
            outputNotePath: this.outputNotePath.trim(),
            requiredTags: this.requiredTags
              .split(",")
              .map(tag => tag.trim())
              .filter(Boolean),
            requiredProperties: Object.fromEntries(
              this.requiredProperties
                .split(",")
                .map(entry => entry.trim())
                .filter(Boolean)
                .map(entry => {
                  const separatorIndex = entry.indexOf("=");
                  if (separatorIndex === -1) {
                    return [entry, ""] as const;
                  }
                  return [entry.slice(0, separatorIndex).trim(), entry.slice(separatorIndex + 1).trim()] as const;
                })
            ),
          };

          if (!query.folderPath || !query.outputNotePath) {
            return;
          }

          this.close();
          void this.onSubmit(query);
        }));
  }

  onClose(): void {
    this.contentEl.empty();
  }
}

export class ListNoteManager {
  constructor(
    private app: App,
    private registry: ItemRegistry,
    private settings: GMBuddySettings
  ) {}

  // ###############################################################################################
  // FILTERED LISTS
  async createFilteredListNote(query: FilteredListQuery): Promise<void> {
    const folderPath = normalizePath(query.folderPath);
    const outputPath = normalizePath(query.outputNotePath);
    const candidateFiles = this.app.vault.getMarkdownFiles()
      .filter(file => this.isInFolder(file.path, folderPath))
      .filter(file => file.path !== `${outputPath}.md`);

    const matchingFiles = candidateFiles
      .filter(file => this.matchesQuery(file, query))
      .sort((a, b) => a.path.localeCompare(b.path));

    const lines = [
      `*${matchingFiles.length} note${matchingFiles.length !== 1 ? "s" : ""}*`,
      "",
    ];

    if (matchingFiles.length === 0) {
      lines.push("- No matching notes found.");
    } else {
      for (const file of matchingFiles) {
        lines.push(`- [[${file.path.replace(/\.md$/, "")}]]`);
      }
    }

    await this.writeNote(outputPath, lines.join("\n"));
  }

  private isInFolder(filePath: string, folderPath: string): boolean {
    if (!folderPath) return true;
    return filePath === folderPath || filePath.startsWith(`${folderPath}/`);
  }

  private matchesQuery(file: TFile, query: FilteredListQuery): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = (cache?.frontmatter ?? {}) as Record<string, unknown>;
    const noteTags = Array.isArray(frontmatter.tags)
      ? frontmatter.tags.map(tag => String(tag))
      : [];

    if (query.requiredTags.some(tag => !noteTags.includes(tag))) {
      return false;
    }

    for (const [key, expectedRaw] of Object.entries(query.requiredProperties)) {
      if (frontmatter[key] === undefined) {
        return false;
      }
      if (!this.comparePropertyValue(frontmatter[key], expectedRaw)) {
        return false;
      }
    }

    return true;
  }

  private parsePropertyValue(rawValue: string): string | number | boolean | null {
    const trimmed = rawValue.trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
    if (lower === "null" || lower === "none") return null;
    if (/^-?\d+$/.test(trimmed)) return parseInt(trimmed, 10);
    if (/^-?\d+\.\d+$/.test(trimmed)) return parseFloat(trimmed);
    return trimmed;
  }

  private normalizePropertyValue(value: unknown): string | number | boolean | null {
    if (value == null) return null;
    if (typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  private comparePropertyValue(actual: unknown, expectedRaw: string): boolean {
    const expected = this.parsePropertyValue(expectedRaw);
    const normalizedActual = this.normalizePropertyValue(actual);
    if (expected === null || normalizedActual === null) {
      return expected === normalizedActual;
    }
    if (typeof expected === "boolean" && typeof normalizedActual === "boolean") {
      return expected === normalizedActual;
    }
    if (typeof expected === "number" && typeof normalizedActual === "number") {
      return expected === normalizedActual;
    }
    return String(normalizedActual).toLowerCase() === String(expected).toLowerCase();
  }
  // END FILTERED LISTS
  // ###############################################################################################

  // ###############################################################################################
  // REBUILD LIST
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
  async rebuildMonsterList(): Promise<void> {
  const items = this.registry.getMonsters()
    .sort((a, b) => a.name.localeCompare(b.name));  // replace with your sort logic

  const lines = [
    `*${items.length} monster${items.length !== 1 ? "s" : ""}*`,
    "",
    `| **Name** | *Group(s)* | Level |\n` +
    `|----------|------------|-------|`,
  ];

  let temp_string: string;
  for (const item of items) {
    temp_string = "";
    temp_string += `| [[${item.name}]] | `;
    if (item.tags) {
      let numbergroups = 0;
      for (const s of item.tags) {
        if (s.startsWith("group-")) {
          numbergroups++;
          if (numbergroups > 1) { temp_string += ", " }
          temp_string += s.charAt(6).toUpperCase() + s.slice(7);
        }
      }
    }
    temp_string += ` | ${item.level == -2 ? "1/2" : item.level == -3 ? "1/3" : item.level == -4 ? "1/4" : item.level > 0 ? item.level : "Minion"} |`;
    lines.push(temp_string);
  }

  await this.writeNote(this.settings.monsterListNote, lines.join("\n"));
}
  // END REBUILD LIST
  // ###############################################################################################

  private async writeNote(notePath: string, content: string): Promise<void> {
    const path = normalizePath(`${notePath}.md`);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      // Preserve existing YAML frontmatter if present and ensure exactly
      // one blank line between frontmatter and the generated content.
      const original = await this.app.vault.read(existing);
      const preservedFrontmatter = await this.getPreservedFrontmatter(existing, original);
      const newText = preservedFrontmatter
        ? `${preservedFrontmatter}\n\n${content}`
        : content;
      await this.app.vault.modify(existing, newText);
    } else {
      const folderPath = path.includes("/") ? path.substring(0, path.lastIndexOf("/")) : "";
      if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }
      await this.app.vault.create(path, content);
    }
  }

  private async getPreservedFrontmatter(existing: TFile, original: string): Promise<string> {
    // Match a YAML frontmatter block at the start of the file, allowing optional
    // BOM and leading whitespace before the opening `---`.
    const fmMatch = original.match(/^\uFEFF?\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
    if (fmMatch) {
      let frontmatterBlock = fmMatch[0];
      frontmatterBlock = frontmatterBlock.replace(/[ \t\r\n]+$/g, "");
      return frontmatterBlock;
    }

    // If there is no explicit YAML block in the file text, try to preserve the
    // frontmatter already persisted in Obsidian's metadata cache so the update
    // can be written back without dropping those fields.
    let parsedFrontmatter: Record<string, unknown> | undefined;
    await this.app.fileManager.processFrontMatter(existing, (frontmatter) => {
      parsedFrontmatter = frontmatter as Record<string, unknown>;
    });

    if (parsedFrontmatter && Object.keys(parsedFrontmatter).length > 0) {
      const lines: string[] = ["---"];
      for (const [key, value] of Object.entries(parsedFrontmatter)) {
        if (value == null) {
          lines.push(`${key}:`);
        } else if (Array.isArray(value)) {
          lines.push(`${key}: ${value.map(v => String(v)).join(", ")}`);
        } else if (typeof value === "object") {
          lines.push(`${key}: ${JSON.stringify(value)}`);
        } else {
          lines.push(`${key}: ${String(value)}`);
        }
      }
      lines.push("---");
      return lines.join("\n");
    }

    return "";
  }
}
