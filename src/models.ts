// models.ts
export interface GenericObject {
  name: string;
  nameNormalized: string;
  description: string;
}

// ###############################################################################################
// ITEM INTERFACES
export interface Item extends GenericObject {
  typeItem: string;
  rarity: string;
  cost: number;
}
export interface Ingredient extends Item {
  alchemical: number;
  mystical: number;
  divine: number;
  // extend with equipment properties as needed
}
export interface AlchemyCraftable extends Item {
  typeProperty: string;
  typeIndexMin: number;
  typeIndexMax: number;
  recipes: string[];
}
export interface EquipmentCraftable extends Item {
  recipes: string[];
}
// ###############################################################################################

// ###############################################################################################
// FEATURE INTERFACES
export interface Spell extends GenericObject {
  spellTier: number; // '0' represents a cantrip
  spellType: string; // what spell school or similar thing the spell is related to
  owners: string[]; // list of what players know this spell
  status: string;
}
export interface Boon extends GenericObject {
  owners: string[];
  status: string;
  tags: string[];
}
// ###############################################################################################

// ###############################################################################################
// MONSTER INTERFACES
export interface Monster extends GenericObject {
  level: number; // -2 = LVL 1/2, -3 = LVL 1/3, -4 = LVL 1/4
  size: string; // tiny, small, medium, large, huge, gargantuan
  group: string; // which group this monster belongs to. none is valid
  hitPoints: number;
  armor: string; // none, medium, heavy. defaults to none.
  speed: number; // defaults to 6
  tags: string[];
}
// ###############################################################################################
