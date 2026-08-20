/**
 * 캐릭터 랜덤 가챠 (기획서 2.1 "라운지 입장 시 무작위로 캐릭터 1종을
 * 즉시 할당... Instant Join").
 *
 * 실제 스프라이트 10~20종은 PixelLab으로 제작 예정(기획서 9.4) —
 * 아직 에셋이 없으므로 ID만 미리 정의해두고, UI 쪽에서 에셋이
 * 준비되는 대로 charId → 스프라이트 시트 매핑을 연결한다.
 */
const CHARACTER_IDS = Array.from({ length: 12 }, (_, i) => `char_${String(i + 1).padStart(2, "0")}`);

export function rollCharacter(): string {
  return CHARACTER_IDS[Math.floor(Math.random() * CHARACTER_IDS.length)];
}

export { CHARACTER_IDS };
