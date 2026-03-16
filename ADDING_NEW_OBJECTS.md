# Adding a New Object Type

Replace every instance of `MyObject` / `myObject` / `my_object` / `my-object` with your actual type name, following the same casing convention.

---

## 1. Define the interface — `models.ts`

Add your interface extending the appropriate base (`GenericObject` for features/monsters, `Item` for craftable/tradeable things).

```typescript
export interface MyObject extends Item {   // or GenericObject
  // your custom fields
  myField: string;
  myNumber: number;
}
```

---

## 2. Register the folder — `registry.ts`

At the top of the file, add `MyObject` to the imports
```typescript
  import { Ingredient, AlchemyCraftable, MyObject } from "./models";
```

Next, in the `ItemRegistry` class, add a private map, an entry, a case to `indexFile`, a case to `removeByPath`, and public accessors.

```typescript
export class ItemRegistry {
  // ...existing...
  private myObjects: Map<string, MyObject> = new Map(); // private map

  // ...

  static FOLDERS = {
    // ...existing...
    my_object: "Folder/Path", // entry
  };

  // ...

  private indexFile(file: TFile): void {
    // ...code...

    switch (typeItem) {
      // ...existing...
      case "my_object": // case in indexFile
        this.myObjects.set(key, {
          nameNormalized: key,
          name: fm.name ?? "",
          description: fm.description ?? "",
          myField: fm.myField ?? "",
          myNumber: fm.myNumber ?? 0,
          tags: fm.tags ?? [],
        });
        break;
    }
  }

  // ...

  private removeByPath(path: string): void {
    for (const [typeItem, folder] of Object.entries(ItemRegistry.FOLDERS)) {
      if (path.startsWith(folder)) {
        // ...existing...
        if (typeItem === "my_object") this.myObjects.delete(key); //case in removeByPath
      }
    }
    this.updateCallback?.();
  }

  // ...

  // --- Public accessors ---
  // ...existing...
  getMyObjects(): MyObject[] {
    return Array.from(this.myObjects.values());
  }
  getMyObject(nameNormalized: string): MyObject | undefined {
    return this.myObjects.get(normalizeName(nameNormalized));
  }
}
```

## 3. Render the note body — `noteFactory.ts`

```typescript
renderMyObjectBody(data: Partial<MyObject>): string {
  let returnstring: string = `# ${data.name ? data.name + "\n" : ""}`;

  // Add whatever fields make sense in the readable body
  if (data.myField) {
    returnstring += `**My Field:** *` + data.myField.charAt(0).toUpperCase() + data.myField.slice(1) + "*\n";
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
```

---

## 4. Create a note — `noteFactory.ts`

```typescript
async createMyObject(data: Partial<MyObject>): Promise<TFile> {
  const normalized = normalizeName(data.nameNormalized ?? data.name ?? "unnamed");
  const folder = ItemRegistry.FOLDERS.my_object;
  const path = normalizePath(`${folder}/${data.name}.md`);

  await this.ensureFolder(folder);

  const frontmatter = this.buildFrontmatter({
    name: data.name ?? "",
    myField: data.myField ?? "",
    myNumber: data.myNumber ?? 0,
    rarity: data.rarity ?? "",       // remove if not extending Item
    cost: data.cost ?? 0,            // remove if not extending Item
    description: data.description ?? "",
    nameNormalized: normalized,
    recipes: data.recipes ?? [],     // remove if not extending Item
    tags: withTypeTag("my_object", data.tags ?? []),
  });

  const body = this.renderMyObjectBody(data);
  return await this.app.vault.create(path, `${frontmatter}\n${body}`);
}
```

Also add a case to `rebuildFrontmatter` so the "Rebuild Frontmatter" command handles your type:

```typescript
case "my_object":
  newFrontmatter = this.buildFrontmatter({
    name: fm.name ?? "",
    myField: fm.myField ?? "",
    myNumber: fm.myNumber ?? 0,
    rarity: fm.rarity ?? "",
    cost: fm.cost ?? 0,
    description: fm.description ?? "",
    nameNormalized: fm.nameNormalized ?? normalizeName(fm.name ?? ""),
    recipes: fm.recipes ?? [],
    tags: withTypeTag("my_object", fm.tags ?? []),
  });
  break;
```

And a case to `migrateTypeItemToTags` (copy the same `buildFrontmatter` block from `rebuildFrontmatter`).

---

## 5. Rebuild a list note — `list-notes.ts`

Only needed if you want an auto-generated summary note.

```typescript
async rebuildMyObjectList(): Promise<void> {
  const items = this.registry.getMyObjects()
    .sort((a, b) => a.name.localeCompare(b.name));  // replace with your sort logic

  const lines = [
    `*${items.length} my object${items.length !== 1 ? "s" : ""}*`,
    "",
    `| **Name** | *My Field* | Cost |\n` +
    `|----------|------------|------|`,
  ];

  for (const item of items) {
    lines.push(`| [[${item.name}]] | ${item.myField} | ${item.cost} **GP** |`);
  }

  await this.writeNote(this.settings.myObjectListNote, lines.join("\n"));
}
```

Add `myObjectListNote: string` to `GMBuddySettings` in `settings.ts` and a default value in `DEFAULT_SETTINGS`.

---

## 6. Wire up commands — `main.ts`

```typescript
// Create command
this.addCommand({
  id: "create-my-object",
  name: "New My Object",
  callback: () => this.promptAndCreate("my_object"),
});

// Rebuild frontmatter command
this.addCommand({
  id: "rebuild-frontmatter-my-object",
  name: "Rebuild Frontmatter: All My Objects",
  callback: () => this.noteFactory.rebuildFrontmatterInFolder(ItemRegistry.FOLDERS.my_object),
});

// List note rebuild (if applicable) — add inside the setUpdateCallback block too
this.addCommand({
  id: "rebuild-my-object-list",
  name: "Rebuild List: My Objects",
  callback: () => void this.listNoteManager.rebuildMyObjectList(),
});
```

Add a case to `promptAndCreate`:

```typescript
case "my_object":
  new NameModal(this.app, async (name) => {
    file = await this.noteFactory.createMyObject({ name });
    await this.app.workspace.getLeaf().openFile(file);
  }).open();
  break;
```

If using a list note, add the rebuild trigger inside `setUpdateCallback`:

```typescript
this.registry.setUpdateCallback(() => {
  // ...existing...
  void this.listNoteManager.rebuildMyObjectList();
});
```

---

## Checklist

- [ ] Interface added to `models.ts`
- [ ] Folder added to `ItemRegistry.FOLDERS`
- [ ] Private map, `getMyObjects()`, and `getMyObject()` added to `ItemRegistry`
- [ ] Case added to `indexFile` in `ItemRegistry`
- [ ] Case added to `removeByPath` in `ItemRegistry`
- [ ] `renderMyObjectBody` added to `NoteFactory`
- [ ] `createMyObject` added to `NoteFactory`
- [ ] Case added to `rebuildFrontmatter` in `NoteFactory`
- [ ] Case added to `migrateTypeItemToTags` in `NoteFactory`
- [ ] `rebuildMyObjectList` added to `ListNoteManager` (if applicable)
- [ ] Setting added to `GMBuddySettings` and `DEFAULT_SETTINGS` (if list note)
- [ ] Commands wired up in `main.ts`
- [ ] `promptAndCreate` case added in `main.ts`
- [ ] List rebuild added to `setUpdateCallback` in `main.ts` (if list note)
