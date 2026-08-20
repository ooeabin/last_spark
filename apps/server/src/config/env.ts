export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  roomCapacity: Number(process.env.ROOM_CAPACITY ?? 30),
  hasDatabase: Boolean(process.env.DATABASE_URL),
};
