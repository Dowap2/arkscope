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
  TownLevel?: number;
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

export type ArkPassiveEffect = {
  Name: string;
  Description: string;
  Grade: number;
  Level: number;
  AbilityStoneLevel: number | null;
};

export type ArmoryEngrave = {
  Engravings: ArmoryEngraving[] | null;
  Effects: ArmoryEffect[] | null;
  ArkPassiveEffects: ArkPassiveEffect[] | null;
};

export type ArmoryGemSkillEffect = {
  GemSlot: number;
  Name: string;
  Description: string[];
  Option: string;
  Icon: string;
};

export type ArmoryGemItem = {
  Slot: number;
  Name: string;
  Icon: string;
  Level: number;
  Grade: string;
  Tooltip: string;
};

export type ArmoryGem = {
  Gems: ArmoryGemItem[] | null;
  Effects: { Description: string; Skills: ArmoryGemSkillEffect[] } | null;
};

export type ArmoryEquipment = {
  Slot: number;
  Name: string;
  Icon: string;
  Type: string;
  Grade: string;
  Tooltip: string;
};

export type ArmoryCardItem = {
  Slot: number;
  Name: string;
  Icon: string;
  AwakeCount: number;
  AwakeTotal: number;
  Grade: string;
  Tooltip: string;
};

export type ArmoryCardEffect = {
  Index: number;
  CardSlots: number[];
  Items: { Name: string; Description: string }[];
};

export type ArmoryCard = {
  Cards: ArmoryCardItem[] | null;
  Effects: ArmoryCardEffect[] | null;
};

export type SkillTripod = {
  Tier: number;
  Slot: number;
  Name: string;
  Icon: string;
  IsSelected: boolean;
  Tooltip: string;
};

export type SkillRune = {
  Name: string;
  Icon: string;
  Grade: string;
};

export type ArmorySkill = {
  Name: string;
  Icon: string;
  Level: number;
  Type: string;
  SkillType: number;
  IsAwakening: boolean;
  Tripods: SkillTripod[];
  Rune: SkillRune | null;
  Tooltip?: string;
};

// Lostark API - Ark Passive (/armories/characters/{name}/arkpassive)
export type ArkPassivePoint = {
  Name: string;
  Value: number;
  Tooltip: string;
  Description?: string;
};

export type ArkPassiveEffectSkill = {
  Name: string;
  Description: string;
  Icon: string;
  ToolTip?: string;
  Tooltip?: string;
};

export type ArkPassiveData = {
  IsArkPassive: boolean;
  Points: ArkPassivePoint[] | null;
  Effects: ArkPassiveEffectSkill[] | null;
};

export type CharacterArmory = {
  ArmoryProfile: ArmoryProfile | null;
  ArmoryEquipment: ArmoryEquipment[] | null;
  ArmoryEngraving: ArmoryEngrave | null;
  ArmoryGem: ArmoryGem | null;
  ArmoryCard: ArmoryCard | null;
  ArmorySkills: ArmorySkill[] | null;
};
