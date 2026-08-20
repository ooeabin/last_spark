import { useState } from "react";

/**
 * 보상형 광고 — 산소호흡기(기획서 6장, 3분 방전 유예).
 *
 * TODO: `react-native-google-mobile-ads` 연동 (실행체크리스트 4단계,
 * AdMob 콘솔에서 광고 단위 생성 이후). 지금은 실제 광고 없이 2초
 * 딜레이로 "시청 완료"를 시뮬레이션하는 스텁이다 — 상태머신 D→B 흐름을
 * 검증하는 용도로만 쓴다.
 */
export function useRewardedAd() {
  const [isLoading, setIsLoading] = useState(false);

  const watchAd = (): Promise<boolean> => {
    setIsLoading(true);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve(true); // 스텁은 항상 시청 완료로 처리
      }, 2000);
    });
  };

  return { watchAd, isLoading };
}
