import React, { useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import { Canvas, Image as SkiaImage, useImage, FilterMode, MipmapMode } from "@shopify/react-native-skia";
import { CAT_FRAME_W, CAT_FRAME_H } from "@/entities/player";
import { useLocalMovement, useRemotePlayers, WORLD_WIDTH, WORLD_HEIGHT, getRoomAt } from "@/features/free-roam";
import { radius } from "@/shared/theme/tokens";
import { PlayerAvatar } from "./PlayerAvatar";
import { Joystick } from "./Joystick";
import { RoomTransition } from "./RoomTransition";

/**
 * 라운지 씬 (기획서 2.1.1 — 손그림 룸 배경 + SD 동물 캐릭터, 전 영역 자유 이동).
 *
 * 어몽어스식 구성: 맵(월드)은 화면보다 넓은 고정 크기(WORLD_WIDTH/HEIGHT)이고,
 * 카메라가 내 캐릭터를 따라가며 월드의 일부만 보여준다. 배경 3장(베이스→벽
 * 장식→바닥 소품)은 월드 좌표에 깔리고, 비네팅만 카메라와 무관하게 화면에
 * 고정으로 덮인다. 이동은 왼쪽 아래 가상 조이스틱으로 조작한다(useLocalMovement).
 * 같은 룸의 다른 플레이어는 player:sync_move로 받은 좌표를 보간해서 함께
 * 그린다(useRemotePlayers). 좌표는 월드 크기로 정규화해 소켓에 실어 보내므로
 * 기기마다 화면 크기가 달라도 상대 위치가 어긋나지 않는다.
 */

// 부드러운 손그림 카툰 배경이라 선형 샘플링으로 확대한다 (픽셀 아트 아님)
const SMOOTH_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
const AVATAR_SCALE = 1.2;
const CHAR_SIZE = { width: CAT_FRAME_W * AVATAR_SCALE, height: CAT_FRAME_H * AVATAR_SCALE };

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), Math.max(min, max));

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
  const worldLayers = [base, wallDecor, floorProps];

  const local = useLocalMovement(CHAR_SIZE);
  const remotePlayers = useRemotePlayers();

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  // 카메라: 내 캐릭터를 화면 중앙에 두되, 월드 가장자리에서는 더 못 나가게 클램프
  const camX = clamp(local.x - size.width / 2, 0, WORLD_WIDTH - size.width);
  const camY = clamp(local.y - size.height / 2, 0, WORLD_HEIGHT - size.height);

  const bgReady = size.width > 0 && worldLayers.every((img) => img !== null) && vignette !== null;

  return (
    <View style={styles.container} onLayout={onLayout}>
      {bgReady && (
        <Canvas style={StyleSheet.absoluteFill}>
          {worldLayers.map((img, i) => (
            <SkiaImage
              key={i}
              image={img}
              x={-camX}
              y={-camY}
              width={WORLD_WIDTH}
              height={WORLD_HEIGHT}
              fit="fill"
              sampling={SMOOTH_SAMPLING}
            />
          ))}
        </Canvas>
      )}

      {remotePlayers.map((p) => (
        <PlayerAvatar
          key={p.playerId}
          x={p.x * WORLD_WIDTH - camX}
          y={p.y * WORLD_HEIGHT - camY}
          animation={p.animation}
          frame={p.frame}
          faceRight={p.faceRight}
          nickname={p.nickname}
          scale={AVATAR_SCALE}
        />
      ))}

      <PlayerAvatar
        x={local.x - camX}
        y={local.y - camY}
        animation={local.animation}
        frame={local.frame}
        faceRight={local.faceRight}
        nickname={nickname}
        isSelf
        scale={AVATAR_SCALE}
      />

      {/* 화면 고정 비네팅 — 캐릭터 위에 덮여 어스름한 조명 톤을 만든다 */}
      {bgReady && (
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkiaImage
            image={vignette}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fit="fill"
            sampling={SMOOTH_SAMPLING}
          />
        </Canvas>
      )}

      <RoomTransition roomKey={getRoomAt(local.x, local.y)} />

      <Joystick onMove={local.setVelocity} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: radius.dialog,
    overflow: "hidden",
  },
});
