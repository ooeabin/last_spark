/**
 * 엔티티 타입 (기획서 5.1 DB 스키마 + 6장 수익화 모델 그대로 반영)
 */

/**
 * 1% 방전 제단에서 남길 수 있는 유언 최대 길이 (기획서 4.2-C).
 * 클라이언트(`apps/mobile/src/features/altar-broadcast/model/useAltar.ts`)와
 * 서버(`apps/server/src/sockets/altar.handlers.ts`)가 같은 값을 써야 하므로
 * 여기 하나로 둔다 — 값을 바꿀 땐 여기만 고치면 된다.
 */
export const MAX_ALTAR_MESSAGE_LENGTH = 30;

/**
 * 닉네임 최대 길이 (기획서 2.1 — 유저가 직접 수정 가능).
 * `gravestones.nickname`이 VARCHAR(30)이므로 그보다 길어지면 안 된다.
 */
export const MAX_NICKNAME_LENGTH = 12;

/**
 * 근접 채팅 메시지 최대 길이 (기획서 4.2-B).
 * 클라이언트 입력 제한과 서버 검증(`chat.handlers.ts`)이 같은 값을 써야 한다.
 */
export const MAX_CHAT_MESSAGE_LENGTH = 60;

/** 묘비 및 유언장 아카이브 (`gravestones` 테이블) */
export interface Gravestone {
  id: string; // UUID
  countryCode: string;
  nickname: string;
  lastWords: string; // 최대 100자
  skinId: string;
  graveType: "basic" | "gold" | "neon";
  likesCount: number;
  createdAt: string; // ISO timestamp
}

/** 사용자 인벤토리 (`user_inventory` 테이블) */
export interface UserInventory {
  userId: string; // UUID
  hasTraitorPass: boolean;
  equippedGrave: string;
}

/** 라운지 룸 (국가별 매칭 + 정원 초과 시 분점, 기획서 3장) */
export interface LoungeRoom {
  id: string; // 예: "KR-1"
  countryCode: string;
  capacity: 30;
  occupants: number;
}

export interface Player {
  id: string;
  nickname: string;
  charId: string;
  countryCode: string;
  batteryLevel: number;
  isCharging: boolean;
  roomId: string | null;
}

/** 수익화 상품 (기획서 6장) — priceUsd/priceKrw는 기획 참고용 표시값 */
export const SHOP_ITEMS = [
  {
    id: "oxygen_mask",
    nameKo: "산소호흡기 (보상형 광고)",
    priceUsd: 0,
    kind: "rewarded_ad",
    effect: "grace_3min",
  },
  {
    id: "traitor_pass",
    nameKo: "배신자 프리패스 (환자복 스킨)",
    priceUsd: 0.99,
    priceKrw: 1100,
    kind: "iap",
    effect: "no_emergency_kick_10min",
  },
  {
    id: "custom_grave",
    nameKo: "커스텀 묘비 & 사망 이펙트",
    priceUsd: 1.99,
    priceKrw: 2500,
    kind: "iap",
    effect: "grave_skin",
  },
  {
    id: "hall_of_fame_banner",
    nameKo: "명예의 전당 전광판",
    priceUsd: 1.99,
    priceKrw: 2500,
    kind: "iap",
    effect: "banner_24h",
  },
] as const;

export type ShopItemId = (typeof SHOP_ITEMS)[number]["id"];
