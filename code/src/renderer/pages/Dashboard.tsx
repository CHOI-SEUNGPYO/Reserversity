import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useReservations, Reservation } from '../contexts/ReservationContext';

export function Dashboard() {
  const navigate = useNavigate();
  const { reservations: allReservations, deleteReservation } = useReservations();
  
  // Initialize to the Sunday of the current week
  const getInitialSunday = () => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  };

  const [visibleStartDate, setVisibleStartDate] = useState<Date>(getInitialSunday()); 
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Throttle wheel events
  const lastWheelTime = useRef<number>(0);
  const [detailReservation, setDetailReservation] = useState<Reservation | null>(null);

  const [categories, setCategories] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<any[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  React.useEffect(() => {
    const fetchRes = async () => {
      if (window.electronAPI) {
        const catRes = await window.electronAPI.invoke('category:list');
        const rRes = await window.electronAPI.invoke('resource:list');
        if (catRes.success) setCategories(catRes.data);
        if (rRes.success) setAllResources(rRes.data);
      } else {
        const storedCats = localStorage.getItem('mock_categories');
        if (storedCats) setCategories(JSON.parse(storedCats));
        const storedRes = localStorage.getItem('mock_resources');
        if (storedRes) setAllResources(JSON.parse(storedRes));
      }
    };
    fetchRes();
  }, []);

  const getCalendarData = () => {
    const days = [];
    // The "main" month to display in the header is based on the 3rd week (middle of 6 weeks)
    const centerDate = new Date(visibleStartDate.getFullYear(), visibleStartDate.getMonth(), visibleStartDate.getDate() + 21);

    for (let i = 0; i < 42; i++) {
      const date = new Date(visibleStartDate.getFullYear(), visibleStartDate.getMonth(), visibleStartDate.getDate() + i);
      const isCurrentMonth = date.getMonth() === centerDate.getMonth();
      const isToday = new Date().toDateString() === date.toDateString();
      
      const resCount = allReservations.filter(r => {
        const matchesDate = r.dateStr === date.toDateString();
        const matchesCat = selectedCatId === 'all' || r.category?.toString() === selectedCatId;
        return matchesDate && matchesCat;
      }).length;
      const hasBadge = resCount > 0;
      const badgeCount = resCount;

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        hasBadge,
        badgeCount,
        isCurrent: isToday
      });
    }

    return { days, centerDate };
  };

  const { days: calendarDays, centerDate } = getCalendarData();
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // Handle Wheel Scroll for Smooth Week-by-Week Navigation
  const handleWheel = (e: React.WheelEvent) => {
    const now = Date.now();
    // Throttle to 50ms to prevent hyperspeed scrolling on smooth trackpads
    if (now - lastWheelTime.current < 50) return;
    
    // Check direction
    if (e.deltaY > 0) {
      // Scroll Down -> Next Week (+7 days)
      setVisibleStartDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
    } else if (e.deltaY < 0) {
      // Scroll Up -> Prev Week (-7 days)
      setVisibleStartDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
    }
    
    lastWheelTime.current = now;
  };

  // Jump 4 weeks for chevron buttons
  const jumpPrev = () => setVisibleStartDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 28));
  const jumpNext = () => setVisibleStartDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 28));

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const newDate = new Date(e.target.value);
      setSelectedDate(newDate);
      // Auto-align the grid to show the selected date's week at the top
      setVisibleStartDate(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() - newDate.getDay()));
    }
  };

  // Dynamic Resources & Hours for Timetable
  const filteredResources = selectedCatId === 'all' 
    ? allResources 
    : allResources.filter(r => r.categoryId?.toString() === selectedCatId);
  const activeResourceNames = filteredResources.map(r => r.name);
  const hours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

  const selectedDateStr = selectedDate?.toDateString() || '';
  const reservations = allReservations.filter(r => r.dateStr === selectedDateStr);

  // Include resource names from reservations that no longer exist (deleted resources)
  // but only if they match the current category filter
  const deletedResourceNames = [...new Set(
    reservations
      .filter(r => !activeResourceNames.includes(r.resourceName))
      .filter(r => selectedCatId === 'all' || r.category?.toString() === selectedCatId)
      .map(r => r.resourceName)
  )];
  const resources = [...activeResourceNames, ...deletedResourceNames];

  const getGridPosition = (resIdx: number, startH: number, endH: number) => {
    const rowStart = Math.floor((startH - 9) * 2) + 2;
    const rowEnd = Math.floor((endH - 9) * 2) + 2;
    const colStart = resIdx + 2; 
    
    return {
      gridColumn: `${colStart} / ${colStart + 1}`,
      gridRow: `${rowStart} / ${rowEnd}`
    };
  };

  return (
    <div className="h-full flex flex-col relative">
      <div className="h-[64px] flex-shrink-0 flex items-center px-6 gap-4 border-b border-[#E2E8F0] bg-surface-container-lowest">
        <h1 className="text-2xl font-bold text-foreground">대시보드</h1>
        <div className="w-[180px] ml-4">
            <Select value={selectedCatId} onValueChange={setSelectedCatId}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
        </div>
        <div className="flex-1" />
        <Button 
          onClick={() => navigate('?new=true')} 
          className="bg-primary hover:bg-primary/90 text-white rounded-sm px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={categories.length === 0}
        >
          + 신규 예약
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 bg-surface gap-4">
        {allResources.length === 0 && (
          <div className="flex-shrink-0 bg-[#e6f0fd] border border-primary/20 rounded-lg px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-primary text-lg">ℹ️</span>
              <span className="text-sm font-medium text-slate-700">등록된 자원이 없습니다. 예약을 진행하려면 먼저 자원을 등록해 주세요.</span>
            </div>
            <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10" onClick={() => navigate('/resources')}>
              자원 등록하기
            </Button>
          </div>
        )}
        <div className="flex-1 bg-surface-container-lowest rounded-lg border border-border flex flex-col shadow-sm">
            <div className="p-4 flex items-center justify-between border-b border-border bg-white rounded-t-lg z-10 relative">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-slate-400">📅</span> 
                <input 
                  type="month"
                  className="text-xl font-bold text-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-0.5 transition-colors cursor-pointer"
                  value={`${centerDate.getFullYear()}-${String(centerDate.getMonth() + 1).padStart(2, '0')}`}
                  onClick={(e) => {
                    try { e.currentTarget.showPicker(); } catch (err) {}
                  }}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [year, month] = e.target.value.split('-');
                      const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
                      setVisibleStartDate(new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate() - newDate.getDay()));
                    }
                  }}
                />
              </h2>
              <div className="flex items-center gap-2 text-slate-500">
                <button 
                  onClick={jumpPrev}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="4주 이전"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={jumpNext}
                  className="p-1 hover:bg-slate-100 rounded transition-colors"
                  title="4주 이후"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 border-b border-border text-sm font-medium text-slate-500 bg-slate-50 z-10 relative shadow-sm">
              {weekDays.map(day => (
                <div key={day} className="py-3 text-center border-r border-border last:border-r-0">{day}</div>
              ))}
            </div>

            <div 
              className="flex-1 grid grid-cols-7 grid-rows-6 bg-border gap-[1px] relative overflow-hidden" 
              onWheel={handleWheel}
              style={{ overscrollBehavior: 'none' }}
            >
              {calendarDays.map((item, idx) => (
                <div 
                  key={idx} 
                  onClick={() => {
                    const dateReservations = allReservations.filter(r => r.dateStr === item.date.toDateString());
                    if (resources.length === 0 && dateReservations.length === 0) {
                      alert('조회할 자원이 없습니다. 자원 관리에서 자원을 먼저 등록해 주세요.');
                      return;
                    }
                    setSelectedDate(item.date);
                  }}
                  className={`bg-surface-container-lowest p-2 flex flex-col transition-all duration-200 border border-transparent cursor-pointer hover:border-primary hover:z-10 hover:shadow-md
                    ${!item.isCurrentMonth ? 'bg-slate-50/70' : 'bg-white'}
                  `}
                >
                  <div className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                    ${!item.isCurrentMonth ? 'text-slate-400' : 'text-slate-700'}
                    ${item.isCurrent ? 'bg-primary text-white shadow-sm ring-4 ring-primary/20' : ''}
                  `}>
                    {item.day}
                  </div>
                  <div className="mt-1 flex-1">
                    {item.hasBadge && (
                      <div className="bg-[#e6f0fd] text-primary text-[11px] font-semibold px-1.5 py-0.5 rounded inline-block shadow-sm border border-primary/20">
                        예약 {item.badgeCount}건
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-2 text-center text-xs text-slate-400 border-t border-border bg-slate-50">
              마우스 휠을 위아래로 굴려 한 주씩 스크롤할 수 있습니다.
            </div>
          </div>
      </div>

      {/* Date Detail Modal (Timetable Popup) */}
      {selectedDate !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-8">
          <div className="absolute inset-0" onClick={() => setSelectedDate(null)} />
          <div className="bg-surface-container-lowest w-full max-w-[1200px] h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative z-10">
            
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="text-primary text-3xl">📅</span>
                <input 
                  type="date"
                  className="text-2xl font-bold text-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none rounded px-2 py-1 transition-colors cursor-pointer"
                  value={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`}
                  onChange={handleDateChange}
                />
                <span className="text-2xl font-bold text-foreground">예약 시간표</span>
              </div>
              <button 
                onClick={() => setSelectedDate(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto bg-white relative">
              <div 
                className="min-w-[800px] grid"
                style={{
                  gridTemplateColumns: `80px repeat(${resources.length}, minmax(150px, 1fr))`,
                  gridTemplateRows: `50px repeat(${hours.length * 2}, 40px)` 
                }}
              >
                
                <div className="bg-slate-50 border-r border-b border-border sticky top-0 left-0 z-20"></div>
                {resources.map((res, idx) => (
                  <div key={idx} className={`border-r border-b border-border flex items-center justify-center font-bold text-[15px] sticky top-0 z-10 ${deletedResourceNames.includes(res) ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-slate-700'}`}>
                    {res}
                    {deletedResourceNames.includes(res) && <span className="ml-1 text-[10px] text-slate-400 font-normal">(삭제됨)</span>}
                  </div>
                ))}

                {hours.map((hour, idx) => (
                  <React.Fragment key={hour}>
                    <div 
                      className="border-r border-b border-border flex items-start justify-center pt-2 text-xs font-bold text-slate-500 bg-slate-50 sticky left-0 z-10"
                      style={{ gridColumn: '1 / 2', gridRow: `${idx * 2 + 2} / span 2` }}
                    >
                      {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                    </div>
                  </React.Fragment>
                ))}

                {hours.map((_, rowIdx) => (
                  resources.map((__, colIdx) => (
                    <React.Fragment key={`${rowIdx}-${colIdx}`}>
                      <div 
                        onClick={() => {
                          const resName = resources[colIdx];
                          const startH = hours[rowIdx];
                          const isHalf = false;
                          const dateStr = `${selectedDate?.getFullYear()}-${String(selectedDate?.getMonth()! + 1).padStart(2, '0')}-${String(selectedDate?.getDate()).padStart(2, '0')}`;
                          const startT = `${String(startH).padStart(2, '0')}:00`;
                          const endT = `${String(startH + 1).padStart(2, '0')}:00`;
                          setSelectedDate(null);
                          navigate(`?new=true&resource=${encodeURIComponent(resName)}&date=${dateStr}&start=${startT}&end=${endT}`);
                        }}
                        className="border-r border-b border-dashed border-slate-200 hover:bg-primary/10 transition-colors cursor-pointer" 
                        style={{ gridColumn: `${colIdx + 2}`, gridRow: `${rowIdx * 2 + 2}` }}
                      ></div>
                      <div 
                        onClick={() => {
                          const resName = resources[colIdx];
                          const startH = hours[rowIdx];
                          const isHalf = true;
                          const dateStr = `${selectedDate?.getFullYear()}-${String(selectedDate?.getMonth()! + 1).padStart(2, '0')}-${String(selectedDate?.getDate()).padStart(2, '0')}`;
                          const startT = `${String(startH).padStart(2, '0')}:30`;
                          const endT = `${String(startH + 1).padStart(2, '0')}:30`;
                          setSelectedDate(null);
                          navigate(`?new=true&resource=${encodeURIComponent(resName)}&date=${dateStr}&start=${startT}&end=${endT}`);
                        }}
                        className="border-r border-b border-slate-200 hover:bg-primary/10 transition-colors cursor-pointer" 
                        style={{ gridColumn: `${colIdx + 2}`, gridRow: `${rowIdx * 2 + 3}` }}
                      ></div>
                    </React.Fragment>
                  ))
                ))}

                {reservations.map(res => {
                  const colIdx = resources.indexOf(res.resourceName);
                  if (colIdx === -1) return null; // Filtered out

                  const duration = res.endHour - res.startHour;
                  const isSmall = duration <= 0.5;
                  
                  return (
                    <div 
                      key={res.id}
                      className={`m-1 p-2 flex flex-col rounded-md border-l-4 overflow-hidden shadow-sm hover:opacity-90 cursor-pointer relative ${res.color}`}
                      style={getGridPosition(colIdx, res.startHour, res.endHour)}
                      onClick={(e) => { e.stopPropagation(); setDetailReservation(res); }}
                    >
                      <div className="font-bold text-[13px] leading-tight mb-0.5 truncate">{res.title}</div>
                      {!isSmall && (
                        <>
                          <div className="text-[11px] opacity-80 truncate">{res.author}</div>
                          <div className="absolute bottom-1 right-2 text-[10px] font-bold opacity-70 bg-white/30 px-1 rounded truncate max-w-[80%]">
                            승인: {res.approver}
                          </div>
                        </>
                      )}
                      {isSmall && (
                        <div className="flex items-center justify-between text-[10px] opacity-80 mt-auto">
                           <span className="truncate mr-1">{res.author}</span>
                           <span className="font-bold truncate max-w-[50%]">✓ {res.approver}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </div>

            <div className="p-6 border-t border-border bg-slate-50 flex justify-end">
              <Button onClick={() => {
                navigate('?new=true');
                setSelectedDate(null);
              }} className="font-bold px-8 text-[15px]">
                이 날짜로 신규 예약하기
              </Button>
            </div>
            
          </div>
        </div>
      )}

      {/* Reservation Detail Modal */}
      {detailReservation !== null && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-8" onClick={() => setDetailReservation(null)}>
          <div className="bg-white w-full max-w-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex items-center justify-between bg-slate-50">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="text-primary">📝</span> 예약 상세 내역
                {detailReservation.groupId && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md border border-slate-300">반복 예약</span>}
              </h2>
              <button 
                onClick={() => setDetailReservation(null)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">예약 목적 (제목)</label>
                <div className="text-sm font-medium text-slate-800">{detailReservation.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-5 bg-surface-container-lowest p-4 rounded-xl border border-border">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">자원</label>
                  <div className="text-sm font-bold text-primary">{detailReservation.resourceName}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">예약일</label>
                  <div className="text-sm font-medium text-slate-800">{detailReservation.dateStr}</div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">시간</label>
                  <div className="text-sm font-medium text-slate-800">
                    {Math.floor(detailReservation.startHour)}:{detailReservation.startHour % 1 !== 0 ? '30' : '00'} 
                    ~ {Math.floor(detailReservation.endHour)}:{detailReservation.endHour % 1 !== 0 ? '30' : '00'}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">예약자</label>
                  <div className="text-sm font-medium text-slate-800">{detailReservation.author}</div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-500 mb-1 block">승인자</label>
                  <div className="text-sm font-medium text-slate-800">{detailReservation.approver}</div>
                </div>
              </div>
              {detailReservation.remarks && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">비고</label>
                  <div className="text-sm text-slate-700 bg-slate-50 p-3 rounded-md border border-border whitespace-pre-wrap">{detailReservation.remarks}</div>
                </div>
              )}
            </div>
            <div className="p-5 border-t border-border bg-slate-50 flex justify-end gap-2">
              {detailReservation.groupId ? (
                <>
                  <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10 hover:text-primary" onClick={() => {
                    setDetailReservation(null);
                    setSelectedDate(null);
                    navigate(`?new=true&editId=${detailReservation.id}&updateGroup=false`);
                  }}>
                    단일 수정
                  </Button>
                  <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10 hover:text-primary" onClick={() => {
                    setDetailReservation(null);
                    setSelectedDate(null);
                    navigate(`?new=true&editId=${detailReservation.id}&updateGroup=true`);
                  }}>
                    전체 수정
                  </Button>
                  <Button variant="outline" className="text-error border-error/30 hover:bg-error/10 hover:text-error" onClick={async () => {
                    const ok = window.electronAPI
                      ? await window.electronAPI.invoke('dialog:confirm', '이 일정만 취소하시겠습니까?')
                      : confirm('이 일정만 취소하시겠습니까?');
                    if (ok) {
                      const res = await deleteReservation(detailReservation.id, false);
                      if (res && !res.success) alert(res.error);
                      else setDetailReservation(null);
                    }
                  }}>
                    단일 취소
                  </Button>
                  <Button variant="outline" className="text-error border-error/30 hover:bg-error/10 hover:text-error" onClick={async () => {
                    const ok = window.electronAPI
                      ? await window.electronAPI.invoke('dialog:confirm', '반복되는 모든 일정을 취소하시겠습니까?')
                      : confirm('반복되는 모든 일정을 취소하시겠습니까?');
                    if (ok) {
                      const res = await deleteReservation(detailReservation.id, true);
                      if (res && !res.success) alert(res.error);
                      else setDetailReservation(null);
                    }
                  }}>
                    전체 취소
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" className="text-primary border-primary/30 hover:bg-primary/10 hover:text-primary" onClick={() => {
                    setDetailReservation(null);
                    setSelectedDate(null);
                    navigate(`?new=true&editId=${detailReservation.id}`);
                  }}>
                    예약 수정
                  </Button>
                  <Button variant="outline" className="text-error border-error/30 hover:bg-error/10 hover:text-error" onClick={async () => {
                    const ok = window.electronAPI
                      ? await window.electronAPI.invoke('dialog:confirm', '이 예약을 취소하시겠습니까?')
                      : confirm('이 예약을 취소하시겠습니까?');
                    if (ok) {
                      const res = await deleteReservation(detailReservation.id);
                      if (res && !res.success) alert(res.error);
                      else setDetailReservation(null);
                    }
                  }}>
                    예약 취소
                  </Button>
                </>
              )}
              <Button onClick={() => setDetailReservation(null)}>닫기</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
