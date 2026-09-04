import React, { useState } from "react";
import { View, StyleSheet, type LayoutChangeEvent } from "react-native";
import {
  Canvas,
  Image as SkiaImage,
  Rect,
  LinearGradient,
  vec,
  useImage,
  FilterMode,
  MipmapMode,
} from "@shopify/react-native-skia";
import { WORLD_WIDTH, WORLD_HEIGHT } from "@/features/free-roam";
import { colors, radius } from "@/shared/theme/tokens";

/**
 * 대기 화면 중앙 무대 — 라운지(잿불 홀)의 화로 앞을 잘라 배경으로 깔고,
 * 그 위에 내 캐릭터·닉네임·상태 텍스트를 올린다. "입장하면 저기로 들어간다"를
 * 입장 전에 미리 보여주는 창 역할이라, 라운지 씬과 같은 배경 에셋을 그대로 쓴다.
 *
 * 배경 전체를 어둡게 덮는 대신 아래쪽만 배경색으로 흘러내리는 그라데이션을
 * 깔아서, 위쪽은 잿불 조명이 살아 있고 아래쪽 텍스트·입력은 또렷하게 읽힌다.
 */

const SMOOTH_SAMPLING = { filter: FilterMode.Linear, mipmap: MipmapMode.None };
/** 배경에서 보여줄 초점(월드 좌표) — 잿불 홀 화로와 러그 사이 */
const FOCUS_X = 360;
const FOCUS_Y = 820;
/** 무대 폭에 담을 월드 가로 범위(pt) — 작을수록 확대되어 보인다 */
const VIEW_WORLD_WIDTH = 460;

interface Props {
  children: React.ReactNode;
}

export function WaitingStage({ children }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const base = useImage(require("../../../../assets/background/room-base.png"));
  const floorProps = useImage(require("../../../../assets/background/floor-props.png"));
  const vignette = useImage(require("../../../../assets/background/vignette.png"));

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const scale = size.width / VIEW_WORLD_WIDTH;
  const ready = size.width > 0 && base !== null && floorProps !== null && vignette !== null;

  return (
    <View style={styles.stage} onLayout={onLayout}>
      {ready && (
        <Canvas style={StyleSheet.absoluteFill}>
          {[base, floorProps].map((img, i) => (
            <SkiaImage
              key={i}
              image={img}
              x={size.width / 2 - FOCUS_X * scale}
              y={size.height / 2 - FOCUS_Y * scale}
              width={WORLD_WIDTH * scale}
              height={WORLD_HEIGHT * scale}
              fit="fill"
              sampling={SMOOTH_SAMPLING}
            />
          ))}
          <SkiaImage
            image={vignette}
            x={0}
            y={0}
            width={size.width}
            height={size.height}
            fit="fill"
            sampling={SMOOTH_SAMPLING}
          />
          {/* 하단 그라데이션 — 컨트롤 영역을 화면 배경색으로 자연스럽게 잇는다 */}
          <Rect x={0} y={size.height * 0.45} width={size.width} height={size.height * 0.55}>
            <LinearGradient
              start={vec(0, size.height * 0.45)}
              end={vec(0, size.height)}
              colors={[`${colors.background}00`, colors.background]}
            />
          </Rect>
        </Canvas>
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    borderRadius: radius.panel,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
  },
});
