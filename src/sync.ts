// sync.ts
import { App, TFile } from "obsidian";
import { NoteFactory } from "./noteFactory";
import { typeFromTags } from "./registry";

export class NoteSync {
  constructor(private app: App, private noteFactory: NoteFactory) {}

  async syncNoteBody(file: TFile): Promise<void> {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    if (!fm) return;
    const typeItem = typeFromTags(fm.tags ?? []);
    if (!typeItem) return;

    // Read current content to find where frontmatter ends
    const content = await this.app.vault.read(file);
    const fmEnd = content.indexOf("---", 4); // second ---
    if (fmEnd === -1) return;
    const frontmatterBlock = content.substring(0, fmEnd + 3);

    // Regenerate body from frontmatter values
    let newBody: string;
    switch (typeItem) {
      case "ingredient":
        newBody = this.noteFactory.renderIngredientBody(fm);
        break;
      case "alchemy_craftable":
        newBody = this.noteFactory.renderAlchemyBody(fm);
        break;
      case "equipment_craftable":
        newBody = this.noteFactory.renderEquipmentBody(fm);
        break;
      case "monster":
        newBody = this.noteFactory.renderMonsterBody(fm);
        break;
      default:
        return;
    }

    const newContent = `${frontmatterBlock}\n\n${newBody}`;

    // Only write if actually changed (avoid infinite loops)
    if (newContent !== content) {
      await this.app.vault.modify(file, newContent);
    }
  }
}
