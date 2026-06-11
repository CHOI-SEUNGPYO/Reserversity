
export interface IReservationRepository {
  findAll(): Promise<any>;
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  createMany(data: any[]): Promise<any>;
  update(id: string, data: any): Promise<any>;
  updateGroup(groupId: string, data: any): Promise<any>;
  delete(id: string): Promise<any>;
  deleteGroup(groupId: string): Promise<any>;
}

export interface ICategoryRepository {
  findAll(): Promise<any>;
  create(data: any): Promise<any>;
  delete(id: number): Promise<any>;
}

export interface IResourceRepository {
  findByCategory(categoryId?: number): Promise<any>;
  create(data: any): Promise<any>;
  update(id: number, data: any): Promise<any>;
  delete(id: number): Promise<any>;
}

export interface IPenaltyRepository {
  findAll(): Promise<any>;
  findByStudentId(studentId: string): Promise<any>;
  create(data: any): Promise<any>;
  delete(id: string): Promise<any>;
}
