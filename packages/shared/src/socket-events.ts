/**
 * Socket.io 실시간 이벤트 명세 (기획서 5.2)
 *
 * mobile의 소켓 클라이언트와 server의 소켓 핸들러가 이 타입을 그대로
 * import해서 쓴다 — 이벤트 이름이나 페이로드 shape이 어긋나는 걸
 * 컴파일 타임에 잡기 위함.
 */

export type CountryCode = "KR" | "US" | "JP" | "GL" | (string & {});

/** C → S : 국가/지역 라운지 룸 입장 요청 */
export interface LoungeJoinPayload {
  countryCode: CountryCode;
  batteryLevel: number;
  charId: string;
  nickname: string;
}

/** S → C : 입장 성공 응답 (룸 배정 결과) */
export interface LoungeJoinedPayload {
  roomId: string; // 예: "KR-1", "KR-2"(정원 초과 분점), "GL-1"
  countryCode: CountryCode;
  capacity: number; // 30
  occupants: number;
}

/** C → S : 2D 좌표 이동 상태 동기화 */
export interface PlayerSyncMovePayload {
  x: number;
  y: number;
  direction: "up" | "down" | "left" | "right";
}

/** C → S : 배터리 1% 감소 시 서버 전달 */
export interface BatteryChangePayload {
  batteryLevel: number;
}

/** S → C : 충전 감지 알림, 10초 카운트다운/사이렌 발동 */
export interface EmergencyStartPayload {
  playerId: string;
  timer: 10;
}

/** S → C : 10초 내 분리 성공, 정상 상태 복귀 */
export interface EmergencyCancelPayload {
  playerId: string;
}

/** S → C : 10초 초과 시 낙뢰 처형 연출 브로드캐스트, 강제 퇴장 */
export interface TraitorExecutePayload {
  playerId: string;
}

/** S → C : 1% 제단 유언을 라운지 전체 배너로 송출 */
export interface AltarBroadcastPayload {
  nickname: string;
  message: string; // 최대 30자
}

/** C → S : 제단에서 유언 작성 요청 (서버가 검증 후 altar:broadcast로 전체 송출) */
export interface AltarSubmitPayload {
  message: string; // 최대 30자
}

/** S → C : 다른 플레이어 입장/퇴장 알림 (룸 프레즌스 동기화용 — 5.2 확장) */
export interface PresenceUpdatePayload {
  roomId: string;
  occupants: number;
}

/**
 * 클라이언트 → 서버 이벤트 맵.
 * socket.emit()의 이름/페이로드 타입을 여기서 강제한다.
 */
export interface ClientToServerEvents {
  "lounge:join": (payload: LoungeJoinPayload) => void;
  "player:sync_move": (payload: PlayerSyncMovePayload) => void;
  "battery:change": (payload: BatteryChangePayload) => void;
  "altar:submit": (payload: AltarSubmitPayload) => void;
  "emergency:detach": () => void; // 충전기 분리(생존) 신호
}

/**
 * 서버 → 클라이언트 이벤트 맵.
 */
export interface ServerToClientEvents {
  "lounge:joined": (payload: LoungeJoinedPayload) => void;
  "player:sync_move": (payload: PlayerSyncMovePayload & { playerId: string }) => void;
  "emergency:start": (payload: EmergencyStartPayload) => void;
  "emergency:cancel": (payload: EmergencyCancelPayload) => void;
  "traitor:execute": (payload: TraitorExecutePayload) => void;
  "altar:broadcast": (payload: AltarBroadcastPayload) => void;
  "presence:update": (payload: PresenceUpdatePayload) => void;
}
