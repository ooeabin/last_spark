/**
 * 익명 닉네임 템플릿 (기획서 2.1 "닉네임은 기기 설정 언어 기반 익명
 * 템플릿... 기본 부여, 유저가 직접 수정 가능").
 *
 * 실제 서비스에서는 언어별 템플릿을 훨씬 풍부하게 갖춰야 하지만,
 * 스타터 단계에서는 각 지원 언어(ko/en/ja/es)별로 최소 셋만 둔다.
 */
const TEMPLATES: Record<string, string[]> = {
  ko: ["배터리 4% 남은 고양이", "야근 3일차 직장인", "방전 직전 올빼미"],
  en: ["Cat at 4% Battery", "3rd Night of Overtime", "Owl About to Die"],
  ja: ["残量4%の猫", "残業3日目の会社員", "消える寸前のフクロウ"],
  es: ["Gato al 4% de batería", "3ra noche de horas extra", "Búho a punto de apagarse"],
};

export function generateNickname(locale: string): string {
  const pool = TEMPLATES[locale] ?? TEMPLATES.en;
  return pool[Math.floor(Math.random() * pool.length)];
}
