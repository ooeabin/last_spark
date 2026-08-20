/**
 * 디자인 토큰 — docs/DESIGN.md(Spotify 스타일 다크 디자인 시스템)를 기반으로 한다.
 *
 * DESIGN.md의 구조(근흑 배경 단계, 알약/원형 버튼, 두꺼운 그림자, 콤팩트한
 * 타이포 스케일, "기능색은 단 하나"라는 원칙)는 그대로 가져오되, 브랜드
 * 컬러(Spotify Green)는 이 프로젝트 고유의 네온 사이버펑크 톤으로
 * 대체했다 — 기획서 3.1 "사이버펑크 폐허 바" 테마와 맞추기 위함이다.
 *
 * accent 값은 placeholder다. 기획서 9.4 "아트 디렉션 고정" 단계(색상
 * 팔레트 5~6색 확정)가 끝나면 이 파일의 accent/neon 값을 실제 확정
 * 팔레트로 교체해야 한다.
 */

export const colors = {
  // Base — DESIGN.md 2절 "Primary Brand" 근흑 스케일 그대로
  background: "#121212", // Level 0 — 가장 깊은 배경
  surface: "#181818", // Level 1 — 카드, 컨테이너
  surfaceAlt: "#1f1f1f", // Level 1 — 버튼/인터랙티브 표면
  card: "#252525",
  cardAlt: "#272727",

  // Text — DESIGN.md 2절 "Text"
  textPrimary: "#ffffff",
  textSecondary: "#b3b3b3",
  textSecondaryBright: "#cbcbcb",
  textEmphasis: "#fdfdfd",

  // Border
  border: "#4d4d4d",
  borderLight: "#7c7c7c",
  separator: "#b3b3b3",

  // Semantic — DESIGN.md 2절 "Semantic" 그대로(경고/에러/안내 색은 앱 도메인과 무관해 유지)
  negative: "#f3727f", // 방전 임박, 에러
  warning: "#ffa42b", // 배터리 주의 구간(5~3%)
  announcement: "#539df5", // 시스템 메시지

  /**
   * accent — Spotify Green(#1ed760) 자리를 대신하는 이 프로젝트의
   * 단일 기능색. 사이버펑크 라운지 테마에 맞춰 네온 시안으로 잡은
   * placeholder다. 실제 확정 팔레트가 나오면 교체.
   */
  accent: "#00f0ff",
  accentBorder: "#00c2d1",
} as const;

/** DESIGN.md 6절 Depth & Elevation 그대로 (React Native shadow 근사치) */
export const elevation = {
  base: { backgroundColor: colors.background },
  surface: { backgroundColor: colors.surface },
  elevated: {
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8, // Android
  },
  dialog: {
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
} as const;

/** DESIGN.md 5절 Spacing System — 8px 베이스 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

/** DESIGN.md 5절 Border Radius Scale */
export const radius = {
  badge: 2,
  input: 4,
  card: 6,
  dialog: 8,
  panel: 16,
  pillLarge: 100,
  pill: 500,
  fullPill: 9999,
  circle: 9999, // RN에는 %가 없어 큰 값 + 정사각형으로 원 처리
} as const;

/** DESIGN.md 3절 Typography — RN 환경에 맞게 폰트 패밀리는 시스템 폰트로 대체 */
export const typography = {
  sectionTitle: { fontSize: 24, fontWeight: "700" as const },
  featureHeading: { fontSize: 18, fontWeight: "600" as const, lineHeight: 18 * 1.3 },
  bodyBold: { fontSize: 16, fontWeight: "700" as const },
  body: { fontSize: 16, fontWeight: "400" as const },
  buttonUppercase: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 1.4,
    textTransform: "uppercase" as const,
  },
  caption: { fontSize: 14, fontWeight: "400" as const },
  captionBold: { fontSize: 14, fontWeight: "700" as const, lineHeight: 14 * 1.5 },
  small: { fontSize: 12, fontWeight: "400" as const },
  smallBold: { fontSize: 12, fontWeight: "700" as const },
  micro: { fontSize: 10, fontWeight: "400" as const },
} as const;

export const theme = { colors, elevation, spacing, radius, typography };
export type Theme = typeof theme;
