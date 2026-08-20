import * as Localization from "expo-localization";
import type { CountryCode } from "@last-spark/shared";

/**
 * 기기 Locale/IP 기반 국가 코드 판별 (기획서 3.1 "룸 매칭").
 *
 * 스타터 단계에서는 기기 Locale의 region만 사용한다. 실서비스에서는
 * VPN/여행객으로 인한 오차(기획서 8장 "국가/IP 기반 매칭의 정확도"
 * 리스크)를 감안해 서버 측에서 IP 기반 판별을 병행하고, 모호하면
 * GL 버킷으로 폴백하는 로직을 추가해야 한다.
 */
const SUPPORTED_ROOM_COUNTRIES = ["KR", "US", "JP"];

export function detectCountryCode(): CountryCode {
  const region = Localization.getLocales()[0]?.regionCode ?? undefined;
  if (region && SUPPORTED_ROOM_COUNTRIES.includes(region)) return region as CountryCode;
  return "GL";
}
