import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { socketServerUrl?: string };

export const env = {
  /** apps/server가 떠 있는 주소. app.json extra.socketServerUrl로 배포 시 교체 */
  socketServerUrl: extra.socketServerUrl ?? "http://localhost:4000",
};
