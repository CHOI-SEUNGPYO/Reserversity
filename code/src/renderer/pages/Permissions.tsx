import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { UserX, Plus, X, Trash2 } from 'lucide-react';

export function Permissions() {
  const [sanctions, setSanctions] = useState<any[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const fetchSanctions = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.invoke('penalty:list');
      if (result.success) {
        setSanctions(result.data);
      } else {
        alert("DB 로드 실패: " + result.error);
      }
    }
  };

  useEffect(() => {
    fetchSanctions();
  }, []);

  const handleAdd = async () => {
    if (newName && newStudentId && newReason && newDeadline) {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('penalty:create', {
          name: newName, studentId: newStudentId, reason: newReason, endDate: newDeadline
        });
        if (!result.success) {
          alert("DB 저장 실패: " + result.error);
        } else {
          await fetchSanctions();
        }
      } else {
        setSanctions([
          ...sanctions, 
          { id: Date.now().toString(), name: newName, studentId: newStudentId, reason: newReason, endDate: newDeadline }
        ]);
      }
      setIsAdding(false);
      setNewName('');
      setNewStudentId('');
      setNewReason('');
      setNewDeadline('');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.electronAPI
      ? await window.electronAPI.invoke('dialog:confirm', '이 제재를 해제하시겠습니까?')
      : confirm('이 제재를 해제하시겠습니까?');
    if (ok) {
      if (window.electronAPI) {
        await window.electronAPI.invoke('penalty:delete', id);
        await fetchSanctions();
      } else {
        setSanctions(sanctions.filter(s => s.id !== id));
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      <div className="h-[120px] flex-shrink-0 px-8 flex justify-between items-center border-b border-border bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">제재 관리</h1>
          <p className="text-sm text-slate-500">예약 규칙 위반 사용자에 대한 제재 내역을 관리합니다.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="bg-primary text-white hover:bg-primary/90">
          + 제재 등록
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          
          {isAdding && (
            <div className="border border-border rounded-xl bg-white p-6 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                    <UserX className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">신규 제재 등록 (DB 연결: {window.electronAPI ? 'O' : 'X'})</h3>
                </div>
                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">이름</label>
                  <Input placeholder="이름 입력" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">학번</label>
                  <Input placeholder="학번 입력" value={newStudentId} onChange={e => setNewStudentId(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">사유</label>
                  <Input placeholder="제재 사유 입력 (예: 노쇼, 파손 등)" value={newReason} onChange={e => setNewReason(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">기한 (제재 종료일)</label>
                  <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsAdding(false)} className="text-slate-500">취소</Button>
                <Button onClick={handleAdd}>등록 완료</Button>
              </div>
            </div>
          )}

          <div className="border border-border rounded-xl bg-white overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="p-4 font-bold text-sm text-slate-700">이름</th>
                  <th className="p-4 font-bold text-sm text-slate-700">학번</th>
                  <th className="p-4 font-bold text-sm text-slate-700">사유</th>
                  <th className="p-4 font-bold text-sm text-slate-700">기한</th>
                  <th className="p-4 font-bold text-sm text-slate-700 w-24 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sanctions.length > 0 ? (
                  sanctions.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-800">{s.name}</td>
                      <td className="p-4 text-sm text-slate-600">{s.studentId}</td>
                      <td className="p-4 text-sm text-slate-600">{s.reason}</td>
                      <td className="p-4 text-sm text-error font-medium">{s.endDate || s.deadline}</td>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleDelete(s.id)}
                          className="text-slate-400 hover:text-error transition-colors p-1"
                          title="제재 해제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-sm">등록된 제재 내역이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
}
