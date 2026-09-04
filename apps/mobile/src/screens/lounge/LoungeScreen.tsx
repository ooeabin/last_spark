import React, { useState } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { MAX_CHAT_MESSAGE_LENGTH } from "@last-spark/shared";
import { useLoungeConnection } from "@/features/lounge-matching";
import { useGameStateStore, DevBatteryControls } from "@/features/battery-tracking";
import { useChat } from "@/features/proximity-chat";
import { BatteryStatusBar } from "@/widgets/status-bar";
import { usePlayerIdentity } from "@/entities/player";
import { AppText, Button, Input, ScreenContainer } from "@/shared/ui";
import { colors, spacing } from "@/shared/theme/tokens";
import { LoungeScene } from "./ui/LoungeScene";

/** B. 라운지 진입 (기획서 2.2, 4.2) — 배터리 ≤10% AND 미충전 */
export function LoungeScreen() {
  const { t } = useTranslation();
  const batteryLevel = useGameStateStore((s) => s.batteryLevel);
  const charId = usePlayerIdentity((s) => s.charId);
  const nickname = usePlayerIdentity((s) => s.nickname);
  const { room } = useLoungeConnection();
  const { bubbles, myBubble, send } = useChat();
  const [draft, setDraft] = useState("");

  const submitChat = () => {
    send(draft);
    setDraft("");
  };

  return (
    <ScreenContainer>
      <View style={{ gap: spacing.sm, flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <BatteryStatusBar batteryLevel={batteryLevel} />
          <AppText variant="small" color={colors.textSecondary}>
            {room ? `${room.roomId} · ${room.occupants}/${room.capacity}` : t("lounge.connecting")}
          </AppText>
        </View>

        {/* 라운지 씬 (기획서 2.1.1) — 어몽어스식 월드 + 추적 카메라 */}
        <LoungeScene charId={charId} nickname={nickname} bubbles={bubbles} myBubble={myBubble} />

        {/* 근접 채팅 입력 (기획서 4.2-B) — 보내면 내 머리 위 말풍선으로 뜬다 */}
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
          <Input
            value={draft}
            onChangeText={setDraft}
            placeholder={t("lounge.chatPlaceholder") ?? undefined}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            returnKeyType="send"
            onSubmitEditing={submitChat}
            style={{ flex: 1 }}
          />
          <Button label={t("lounge.chatSend")} variant="pill" onPress={submitChat} disabled={!draft.trim()} />
        </View>

        <DevBatteryControls />
      </View>
    </ScreenContainer>
  );
}
