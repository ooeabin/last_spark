/**
 * 익명 닉네임 (기획서 2.1 — 기본 부여 후 유저가 직접 수정 가능).
 *
 * 짧은 이름 하나를 무작위로 준다. 국가별 라운지로 나뉘어도 표기는 전 지역
 * 공통이라 언어별 목록을 따로 두지 않는다.
 */
const NAMES = [
  "미아",
  "레오",
  "노아",
  "루나",
  "마일로",
  "노라",
  "엘리",
  "아이리스",
  "휴고",
  "클레오",
  "오토",
  "베라",
  "테오",
  "이든",
  "리아",
  "펠릭스",
] as const;

export function generateNickname(): string {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}
