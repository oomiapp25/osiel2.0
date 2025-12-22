
export type BuddyType = 'toby' | 'lila' | 'gogo' | 'pipo' | 'maya';

export interface ChildProfile {
  id: string;
  nickname: string;
  buddy: BuddyType;
  color: string;
}

export type GameType = 'counting' | 'shapes' | 'sizes' | 'patterns' | 'bodyParts';

export interface GameState {
  currentLevel: number;
  score: number;
  completedActivities: number;
}

export interface BuddyLevels {
  toby: number;
  lila: number;
  gogo: number;
  pipo: number;
  maya: number;
}
