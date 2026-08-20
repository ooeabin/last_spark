import { PrismaClient } from "../../generated/client";

/**
 * DATABASE_URL이 아직 없는 초기 스캐폴드 단계에서도 서버가 죽지 않게
 * lazy하게 감싼다. 실행체크리스트 2단계(Supabase 계정 개설 → 실제
 * DATABASE_URL 발급)가 끝나기 전까지는 DB 관련 호출이 전부
 * console.warn으로 대체되고 서버 자체는 정상 기동한다.
 */
let client: PrismaClient | null = null;

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!client) client = new PrismaClient();
  return client;
}

export const hasDatabase = () => Boolean(process.env.DATABASE_URL);
