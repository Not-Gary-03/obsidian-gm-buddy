// models.ts
export interface BaseItem {
  nameNormalized: string;
  name: string;
  description: string;
  typeItem: string;
  rarity: number;
  cost: number;
}

export interface Ingredient extends BaseItem {
  alchemical: number;
  mystical: number;
  divine: number;
  // extend with equipment properties as needed
}

export interface AlchemyCraftable extends BaseItem {
  typeProperty: number;
  typeValue: number;
  recipes: string[];
}

export interface EquipmentCraftable extends BaseItem {
  recipes: string[];
}
