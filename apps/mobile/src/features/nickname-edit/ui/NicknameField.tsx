import React from "react";
import { MAX_NICKNAME_LENGTH } from "@last-spark/shared";
import { usePlayerIdentity } from "@/entities/player";
import { Input } from "@/shared/ui";
import { spacing } from "@/shared/theme/tokens";

/**
 * 대기 화면에서 닉네임을 직접 고치는 입력 (기획서 2.1).
 *
 * 편집 모드 토글 없이 항상 입력 가능한 상태로 둔다 — 탭 한 번에 바로
 * 고칠 수 있고, "수정" 버튼 같은 별도 UI를 화면에 더하지 않아도 된다.
 */
export function NicknameField() {
  const nickname = usePlayerIdentity((s) => s.nickname);
  const setNickname = usePlayerIdentity((s) => s.setNickname);

  return (
    <Input
      value={nickname}
      onChangeText={setNickname}
      maxLength={MAX_NICKNAME_LENGTH}
      textAlign="center"
      selectTextOnFocus
      accessibilityLabel="닉네임"
      style={{ minWidth: 160, paddingVertical: spacing.sm }}
    />
  );
}
