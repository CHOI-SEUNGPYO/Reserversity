import React from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function NewReservation() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="h-[120px] flex-shrink-0 flex flex-col justify-end px-8 border-b border-border bg-surface-container-lowest">
        <h1 className="text-3xl font-bold text-foreground mb-6">대시보드</h1>
        <div className="flex gap-8 text-[15px] font-medium text-slate-500">
          <button className="pb-3 hover:text-foreground">개요</button>
          <button className="pb-3 text-primary border-b-[3px] border-primary">신규 예약</button>
          <button className="pb-3 hover:text-foreground">내 예약</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-[800px] border border-border bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          
          <div className="flex-1 p-8 overflow-y-auto">
            {/* 기본 정보 */}
            <div className="mb-10">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6">
                <span className="text-primary border border-primary rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">i</span>
                기본 정보
              </h2>

              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">예약자 <span className="text-error">*</span></label>
                  <Input placeholder="예약자 이름 입력" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">카테고리 <span className="text-error">*</span></label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="카테고리 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a">회의실</SelectItem>
                      <SelectItem value="b">장비</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">자원 <span className="text-error">*</span></label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="자원 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">회의실 A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">일정 시작 <span className="text-error">*</span></label>
                  <Input placeholder="연도. 월. 일. -- --:--" type="datetime-local" className="text-slate-500" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">일정 종료 <span className="text-error">*</span></label>
                  <Input placeholder="연도. 월. 일. -- --:--" type="datetime-local" className="text-slate-500" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">목적</label>
                  <textarea 
                    className="w-full h-32 rounded-md border border-[#CBD5E1] bg-surface-container-lowest p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground"
                    placeholder="예약 목적 입력"
                  />
                </div>
              </div>
            </div>

            <hr className="border-border my-8" />

            {/* 사용자 정의 컬럼 */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="text-primary text-xl">⚙</span>
                  사용자 정의 컬럼
                </h2>
                <Button variant="outline" className="text-primary border-primary hover:bg-primary-fixed">
                  + + 컬럼 추가
                </Button>
              </div>

              <div className="bg-slate-50 rounded-lg p-5 border border-border flex items-end gap-4">
                <div className="flex-[0.4]">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">항목명</label>
                  <Input placeholder="예: 부서명" />
                </div>
                <div className="flex-[0.6] flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">내용</label>
                    <Input placeholder="내용 입력" />
                  </div>
                  <button className="text-slate-400 hover:text-error mt-6">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="p-5 border-t border-border bg-surface-container-lowest flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm font-medium">
              승인자 이름: <Input className="w-40" placeholder="승인자 입력" />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="w-24" onClick={() => navigate('/')}>취소</Button>
              <Button className="w-28 text-[15px] font-bold">✓ 등록하기</Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
