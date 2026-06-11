import { ipcMain, dialog, BrowserWindow } from 'electron';
import * as fs from 'fs';
import { AppUseCases } from '../../usecases/AppUseCases';
import { PrismaReservationRepository, PrismaCategoryRepository, PrismaResourceRepository, PrismaPenaltyRepository } from '../../infrastructure/database/PrismaRepositories';

export function setupIpcHandlers() {
  const reservationRepo = new PrismaReservationRepository();
  const categoryRepo = new PrismaCategoryRepository();
  const resourceRepo = new PrismaResourceRepository();
  const penaltyRepo = new PrismaPenaltyRepository();
  
  const appUseCases = new AppUseCases(reservationRepo, categoryRepo, resourceRepo, penaltyRepo);

  // === DIALOG ===
  // window.confirm() 대신 사용: 메인 프로세스에서 다이얼로그를 열어 포커스 문제 방지
  ipcMain.handle('dialog:confirm', async (event, message: string) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const { response } = await dialog.showMessageBox(win!, {
      type: 'question',
      buttons: ['확인', '취소'],
      defaultId: 0,
      cancelId: 1,
      message,
    });
    // 다이얼로그 닫힌 후 명시적으로 윈도우 포커스 복구
    win?.focus();
    return response === 0;
  });

  ipcMain.handle('reservation:list', async () => {
    try {
      const data = await appUseCases.listReservations();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reservation:create', async (_, params, forceApprove = false) => {
    try {
      const data = await appUseCases.createReservation(params, forceApprove);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reservation:export', async () => {
    try {
      const data = await appUseCases.listReservations();
      const categories = await appUseCases.category.findAll();
      
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: '예약 내역 내보내기',
        defaultPath: 'reservations.csv',
        filters: [{ name: 'CSV Files', extensions: ['csv'] }]
      });
      
      if (!canceled && filePath) {
        let csv = "ID,카테고리,자원명,예약일,시작시간,종료시간,제목,예약자,학번,승인자,상태\n";
        for (const r of data) {
          // r.category stores the category ID, so we need to find the category name
          const categoryObj = categories.find((c: any) => c.id.toString() === r.category?.toString());
          const categoryName = categoryObj ? categoryObj.name : r.category;
          
          csv += `${r.id},${categoryName},${r.resourceName},${r.dateStr},${r.startHour},${r.endHour},${r.title},${r.author},${r.authorId || ''},${r.approver},${r.status}\n`;
        }
        fs.writeFileSync(filePath, '\uFEFF' + csv, 'utf8');
        return { success: true, filePath };
      }
      return { success: false, error: 'Cancelled' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reservation:update', async (_, { id, data, updateGroup }) => {
    try {
      const result = await appUseCases.updateReservation(id, data, updateGroup);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('reservation:delete', async (_, { id, deleteGroup }) => {
    try {
      await appUseCases.deleteReservation(id, deleteGroup);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // === CATEGORIES ===
  ipcMain.handle('category:list', async () => {
    try {
      const data = await appUseCases.category.findAll();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('category:create', async (_, params) => {
    try {
      const data = await appUseCases.category.create(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
  
  ipcMain.handle('category:delete', async (_, id) => {
    try {
      // Find all resources in this category
      const categoryResources = await appUseCases.resource.findByCategory(id);
      const resourceIds = categoryResources.map((r: any) => r.id);
      
      if (resourceIds.length > 0) {
        // Check for future reservations on any resource in this category
        const allReservations = await appUseCases.listReservations();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureReservations = allReservations.filter((r: any) => 
          resourceIds.includes(r.resourceId) && new Date(r.dateStr) >= today
        );
        
        if (futureReservations.length > 0) {
          return { 
            success: false, 
            error: `이 카테고리의 자원에 ${futureReservations.length}건의 예약이 남아있습니다. 예약을 먼저 취소한 후 삭제해 주세요.` 
          };
        }
        
        // Unlink past reservations (keep as logs)
        const pastReservations = allReservations.filter((r: any) => resourceIds.includes(r.resourceId));
        for (const r of pastReservations) {
          await appUseCases.updateReservation(r.id, { ...r, resourceId: null });
        }
      }
      
      await appUseCases.category.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // === RESOURCES ===
  ipcMain.handle('resource:list', async (_, categoryId) => {
    try {
      const data = await appUseCases.resource.findByCategory(categoryId);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resource:create', async (_, params) => {
    try {
      const data = await appUseCases.resource.create(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resource:update', async (_, { id, data }) => {
    try {
      const result = await appUseCases.resource.update(Number(id), data);
      return { success: true, data: result };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('resource:delete', async (_, id) => {
    try {
      const numId = Number(id);
      // Check for future reservations on this resource
      const allReservations = await appUseCases.listReservations();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const resourceReservations = allReservations.filter((r: any) => r.resourceId === numId);
      const futureReservations = resourceReservations.filter((r: any) => new Date(r.dateStr) >= today);
      
      if (futureReservations.length > 0) {
        return { 
          success: false, 
          error: `이 자원에 ${futureReservations.length}건의 예약이 남아있습니다. 예약을 먼저 취소한 후 삭제해 주세요.` 
        };
      }
      
      // Unlink past reservations (keep as logs, just remove the FK reference)
      for (const r of resourceReservations) {
        await appUseCases.updateReservation(r.id, { ...r, resourceId: null });
      }
      
      await appUseCases.resource.delete(numId);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  // === PENALTIES ===
  ipcMain.handle('penalty:list', async () => {
    try {
      const data = await appUseCases.penalty.findAll();
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('penalty:create', async (_, params) => {
    try {
      const data = await appUseCases.penalty.create(params);
      return { success: true, data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('penalty:delete', async (_, id) => {
    try {
      await appUseCases.penalty.delete(id);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
