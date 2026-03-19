export type Raid = {
  id: string;
  name: string;
  raid_name: string | null;
  share_token: string;
  created_at: string;
};

export type RaidMember = {
  id: string;
  raid_id: string;
  account_name: string;
  created_at: string;
};

export type Character = {
  id: string;
  raid_member_id: string;
  character_name: string;
  server_name: string;
  class: string;
  item_level: number;
  created_at: string;
};

// Lostark API response type
export type LostarkCharacter = {
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
};
