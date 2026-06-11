import React, { useState } from 'react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Download } from 'lucide-react';
import { useReservations } from '../contexts/ReservationContext';

export function Export() {
  const { reservations } = useReservations();
  const [exportOptions, setExportOptions] = useState({
    reservations: true,
    resources: false,
    logs: false
  });
  const [exportFormat, setExportFormat] = useState('excel');
  
  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="h-[120px] flex-shrink-0 px-8 flex flex-col justify-center border-b border-border bg-surface-container-lowest">
        <h1 className="text-3xl font-bold text-foreground mb-2">데이터 내보내기</h1>
        <p className="text-sm text-slate-500">시스템 데이터를 파일 형식으로 다운로드하여 분석하거나 보관할 수 있습니다.</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-[1000px] mx-auto space-y-8">
          
          {/* Settings Form */}
          <div className="border border-border bg-surface-container-lowest rounded-xl shadow-sm p-8">
            <div className="mb-8">
              <label className="text-xs font-bold text-slate-700 mb-3 block">내보낼 데이터 선택</label>
              <div className="flex gap-8">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="d1" 
                    checked={exportOptions.reservations} 
                    onCheckedChange={(c) => setExportOptions({...exportOptions, reservations: !!c})} 
                  />
                  <Label htmlFor="d1">예약 내역</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="d2" 
                    checked={exportOptions.resources} 
                    onCheckedChange={(c) => setExportOptions({...exportOptions, resources: !!c})} 
                  />
                  <Label htmlFor="d2">자원 목록</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="d3" 
                    checked={exportOptions.logs} 
                    onCheckedChange={(c) => setExportOptions({...exportOptions, logs: !!c})} 
                  />
                  <Label htmlFor="d3">사용자 활동 로그</Label>
                </div>
              </div>
            </div>

            <hr className="border-border my-8" />

            <div className="mb-8">
              <label className="text-xs font-bold text-slate-700 mb-3 block">기간 설정</label>
              <div className="flex items-center gap-4">
                <div className="relative w-[200px]">
                  <Input placeholder="mm/dd/yyyy" type="date" className="pl-3" />
                </div>
                <span className="text-slate-400">~</span>
                <div className="relative w-[200px]">
                  <Input placeholder="mm/dd/yyyy" type="date" className="pl-3" />
                </div>
              </div>
            </div>

            <hr className="border-border my-8" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1">사용자 정의 컬럼 포함</label>
                <p className="text-xs text-slate-500">선택된 데이터 유형에 관련된 모든 메타데이터를 포함합니다.</p>
              </div>
              <Switch />
            </div>

            <div className="flex justify-end">
              <Button 
                className="font-bold gap-2"
                onClick={async () => {
                  if (window.electronAPI && exportOptions.reservations) {
                    const res = await window.electronAPI.invoke('reservation:export');
                    if (res.success) alert(`내보내기 완료: ${res.filePath}`);
                    else if (res.error !== 'Cancelled') alert(`내보내기 실패: ${res.error}`);
                  } else {
                    alert('현재 버전에서는 예약 내역 내보내기만 지원됩니다.');
                  }
                }}
              >
                <Download className="w-4 h-4" /> 데이터 내보내기 (CSV)
              </Button>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-border bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-lg font-bold text-foreground mb-1">데이터 미리보기</h2>
              <p className="text-xs text-slate-500">내보내기 설정에 따라 생성될 데이터의 샘플입니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-border">
                  <tr>
                    <th className="px-6 py-4">번호</th>
                    <th className="px-6 py-4">자원명</th>
                    <th className="px-6 py-4">카테고리</th>
                    <th className="px-6 py-4">예약자</th>
                    <th className="px-6 py-4">학번</th>
                    <th className="px-6 py-4">예약 일시</th>
                    <th className="px-6 py-4">승인자</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-slate-700">
                  {reservations.length > 0 ? reservations.slice(0, 5).map((res, i) => (
                    <tr key={res.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{i + 1}</td>
                      <td className="px-6 py-4">{res.resourceName}</td>
                      <td className="px-6 py-4">{res.category}</td>
                      <td className="px-6 py-4">{res.author}</td>
                      <td className="px-6 py-4">{res.authorId || '-'}</td>
                      <td className="px-6 py-4">{res.dateStr}</td>
                      <td className="px-6 py-4 font-bold text-[#004ac6]">{res.approver || '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">데이터가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
