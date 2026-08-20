import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import { env } from "./config/env";
import { registerSocketHandlers } from "./sockets";
import { gravestoneRoutes } from "./routes/gravestones";
import { shopRoutes } from "./routes/shop";

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: env.corsOrigin });

  app.get("/health", async () => ({
    status: "ok",
    database: env.hasDatabase ? "connected-config-present" : "not-configured (in-memory fallback)",
  }));

  await app.register(gravestoneRoutes);
  await app.register(shopRoutes);

  await app.listen({ port: env.port, host: "0.0.0.0" });

  // Socket.io는 Fastify가 만든 Node http 서버 위에 올린다.
  // 다중 인스턴스로 확장할 때는 여기에 socket.io-redis-adapter를 붙인다
  // (기획서 9.2 "Socket.io + Redis Adapter" — 아직 미연결, 단일 인스턴스 전제).
  const io = new Server(app.server, {
    cors: { origin: env.corsOrigin },
  });

  registerSocketHandlers(io);

  app.log.info(`Last Spark server listening on :${env.port}`);
  if (!env.hasDatabase) {
    app.log.warn(
      "DATABASE_URL이 설정되지 않았습니다 — 묘비 데이터는 in-memory로만 저장되고 재시작 시 사라집니다."
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
