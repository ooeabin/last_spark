import { randomUUID } from "node:crypto";
import { getPrisma } from "./prismaClient";
import type { Gravestone } from "@last-spark/shared";

/**
 * 묘비 저장/조회 (기획서 4.2-C: "0% 도달 또는 연결 종료 시 해당 좌표에
 * 묘비 에셋 생성, 유언장 아카이브 테이블에 영구 저장").
 *
 * DATABASE_URL이 없으면 in-memory 배열로 폴백한다 — 로컬에서
 * `npm run dev`만으로 바로 동작 확인이 되도록 하기 위함. 실 서비스로
 * 갈 때는 반드시 DATABASE_URL을 설정해 Postgres에 영구 저장해야 한다.
 */
const memoryStore: Gravestone[] = [];

export async function createGravestone(
  input: Omit<Gravestone, "id" | "createdAt" | "likesCount">
): Promise<Gravestone> {
  const prisma = getPrisma();

  if (!prisma) {
    const fallback: Gravestone = {
      ...input,
      id: randomUUID(),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };
    memoryStore.unshift(fallback);
    console.warn(
      "[gravestoneRepository] DATABASE_URL 미설정 — in-memory로만 저장됨:",
      fallback.nickname
    );
    return fallback;
  }

  const row = await prisma.gravestone.create({
    data: {
      countryCode: input.countryCode,
      nickname: input.nickname,
      lastWords: input.lastWords,
      skinId: input.skinId,
      graveType: input.graveType,
    },
  });

  return {
    id: row.id,
    countryCode: row.countryCode,
    nickname: row.nickname,
    lastWords: row.lastWords,
    skinId: row.skinId,
    graveType: row.graveType as Gravestone["graveType"],
    likesCount: row.likesCount,
    createdAt: row.createdAt.toISOString(),
  };
}

/** 명예의 묘비 갤러리(기획서 4.1) — 자국 유저들의 최근 유언, 좋아요순 */
export async function listGravestonesByCountry(
  countryCode: string,
  limit = 50
): Promise<Gravestone[]> {
  const prisma = getPrisma();

  if (!prisma) {
    return memoryStore
      .filter((g) => g.countryCode === countryCode)
      .sort((a, b) => b.likesCount - a.likesCount)
      .slice(0, limit);
  }

  const rows = await prisma.gravestone.findMany({
    where: { countryCode },
    orderBy: { likesCount: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    countryCode: row.countryCode,
    nickname: row.nickname,
    lastWords: row.lastWords,
    skinId: row.skinId,
    graveType: row.graveType as Gravestone["graveType"],
    likesCount: row.likesCount,
    createdAt: row.createdAt.toISOString(),
  }));
}
