import React from "react";
import { View } from "react-native";
import { Canvas, Group, Image as SkiaImage, useImage, rect, FilterMode, MipmapMode } from "@shopify/react-native-skia";

/**
 * 전신 SD 캐릭터 (기획서 2.1.1 — 큐트-흑화 카툰 스타일, 머리 위 도깨비불).
 *
 * 8프레임 정면 시점 걷기/대기 스프라이트 시트에서 한 프레임을 잘라 그린다.
 * 뒷모습 프레임이 없어서 좌우 반전만으로 왼쪽/오른쪽 이동을 표현하고, 위/아래
 * 이동은 같은 스프라이트로 위치만 바뀐다. char_01~char_12별 스프라이트는
 * 기획서 9.4 에셋 단계에서 교체한다 — 지금은 전원 같은 자리표시자를 쓴다
 * (규격은 assets/characters/CREDITS.md 참고).
 */

const WALK_STRIP = require("../../../../assets/characters/cat/walk.png");
const IDLE_STRIP = require("../../../../assets/characters/cat/idle.png");
export const CAT_FRAME_W = 60;
export const CAT_FRAME_H = 90;
export const CAT_FRAME_COUNT = 8;

// 부드러운 카툰 아트라 최근접 샘플링 대신 선형 샘플링으로 확대한다.
const SMOOTH_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };

export type CatAnimation = "walk" | "idle";

interface CatFrameProps {
  /** 표시할 프레임(0~7) */
  frame?: number;
  /** 어떤 동작 스트립을 쓸지 */
  animation?: CatAnimation;
  /** 이동 방향 연출용 좌우 반전 (정면 스프라이트라 반전해도 어색하지 않다) */
  faceRight?: boolean;
  /** 도트 1칸당 픽셀 배율 */
  scale?: number;
}

/** 스프라이트 시트에서 프레임 하나를 그리는 캔버스 (좌우 반전 지원) */
export function CatFrame({ frame = 0, animation = "idle", faceRight = false, scale = 3 }: CatFrameProps) {
  const walk = useImage(WALK_STRIP);
  const idle = useImage(IDLE_STRIP);
  const strip = animation === "walk" ? walk : idle;
  const width = CAT_FRAME_W * scale;
  const height = CAT_FRAME_H * scale;

  return (
    <View style={{ width, height }}>
      {strip && (
        <Canvas style={{ flex: 1 }}>
          <Group clip={rect(0, 0, width, height)}>
            <Group
              origin={{ x: width / 2, y: height / 2 }}
              transform={faceRight ? [] : [{ scaleX: -1 }]}
            >
              <SkiaImage
                image={strip}
                x={-frame * width}
                y={0}
                width={CAT_FRAME_COUNT * width}
                height={height}
                sampling={SMOOTH_SAMPLING}
              />
            </Group>
          </Group>
        </Canvas>
      )}
    </View>
  );
}

interface Props {
  /** 표시할 캐릭터. 스프라이트가 전원 공통 자리표시자라 아직 읽지 않는다. */
  charId: string;
  /** 도트 한 칸의 픽셀 크기 */
  scale?: number;
}

/** 정지 상태 캐릭터 (대기 화면 등) — 대기 애니메이션의 첫 프레임을 세워둔다. */
export function CharacterSprite({ charId: _charId, scale = 3 }: Props) {
  return <CatFrame animation="idle" frame={0} faceRight scale={scale} />;
}
