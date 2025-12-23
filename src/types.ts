
export interface Quest {
  quest_id: string;
  display_name: string;
  prequest?: string | null;
  given_by?: string;
  location?: string;
  goals?: any[];
  hand_in?: string;
  reward?: object;
}

export interface World {
  world_id: string;
  display_name: string;
  story_quests: Quest[];
  side_quests: Quest[];
}

export interface WorldQuestData {
  worlds: World[];
}