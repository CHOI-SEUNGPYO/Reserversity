import { createRequire } from 'module';
import path from 'path';

// 개발: import.meta.url 기준, 프로덕션: app.asar.unpacked 기준으로 require 생성
// → @prisma/client 내부의 '.prisma/client/default' 상대경로가 unpacked 경로에서 해석됨
const _req = process.env.VITE_DEV_SERVER_URL
  ? createRequire(import.meta.url)
  : createRequire(path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '_placeholder.js'));
const { PrismaClient } = _req('@prisma/client');
import { IReservationRepository, ICategoryRepository, IResourceRepository, IPenaltyRepository } from '../../domain/interfaces/repositories';

const prisma = new PrismaClient();

export class PrismaReservationRepository implements IReservationRepository {
  async findAll() { return prisma.reservation.findMany(); }
  async findById(id: string) { return prisma.reservation.findUnique({ where: { id } }); }
  async create(data: any) { return prisma.reservation.create({ data }); }
  async createMany(data: any[]) { return prisma.reservation.createMany({ data }); }
  async update(id: string, data: any) { return prisma.reservation.update({ where: { id }, data }); }
  async updateGroup(groupId: string, data: any) {
    const existing = await prisma.reservation.findMany({ where: { groupId } });
    const tx = existing.map((e: any) => prisma.reservation.update({
      where: { id: e.id },
      data: { ...data, id: e.id, dateStr: e.dateStr, groupId: e.groupId }
    }));
    await prisma.$transaction(tx);
    return true;
  }
  async delete(id: string) { return prisma.reservation.delete({ where: { id } }); }
  async deleteGroup(groupId: string) { return prisma.reservation.deleteMany({ where: { groupId } }); }
}

export class PrismaCategoryRepository implements ICategoryRepository {
  async findAll() { return prisma.category.findMany(); }
  async create(data: any) { return prisma.category.create({ data }); }
  async delete(id: number) { 
    await prisma.resource.deleteMany({ where: { categoryId: id } });
    return prisma.category.delete({ where: { id } }); 
  }
}

export class PrismaResourceRepository implements IResourceRepository {
  async findByCategory(categoryId?: number) { return prisma.resource.findMany(categoryId ? { where: { categoryId } } : undefined); }
  async create(data: any) { return prisma.resource.create({ data }); }
  async update(id: number, data: any) { return prisma.resource.update({ where: { id }, data }); }
  async delete(id: number) { return prisma.resource.delete({ where: { id } }); }
}

export class PrismaPenaltyRepository implements IPenaltyRepository {
  async findAll() { return prisma.penalty.findMany(); }
  async findByStudentId(studentId: string) { return prisma.penalty.findUnique({ where: { studentId } }); }
  async create(params: any) {
    await prisma.user.upsert({
      where: { studentId: params.studentId },
      update: { name: params.name },
      create: { studentId: params.studentId, name: params.name }
    });
    return prisma.penalty.upsert({
      where: { studentId: params.studentId },
      update: { reason: params.reason, endDate: params.endDate, name: params.name },
      create: {
        studentId: params.studentId,
        name: params.name,
        reason: params.reason,
        endDate: params.endDate
      }
    });
  }
  async delete(id: string) { return prisma.penalty.delete({ where: { id } }); }
}
