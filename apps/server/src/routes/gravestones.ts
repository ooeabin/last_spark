import type { FastifyInstance } from "fastify";
import { listGravestonesByCountry } from "../db/gravestoneRepository";

/** 기획서 4.1 "명예의 묘비 갤러리" — 자국 유저들의 유언 목록(좋아요 정렬) */
export async function gravestoneRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { countryCode?: string; limit?: string } }>(
    "/gravestones",
    async (req, reply) => {
      const countryCode = req.query.countryCode ?? "GL";
      const limit = Number(req.query.limit ?? 50);
      const gravestones = await listGravestonesByCountry(countryCode, limit);
      return reply.send({ gravestones });
    }
  );
}
