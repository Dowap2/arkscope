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

// Lostark API - 캐릭터 목록
export type LostarkCharacter = {
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
};

// Lostark API - Armory
export type ArmoryProfile = {
  CharacterImage: string | null;
  ExpeditionLevel: number;
  ServerName: string;
  CharacterName: string;
  CharacterLevel: number;
  CharacterClassName: string;
  ItemAvgLevel: string;
  ItemMaxLevel: string;
  GuildName: string | null;
  Title: string | null;
  Stats: { Type: string; Value: string }[];
};

export type ArmoryEngraving = {
  Slot: number;
  Name: string;
  Icon: string;
  Tooltip: string;
};

export type ArmoryEffect = {
  Name: string;
  Description: string;
};

export type ArmoryEngrave = {
  Engravings: ArmoryEngraving[] | null;
  Effects: ArmoryEffect[] | null;
};

export type ArmoryGemEffect = {
  GemSlot: number;
  Name: string;
  Description: string;
  Icon: string;
};

export type ArmoryGemItem = {
  Slot: number;
  Name: string;
  Icon: string;
  Level: number;
  Class: string;
  EffectType: string;
};

export type ArmoryGem = {
  Gems: ArmoryGemItem[] | null;
  Effects: ArmoryGemEffect[] | null;
};

export type CharacterArmory = {
  ArmoryProfile: ArmoryProfile | null;
  ArmoryEngrave: ArmoryEngrave | null;
  ArmoryGem: ArmoryGem | null;
};
