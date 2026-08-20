import type { CountryCode, LoungeRoom, Player } from "@last-spark/shared";

const ROOM_CAPACITY = Number(process.env.ROOM_CAPACITY ?? 30);

/**
 * 국가별 룸 매칭 + 정원 초과 시 같은 국가 내 N호점 자동 생성
 * (기획서 3.1 "룸 매칭"/"수용 인원").
 *
 * 비주얼 테마는 전 국가 공통(단일 통일 테마)이지만 룸 매칭 자체는
 * 국가/지역별로 분리한다 — 언어 장벽 차단이 목적이므로 여기서
 * 국가를 절대 섞지 않는다.
 */
export class RoomManager {
  private rooms = new Map<string, LoungeRoom>();
  private players = new Map<string, Player>();

  /** countryCode 기준으로 정원이 남은 룸을 찾거나, 없으면 새 분점을 만든다 */
  assignRoom(countryCode: CountryCode): LoungeRoom {
    const branches = [...this.rooms.values()]
      .filter((r) => r.countryCode === countryCode)
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));

    const openRoom = branches.find((r) => r.occupants < r.capacity);
    if (openRoom) return openRoom;

    const nextIndex = branches.length + 1;
    const newRoom: LoungeRoom = {
      id: `${countryCode}-${nextIndex}`,
      countryCode,
      capacity: ROOM_CAPACITY as 30,
      occupants: 0,
    };
    this.rooms.set(newRoom.id, newRoom);
    return newRoom;
  }

  joinRoom(player: Player, roomId: string) {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error(`room ${roomId} not found`);
    room.occupants += 1;
    player.roomId = roomId;
    this.players.set(player.id, player);
    return room;
  }

  leaveRoom(playerId: string) {
    const player = this.players.get(playerId);
    if (!player?.roomId) return;
    const room = this.rooms.get(player.roomId);
    if (room) room.occupants = Math.max(0, room.occupants - 1);
    player.roomId = null;
  }

  getPlayer(playerId: string) {
    return this.players.get(playerId) ?? null;
  }

  getRoom(roomId: string) {
    return this.rooms.get(roomId) ?? null;
  }

  removePlayer(playerId: string) {
    this.leaveRoom(playerId);
    this.players.delete(playerId);
  }
}

export const roomManager = new RoomManager();
