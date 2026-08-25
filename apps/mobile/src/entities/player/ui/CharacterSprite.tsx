import React from "react";
import { View } from "react-native";
import { Canvas, Rect } from "@shopify/react-native-skia";
import { colors } from "@/shared/theme/tokens";

interface Props {
  /** 표시할 캐릭터. 스프라이트가 들어오기 전까지는 자리표시자가 같아 아직 읽지 않는다. */
  charId: string;
  /** 도트 한 칸의 픽셀 크기 */
  scale?: number;
}

/**
 * 전신 도트 캐릭터 (기획서 2.1.1 — 데이브 더 다이브 스타일).
 *
 * char_01~char_12 스프라이트는 기획서 9.4 에셋 단계에서 PixelLab으로 제작한다.
 * 그 전까지는 같은 도트 그리드를 코드로 그려 실루엣만 세워둔다 — 배경을 깐
 * 액자가 아니라 캐릭터 자체가 서 있어야 라운지에 놓았을 때와 같은 그림이 된다.
 * 에셋이 들어오면 이 파일의 GRID를 스프라이트 시트 렌더링으로 바꾸면 된다.
 */

/** 12 x 18 도트 그리드. '#'는 몸, '.'는 투명 */
const GRID = [
  "....####....",
  "...######...",
  "..########..",
  "..##.##.##..",
  "..########..",
  "...#....#...",
  "....####....",
  "...######...",
  "..########..",
  ".###.##.###.",
  ".###.##.###.",
  "..#######...",
  "...######...",
  "...##..##...",
  "...##..##...",
  "...##..##...",
  "..###..###..",
  "..###..###..",
];

const COLS = GRID[0].length;
const ROWS = GRID.length;

export function CharacterSprite({ charId, scale = 10 }: Props) {
  const width = COLS * scale;
  const height = ROWS * scale;

  return (
    <View style={{ width, height }}>
      <Canvas style={{ flex: 1 }}>
        {GRID.flatMap((row, y) =>
          row.split("").map((cell, x) =>
            cell === "#" ? (
              <Rect
                key={`${charId}-${x}-${y}`}
                x={x * scale}
                y={y * scale}
                width={scale}
                height={scale}
                color={colors.textSecondaryBright}
              />
            ) : null,
          ),
        )}
      </Canvas>
    </View>
  );
}
