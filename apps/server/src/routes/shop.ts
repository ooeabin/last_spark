import type { FastifyInstance } from "fastify";
import { SHOP_ITEMS } from "@last-spark/shared";

/**
 * 상점 상품 목록(기획서 6장). 실제 결제는 클라이언트의 RevenueCat/AdMob SDK가
 * 처리하고, 이 라우트는 상품 카탈로그만 내려준다 — 결제 로직은 여기 없다.
 */
export async function shopRoutes(app: FastifyInstance) {
  app.get("/shop/items", async (_req, reply) => {
    return reply.send({ items: SHOP_ITEMS });
  });
}
