import React, { useMemo, useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { CAT_FRAME_W, CAT_FRAME_H } from "@/entities/player";
import { useLocalMovement, useRemotePlayers } from "@/features/free-roam";
import { radius } from "@/shared/theme/tokens";
import { PlayerAvatar } from "./PlayerAvatar";

/**
 * 라운지 씬 (기획서 2.1.1 — 손그림 룸 배경 + SD 동물 캐릭터, 전 영역 자유 이동).
 *
 * 배경은 겹쳐 깔린 4장의 룸 레이어(베이스→벽 장식→바닥 소품→비네팅)를 Skia로 합성한다.
 * 화면을 탭하면 그 지점을 목표로 내 캐릭터가 걸어가고(useLocalMovement),
 * 같은 룸의 다른 플레이어는 player:sync_move로 받은 좌표를 보간해서 함께
 * 그린다(useRemotePlayers). 좌표는 필드 폭/높이로 정규화해 소켓에 실어
 * 보내므로 기기마다 화면 크기가 달라도 상대 위치가 어긋나지 않는다.
 *
 * 탭 인식은 RN 코어의 responder 방식 대신 react-native-gesture-handler를
 * 쓴다 — ScreenContainer가 키보드 dismiss용으로 화면 전체를
 * TouchableWithoutFeedback으로 감싸고 있어서, 코어 responder 협상에 맡기면
 * 그 바깥쪽 핸들러와 얽혀 탭이 씬까지 도달하지 못하는 경우가 있다.
 * GestureDetector는 별도의 네이티브 제스처 인식기라 이 문제에서 자유롭다.
 */

// 부드러운 손그림 카툰 배경이라 선형 샘플링으로 확대한다 (픽셀 아트 아님)
const SMOOTH_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
const AVATAR_SCALE = 2.4;
const CHAR_SIZE = { width: CAT_FRAME_W * AVATAR_SCALE, height: CAT_FRAME_H * AVATAR_SCALE };

interface Props {
  /** 이번 세션 캐릭터 id */
  charId: string;
  nickname: string;
}

export function LoungeScene({ charId: _charId, nickname }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const base = useImage(require("../../../../assets/background/room-base.png"));
  const wallDecor = useImage(require("../../../../assets/background/wall-decor.png"));
  const floorProps = useImage(require("../../../../assets/background/floor-props.png"));
  const vignette = useImage(require("../../../../assets/background/vignette.png"));
  const images = [base, wallDecor, floorProps, vignette];

  const local = useLocalMovement(size, CHAR_SIZE);
  const remotePlayers = useRemotePlayers();

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const { moveTo } = local;
  // local(useLocalMovement의 반환값)은 매 틱(60ms)마다 갱신되어 이 컴포넌트도 같이
  // 리렌더된다 — Gesture 객체를 매번 새로 만들면 GestureDetector가 계속 재부착되며
  // 탭 인식이 불안정해지므로, 참조가 바뀌지 않는 moveTo에만 의존해 메모이즈한다.
  const tapGesture = useMemo(
    () =>
      Gesture.Tap().onEnd((e) => {
        runOnJS(moveTo)(e.x, e.y);
      }),
    [moveTo],
  );

  const bgReady = size.width > 0 && images.every((img) => img !== null);

  return (
    <GestureDetector gesture={tapGesture}>
      <View style={styles.container} onLayout={onLayout}>
        {bgReady && (
          <Canvas style={StyleSheet.absoluteFill}>
            {images.map((img, i) => (
              <SkiaImage
                key={i}
                image={img}
                x={0}
                y={0}
                width={size.width}
                height={size.height}
                fit="cover"
                sampling={SMOOTH_SAMPLING}
              />
            ))}
          </Canvas>
        )}

        {remotePlayers.map((p) => (
          <PlayerAvatar
            key={p.playerId}
            x={p.x * size.width}
            y={p.y * size.height}
            animation={p.animation}
            frame={p.frame}
            faceRight={p.faceRight}
            nickname={p.nickname}
            scale={AVATAR_SCALE}
          />
        ))}

        <PlayerAvatar
          x={local.x}
          y={local.y}
          animation={local.animation}
          frame={local.frame}
          faceRight={local.faceRight}
          nickname={nickname}
          isSelf
          scale={AVATAR_SCALE}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.dialog,
    overflow: "hidden",
  },
});
