/**
 * 익명 닉네임 (기획서 2.1 — 기본 부여 후 유저가 직접 수정 가능).
 *
 * 제품 바코드처럼 보이는 영숫자 코드를 무작위로 준다. 국가별 라운지로
 * 나뉘어도 표기는 전 지역 공통이라 언어별 목록을 따로 두지 않는다.
 */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CODE_LENGTH = 6;

export function generateNickname(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return code;
}
