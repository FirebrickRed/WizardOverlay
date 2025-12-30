
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
}

export interface WorldQuestData {
  worlds: World[];
}