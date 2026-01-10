
export interface Quest {
  slug: string;
  display_name: string;
  world_slug: string;
  story_order: number;
  quest_giver?: string;
  giver_location?: string;
  turn_in_to?: string;
  objectives?: object;
  rewards?: object;
}

export interface World {
  slug: string;
  display_name: string;
  story_order: number;
  quests: Quest[];
}

export interface WorldQuestData {
  worlds: World[];
}

export enum Schools {
  Balance = "BALANCE",
  Death = "DEATH",
  Fire = "FIRE",
  Ice = "ICE",
  Life = "LIFE",
  Myth = "MYTH",
  Storm = "STORM"
}
