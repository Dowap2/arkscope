import { LostarkCharacter, CharacterArmory } from "@/types";

const BASE_URL = "https://developer-lostark.game.onstove.com";

async function lostarkFetch<T>(endpoint: string): Promise<T> {
  const apiKey = process.env.LOSTARK_API_KEY;
  if (!apiKey) {
    throw new Error("LOSTARK_API_KEY is not set");
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `bearer ${apiKey}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Lostark API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * 캐릭터 이름으로 계정 내 모든 캐릭터를 조회한다.
 */
export async function getAccountCharacters(
  characterName: string
): Promise<LostarkCharacter[]> {
  const encoded = encodeURIComponent(characterName);
  const data = await lostarkFetch<LostarkCharacter[]>(
    `/characters/${encoded}/siblings`
  );
  return data ?? [];
}

/**
 * 캐릭터 장착 각인 / 보석 / 프로필 조회
 */
export async function getCharacterArmory(
  characterName: string
): Promise<CharacterArmory> {
  const encoded = encodeURIComponent(characterName);
  return lostarkFetch<CharacterArmory>(
    `/armories/characters/${encoded}?filters=profiles+engravings+gems`
  );
}
