import React, { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { X, Info, AlignLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useReservations } from '../../contexts/ReservationContext';

interface NewReservationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewReservationDrawer({ isOpen, onClose }: NewReservationDrawerProps) {
  const location = useLocation();
  const [categories, setCategories] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchRes = async () => {
      if (window.electronAPI) {
        const cRes = await window.electronAPI.invoke('category:list');
        const rRes = await window.electronAPI.invoke('resource:list');
        if (cRes.success) setCategories(cRes.data);
        if (rRes.success) setAllResources(rRes.data);
      } else {
        const storedCats = localStorage.getItem('mock_categories');
        if (storedCats) setCategories(JSON.parse(storedCats));
        const storedRes = localStorage.getItem('mock_resources');
        if (storedRes) setAllResources(JSON.parse(storedRes));
      }
    };
    if (isOpen) {
      fetchRes();
    }
  }, [isOpen]);

  const [reserver, setReserver] = useState('');
  const [authorId, setAuthorId] = useState('');
  const [category, setCategory] = useState('');
  const [resource, setResource] = useState('');

  const resources = allResources
    .filter(r => !category || r.categoryId?.toString() === category)
    .map(r => r.name);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [approver, setApprover] = useState('');
  const [remarks, setRemarks] = useState('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [updateGroup, setUpdateGroup] = useState(false);

  const selectedResourceObj = allResources.find(r => r.name === resource);

  const parsedCustomFields = React.useMemo(() => {
    if (!selectedResourceObj || !selectedResourceObj.customFields) return [];
    try {
      const parsed = JSON.parse(selectedResourceObj.customFields);
      return Array.isArray(parsed) ? (parsed as { name: string; value: string }[]) : [];
    } catch (e) {
      return [];
    }
  }, [selectedResourceObj]);

  const customCols = React.useMemo(() => {
    if (!selectedResourceObj || !selectedResourceObj.customFields) return [];
    try {
      const parsed = JSON.parse(selectedResourceObj.customFields);
      return parsed.map((f: any) => f.name).filter(Boolean);
    } catch (e) {
      return [];
    }
  }, [selectedResourceObj]);

  useEffect(() => {
    if (selectedResourceObj && selectedResourceObj.customFields && !editId) {
      try {
        const parsed = JSON.parse(selectedResourceObj.customFields);
        const initialValues: Record<string, string> = {};
        if (Array.isArray(parsed)) {
          parsed.forEach((f: any) => {
            if (f.name) initialValues[f.name] = f.value || '';
          });
        }
        setCustomFieldValues(initialValues);
      } catch (e) {
        setCustomFieldValues({});
      }
    } else if (!resource) {
      setCustomFieldValues({});
    }
  }, [selectedResourceObj, editId, resource]);



  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatType, setRepeatType] = useState('weekly');
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [endDate, setEndDate] = useState('');

  const { addReservation, addReservations, updateReservation, reservations } = useReservations();

  // Extract params when opened or URL changes
  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(location.search);
      const editParam = params.get('editId');
      
      if (editParam) {
        const existing = reservations.find(r => r.id === editParam);
        if (existing) {
          setEditId(existing.id);
          setReserver(existing.author);
          setAuthorId(existing.authorId || '');
          setResource(existing.resourceName);
          setCategory(existing.category);
          setApprover(existing.approver);
          setRemarks(existing.remarks);
          
          const d = new Date(existing.dateStr);
          const formatLocal = (date: Date) => {
            const yy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            return `${yy}-${mm}-${dd}`;
          };
          setStartDate(formatLocal(d));
          
          const sh = Math.floor(existing.startHour);
          const sm = (existing.startHour % 1) * 60;
          setStartTime(`${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`);
          
          const eh = Math.floor(existing.endHour);
          const em = (existing.endHour % 1) * 60;
          setEndTime(`${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`);
          
          setIsRecurring(false);
          setUpdateGroup(params.get('updateGroup') === 'true');
          return;
        }
      }

      setEditId(null);
      setUpdateGroup(false);
      const resParam = params.get('resource');
      const dateParam = params.get('date');
      const startParam = params.get('start');
      const endParam = params.get('end');

      if (resParam) {
        setResource(resParam);
        const matchingRes = allResources.find(r => r.name === resParam);
        if (matchingRes) {
          setCategory(matchingRes.categoryId?.toString() || '');
        } else {
          if (resParam.includes('회의실') || resParam.includes('세미나실')) {
            setCategory('room');
          } else {
            setCategory('it');
          }
        }
      } else {
        setResource('');
        setCategory('');
      }

      if (dateParam) setStartDate(dateParam);
      else setStartDate('');

      if (startParam) setStartTime(startParam);
      else setStartTime('');

      if (endParam) setEndTime(endParam);
      else setEndTime('');
      
      // Reset generic fields on open
      setReserver('');
      setAuthorId('');
      setApprover('');
      setRemarks('');
      setCustomFieldValues({});
    }
  }, [isOpen, location.search, reservations, allResources]);



  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <div 
        className={`fixed inset-y-0 right-0 z-[70] w-full max-w-[650px] bg-surface-container-lowest shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
      {/* isOpen 시에만 내부 마운트: Radix UI Select의 DismissableLayer가 닫힐 때 정리되도록 보장 */}
      {isOpen && (<>
        <div className="h-[80px] flex-shrink-0 flex items-center justify-between px-8 border-b border-border bg-slate-50">
          <h2 className="text-xl font-bold text-foreground">
            {editId ? (updateGroup ? '예약 수정 (전체 반복)' : '예약 수정 (단일)') : '신규 예약 등록'}
          </h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          
          {/* 1. 기본 정보 */}
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="text-primary border border-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">i</span>
              기본 정보
            </h3>

            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">예약자(이름) <span className="text-error">*</span></label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="예약자 이름" 
                    value={reserver}
                    onChange={(e) => setReserver(e.target.value)}
                    className="w-1/2"
                  />
                  <Input 
                    placeholder="학번 (선택)" 
                    value={authorId}
                    onChange={(e) => setAuthorId(e.target.value)}
                    className="w-1/2"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">카테고리 <span className="text-error">*</span></label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">자원 <span className="text-error">*</span></label>
                <Select value={resource} onValueChange={setResource}>
                  <SelectTrigger>
                    <SelectValue placeholder="자원 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {resources.map(res => (
                      <SelectItem key={res} value={res}>{res}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">{isRecurring ? '시작 일자' : '예약 일자'} <span className="text-error">*</span></label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">시작 시간 <span className="text-error">*</span></label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger><SelectValue placeholder="시간 선택" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 25 }).map((_, i) => {
                        const h = 9 + Math.floor(i / 2);
                        const m = i % 2 === 0 ? '00' : '30';
                        if (h > 20 && m === '30') return null;
                        const timeStr = `${String(h).padStart(2, '0')}:${m}`;
                        return <SelectItem key={timeStr} value={timeStr}>{timeStr}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">종료 시간 <span className="text-error">*</span></label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger><SelectValue placeholder="시간 선택" /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {Array.from({ length: 25 }).map((_, i) => {
                        const h = 9 + Math.floor(i / 2);
                        const m = i % 2 === 0 ? '00' : '30';
                        if (h > 21 || (h === 21 && m === '30')) return null;
                        const timeStr = `${String(h).padStart(2, '0')}:${m}`;
                        return <SelectItem key={timeStr} value={timeStr}>{timeStr}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!editId && (
                <div className="col-span-2 mt-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-center mb-4">
                    <input 
                      type="checkbox" 
                      id="recurring" 
                      className="mr-2"
                      checked={isRecurring}
                      onChange={(e) => setIsRecurring(e.target.checked)}
                    />
                    <label htmlFor="recurring" className="text-sm font-bold text-slate-800">반복 예약 설정</label>
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">반복 주기</label>
                          <Select value={repeatType} onValueChange={setRepeatType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="daily">매일</SelectItem>
                              <SelectItem value="weekly">매주</SelectItem>
                              <SelectItem value="monthly">매월 (같은 날짜)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">반복 종료 일자 <span className="text-error">*</span></label>
                          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                      </div>
                      
                      {repeatType === 'weekly' && (
                        <div>
                          <label className="text-xs font-bold text-slate-700 mb-1.5 block">반복 요일</label>
                          <div className="flex gap-2">
                            {['일', '월', '화', '수', '목', '금', '토'].map((day, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setRepeatDays(prev => prev.includes(idx) ? prev.filter(d => d !== idx) : [...prev, idx])}
                                className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${repeatDays.includes(idx) ? 'bg-primary text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2. 자원 정보 (Dynamic Custom Columns based on selected resource) */}
          <div className="mt-12 opacity-100 transition-opacity duration-300">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="text-primary text-lg"><Info className="w-5 h-5"/></span>
              자원 상세 정보
            </h3>

            {resource && selectedResourceObj ? (
              <div className="bg-slate-50 rounded-lg p-5 border border-border grid grid-cols-2 gap-4">
                <div className="col-span-2 mb-2">
                  <p className="text-xs text-slate-500 font-medium">선택된 자원(<span className="font-bold text-primary">{resource}</span>)의 상세 정보입니다.</p>
                </div>
                {parsedCustomFields.length > 0 ? (
                  parsedCustomFields.map((field, idx) => (
                    <div key={idx} className="border-b border-slate-200/50 pb-2">
                      <span className="text-xs font-bold text-slate-500 block mb-1">{field.name}</span>
                      <span className="text-sm font-semibold text-slate-800">{field.value || '-'}</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-xs text-slate-400 py-4">등록된 상세 정보가 없습니다.</div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-8 border border-border flex items-center justify-center text-slate-400 text-sm">
                먼저 예약할 자원을 선택해 주세요.
              </div>
            )}
          </div>

          {/* 3. 비고 */}
          <div className="mt-12">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6">
              <span className="text-primary text-lg"><AlignLeft className="w-5 h-5"/></span>
              비고
            </h3>
            
            <div>
              <textarea 
                className="w-full h-32 rounded-md border border-[#CBD5E1] bg-surface-container-lowest p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground"
                placeholder="예약 목적, 주의사항 또는 추가 전달 사항을 입력해 주세요."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="p-6 border-t border-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-slate-500">승인자 <span className="text-error">*</span>:</span> 
            <Input 
              className="w-32 bg-white" 
              placeholder="이름 입력" 
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="w-24 bg-white" onClick={onClose}>취소</Button>
            <Button 
              className="w-28 text-[15px] font-bold shadow-sm"
              disabled={!approver.trim()}
              onClick={async () => {
                if (!reserver || !resource || !startDate || !startTime || !endTime || !approver) return;
                
                const parseTime = (t: string) => {
                  const [h, m] = t.split(':').map(Number);
                  return h + (m / 60);
                };
                const sHour = parseTime(startTime);
                const eHour = parseTime(endTime);

                let finalRemarks = remarks;
                const customKeys = Object.keys(customFieldValues || {});
                const activeFields = customKeys.filter(k => customFieldValues[k] && customFieldValues[k].toString().trim() !== '');
                if (activeFields.length > 0) {
                  finalRemarks += '\n\n[사용자 정의 컬럼]\n' + activeFields.map(k => `- ${k}: ${customFieldValues[k]}`).join('\n');
                }

                const baseRes = {
                  id: '',
                  dateStr: new Date(startDate).toDateString(),
                  resourceName: resource,
                  resourceId: selectedResourceObj?.id,
                  startHour: sHour,
                  endHour: eHour,
                  title: remarks.split('\n')[0] || `${reserver}님의 예약`,
                  author: reserver,
                  authorId: authorId.trim() || undefined,
                  approver,
                  color: editId ? (reservations.find(r => r.id === editId)?.color || 'bg-[#e0f2fe] border-[#38bdf8] text-[#0369a1]') : 'bg-[#e0f2fe] border-[#38bdf8] text-[#0369a1]',
                  remarks: finalRemarks,
                  category
                };
                
                const handleResult = async (result: {success: boolean, error?: string}, forceApproveObj: any = null) => {
                  if (!result.success) {
                    if (result.error && result.error.includes('예약 차단')) {
                      if (confirm(`${result.error}\n\n관리자 직권으로 강제 승인(Force Approve) 하시겠습니까?`)) {
                        if (forceApproveObj) {
                          if (forceApproveObj.isList) await addReservations(forceApproveObj.data, true);
                          else await addReservation(forceApproveObj.data, true);
                        }
                        onClose();
                      }
                    } else {
                      alert(result.error);
                    }
                    return false;
                  }
                  return true;
                };

                if (editId) {
                  const existing = reservations.find(r => r.id === editId);
                  if (existing) {
                    const res = await updateReservation(editId, { ...baseRes, id: existing.id, groupId: existing.groupId }, updateGroup);
                    if (await handleResult(res)) onClose();
                  }
                } else {
                  if (isRecurring && endDate) {
                    const groupId = Date.now().toString();
                    const newResList = [];
                    
                    let curr = new Date(startDate);
                    const end = new Date(endDate);
                    
                    while (curr <= end) {
                      let shouldAdd = false;
                      if (repeatType === 'daily') shouldAdd = true;
                      else if (repeatType === 'weekly') shouldAdd = repeatDays.includes(curr.getDay());
                      else if (repeatType === 'monthly') shouldAdd = curr.getDate() === new Date(startDate).getDate();

                      if (shouldAdd) {
                        newResList.push({
                          ...baseRes,
                          id: groupId + '_' + curr.getTime(),
                          groupId,
                          dateStr: curr.toDateString()
                        });
                      }
                      curr.setDate(curr.getDate() + 1);
                    }
                    
                    if (newResList.length > 0) {
                      const res = await addReservations(newResList);
                      if (await handleResult(res, { isList: true, data: newResList })) onClose();
                    } else {
                      const single = { ...baseRes, id: Date.now().toString(), dateStr: new Date(startDate).toDateString() };
                      const res = await addReservation(single);
                      if (await handleResult(res, { isList: false, data: single })) onClose();
                    }
                  } else {
                    const single = { ...baseRes, id: Date.now().toString(), dateStr: new Date(startDate).toDateString() };
                    const res = await addReservation(single);
                    if (await handleResult(res, { isList: false, data: single })) onClose();
                  }
                }
              }}
            >
              {editId ? '✓ 수정하기' : '✓ 등록하기'}
            </Button>
          </div>
        </div>

      </>)}
      </div>
    </>
  );
}
