import { create } from "zustand";
import { MAX_NICKNAME_LENGTH } from "@last-spark/shared";
import { generateNickname } from "./nickname";
import { rollCharacter } from "./characterGacha";

interface PlayerIdentity {
  charId: string;
  nickname: string;
  /** 유저가 대기 화면에서 닉네임을 직접 바꾼다(기획서 2.1) */
  setNickname: (nickname: string) => void;
  /** 캐릭터를 다시 뽑는다(가챠 재시도 — 상점 연동 전까지는 개발용) */
  reroll: () => void;
}

/**
 * 이번 세션의 내 캐릭터/닉네임 — 세션 동안 고정되는 단일 출처.
 *
 * 대기 화면(A)에 보여주는 캐릭터와 lounge:join으로 입장하는 캐릭터가 같아야
 * 하므로, 양쪽 다 rollCharacter()를 각자 호출하지 말고 이 스토어를 참조한다.
 */
export const usePlayerIdentity = create<PlayerIdentity>((set) => ({
  charId: rollCharacter(),
  nickname: generateNickname(),
  setNickname: (nickname) => set({ nickname: nickname.slice(0, MAX_NICKNAME_LENGTH) }),
  reroll: () => set({ charId: rollCharacter(), nickname: generateNickname() }),
}));
