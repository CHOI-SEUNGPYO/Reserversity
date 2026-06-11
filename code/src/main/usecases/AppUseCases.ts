
import { IReservationRepository, ICategoryRepository, IResourceRepository, IPenaltyRepository } from '../domain/interfaces/repositories';

export class AppUseCases {
  constructor(
    private reservationRepo: IReservationRepository,
    private categoryRepo: ICategoryRepository,
    private resourceRepo: IResourceRepository,
    private penaltyRepo: IPenaltyRepository
  ) {}

  async listReservations() { return this.reservationRepo.findAll(); }

  // 두 예약의 시간이 겹치는지 검사 (닿기만 하는 건 허용)
  private overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return aStart < bEnd && aEnd > bStart;
  }

  private fmtTime(h: number) {
    const hh = Math.floor(h);
    const mm = Math.round((h % 1) * 60);
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  // 충돌하는 기존 예약을 찾아 에러 메시지 반환 (없으면 null)
  private findConflict(allReservations: any[], newRes: any, excludeId?: string): string | null {
    for (const existing of allReservations) {
      if (excludeId && existing.id === excludeId) continue;

      const sameResource = (newRes.resourceId != null && existing.resourceId != null)
        ? Number(existing.resourceId) === Number(newRes.resourceId)
        : existing.resourceName === newRes.resourceName;

      if (
        sameResource &&
        existing.dateStr === newRes.dateStr &&
        this.overlaps(newRes.startHour, newRes.endHour, existing.startHour, existing.endHour)
      ) {
        return `시간 중복: "${newRes.resourceName}"(${newRes.dateStr})에 이미 ${existing.author}님의 예약(${this.fmtTime(existing.startHour)}~${this.fmtTime(existing.endHour)})이 있습니다.`;
      }
    }
    return null;
  }

  async createReservation(data: any, forceApprove = false) {
    if (!forceApprove) {
      // 제재 사용자 체크
      const authorId = Array.isArray(data) ? data[0]?.authorId : data.authorId;
      if (authorId) {
        const penalty = await this.penaltyRepo.findByStudentId(authorId);
        if (penalty) {
          const today = new Date().toISOString().split('T')[0];
          if (penalty.endDate >= today) {
            throw new Error(`예약 차단: 해당 사용자는 ${penalty.endDate}까지 제재 상태입니다. (사유: ${penalty.reason})`);
          }
        }
      }

      // 시간 중복 체크
      const toCheck: any[] = Array.isArray(data) ? data : [data];
      const allReservations = await this.reservationRepo.findAll() as any[];

      for (let i = 0; i < toCheck.length; i++) {
        const newRes = toCheck[i];

        // DB 기존 예약과 충돌 확인
        const conflict = this.findConflict(allReservations, newRes);
        if (conflict) throw new Error(conflict);

        // 배치 내 다른 항목과 충돌 확인 (반복 예약 내 중복 방지)
        for (let j = 0; j < i; j++) {
          const prev = toCheck[j];
          const sameResource = (newRes.resourceId != null && prev.resourceId != null)
            ? Number(prev.resourceId) === Number(newRes.resourceId)
            : prev.resourceName === newRes.resourceName;

          if (
            sameResource &&
            prev.dateStr === newRes.dateStr &&
            this.overlaps(newRes.startHour, newRes.endHour, prev.startHour, prev.endHour)
          ) {
            throw new Error(`시간 중복: 신규 반복 예약 내에 "${newRes.resourceName}"(${newRes.dateStr})에 겹치는 일정이 있습니다.`);
          }
        }
      }
    }

    return Array.isArray(data) ? this.reservationRepo.createMany(data) : this.reservationRepo.create(data);
  }

  async updateReservation(id: string, data: any, updateGroup?: boolean) {
    // 단일 수정 시 시간 중복 체크 (자기 자신 제외)
    if (!updateGroup) {
      const allReservations = await this.reservationRepo.findAll() as any[];
      const conflict = this.findConflict(allReservations, data, id);
      if (conflict) throw new Error(conflict);
    }
    return updateGroup && data.groupId ? this.reservationRepo.updateGroup(data.groupId, data) : this.reservationRepo.update(id, data);
  }

  async deleteReservation(id: string, deleteGroup?: boolean) {
    if (deleteGroup) {
      const res = await this.reservationRepo.findById(id);
      if (res && res.groupId) {
        return this.reservationRepo.deleteGroup(res.groupId);
      }
    }
    return this.reservationRepo.delete(id);
  }

  get category() { return this.categoryRepo; }
  get resource() { return this.resourceRepo; }
  get penalty() { return this.penaltyRepo; }
}
