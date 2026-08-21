import { create } from "zustand";
import type { LoungeJoinedPayload } from "@last-spark/shared";

interface RoomStore {
  room: LoungeJoinedPayload | null;
  setRoom: (room: LoungeJoinedPayload | null) => void;
  updateOccupants: (roomId: string, occupants: number) => void;
}

/**
 * 룸 배정 결과(lounge:joined)를 화면 간 공유하기 위한 스토어.
 * 소켓 연결/입장 자체는 useRoomConnection이 관리하고, 이 스토어는
 * 그 결과만 들고 있는다 — LoungeScreen이 직접 소켓을 구독하지 않아도
 * 되게 하기 위함(2026-08 소켓 생명주기 버그 수정과 함께 분리).
 */
export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  setRoom: (room) => set({ room }),
  updateOccupants: (roomId, occupants) => {
    const { room } = get();
    if (room && room.roomId === roomId) set({ room: { ...room, occupants } });
  },
}));
