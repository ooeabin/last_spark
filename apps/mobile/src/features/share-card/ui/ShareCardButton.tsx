import React, { useRef } from "react";
import { View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/ui";
import { spacing } from "@/shared/theme/tokens";

interface Props {
  /** 캡처 대상(9:16 결과 카드) 참조를 이 컴포넌트가 감싼 children으로 받는다 */
  children: React.ReactNode;
  onShared?: (uri: string) => void;
}

/**
 * 9:16 SNS 공유 이미지 캡처/저장 (기획서 4.1, 7장 — `react-native-view-shot`).
 * TODO: 캡처된 uri를 실제 공유 시트(react-native-share 등)로 넘기는 부분은
 * 아직 없다 — 지금은 캡처까지만 동작한다.
 */
export function ShareCardButton({ children, onShared }: Props) {
  const { t } = useTranslation();
  const viewRef = useRef<View>(null);

  const handleShare = async () => {
    if (!viewRef.current) return;
    const uri = await captureRef(viewRef, { format: "png", quality: 1 });
    onShared?.(uri);
  };

  return (
    <View style={{ gap: spacing.md }}>
      <View ref={viewRef} collapsable={false}>
        {children}
      </View>
      <Button label={t("death.shareCta")} variant="primaryLarge" onPress={handleShare} />
    </View>
  );
}
