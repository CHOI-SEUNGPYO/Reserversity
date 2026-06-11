import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Label } from '../components/ui/label';
import { ImagePlus, Trash2, ChevronRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function NewResource() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEditMode = !!searchParams.get('edit');
  const title = isEditMode ? '자원 수정' : '신규 자원 등록';
  const submitText = isEditMode ? '수정하기' : '등록하기';
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('AVAILABLE');
  const [customFields, setCustomFields] = useState<{name: string, value: string}[]>([{ name: '', value: '' }]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      if (window.electronAPI) {
        const cRes = await window.electronAPI.invoke('category:list');
        if (cRes.success) {
          setCategories(cRes.data);
          if (cRes.data.length > 0) setCategoryId(cRes.data[0].id.toString());
        }
      } else {
        const storedCats = localStorage.getItem('mock_categories');
        if (storedCats) {
          const parsed = JSON.parse(storedCats);
          setCategories(parsed);
          if (parsed.length > 0) setCategoryId(parsed[0].id.toString());
        }
      }
      if (isEditMode) {
        const editId = searchParams.get('edit');
        if (window.electronAPI) {
          const rRes = await window.electronAPI.invoke('resource:list');
          if (rRes.success) {
            const item = rRes.data.find((r: any) => r.id.toString() === editId);
            if (item) {
              setName(item.name);
              setCategoryId(item.categoryId.toString());
              setStatus(item.status);
              if (item.customFields) setCustomFields(JSON.parse(item.customFields));
            }
          }
        } else {
          const storedRes = localStorage.getItem('mock_resources');
          if (storedRes) {
            const resList = JSON.parse(storedRes);
            const item = resList.find((r: any) => r.id.toString() === editId);
            if (item) {
              setName(item.name);
              setCategoryId(item.categoryId.toString());
              setStatus(item.status);
              if (item.customFields) setCustomFields(JSON.parse(item.customFields));
            }
          }
        }
      }
    };
    fetchCats();
  }, [isEditMode, searchParams]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      alert('자원 이름을 입력해주세요.');
      return;
    }
    if (!categoryId) {
      alert('카테고리를 선택해야 합니다. 카테고리가 없다면 먼저 생성해주세요.');
      return;
    }
    
    const parsedCatId = parseInt(categoryId, 10);
    const finalCatId = isNaN(parsedCatId) ? categoryId : parsedCatId;

    const data = {
      name,
      categoryId: finalCatId,
      status,
      customFields: JSON.stringify(customFields.filter(f => f.name.trim()))
    };
    try {
      if (window.electronAPI) {
        if (isEditMode) {
          const editId = parseInt(searchParams.get('edit') || '0', 10);
          const res = await window.electronAPI.invoke('resource:update', { id: editId, data });
          if (!res.success) {
            setTimeout(() => alert('수정 실패: ' + res.error), 100);
            return;
          }
        } else {
          const res = await window.electronAPI.invoke('resource:create', data);
          if (!res.success) {
            setTimeout(() => alert('등록 실패: ' + res.error), 100);
            return;
          }
        }
      } else {
        const newId = `res-${Date.now()}`;
        const storedRes = localStorage.getItem('mock_resources');
        const resList = storedRes ? JSON.parse(storedRes) : [];
        if (!isEditMode) {
          resList.push({ id: newId, ...data });
          localStorage.setItem('mock_resources', JSON.stringify(resList));
        } else {
          const editId = searchParams.get('edit');
          const index = resList.findIndex((r: any) => r.id.toString() === editId);
          if (index !== -1) {
            resList[index] = { ...resList[index], ...data };
            localStorage.setItem('mock_resources', JSON.stringify(resList));
          }
        }
      }
      navigate('/resources');
    } catch (err: any) {
      setTimeout(() => alert('오류 발생: ' + err.message), 100);
    }
  };
  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="h-[120px] flex-shrink-0 px-8 flex flex-col justify-center border-b border-border bg-surface-container-lowest">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-3">
          <button onClick={() => navigate('/resources')} className="hover:text-primary">자원 관리</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-primary font-bold">{title}</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-[1000px] mx-auto border border-border bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          
          <div className="p-8 flex-1 overflow-y-auto">
            <div className="flex gap-10 mb-10">
              {/* Left Image Upload */}
              <div className="w-[300px] flex-shrink-0">
                <label className="text-xs font-bold text-slate-700 mb-2 block">자원 이미지</label>
                <div className="w-full h-[280px] bg-[#f1f5f9] border-2 border-dashed border-[#cbd5e1] rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 transition-colors">
                  <ImagePlus className="w-10 h-10 mb-3 text-slate-400" />
                  <span className="font-bold text-sm text-slate-600">이미지 업로드</span>
                  <span className="text-xs mt-1">PNG, JPG (최대 5MB)</span>
                </div>
              </div>

              {/* Right Form */}
              <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-6">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">자원명 <span className="text-error">*</span></label>
                  <Input placeholder="예: 대회의실 A, 프로젝트 빔프로젝터" value={name} onChange={e => setName(e.target.value)} />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">카테고리 <span className="text-error">*</span></label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택해주세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">위치</label>
                  <Input placeholder="예: 본관 3층" />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-1.5 block">설명 / 수용 인원</label>
                  <textarea 
                    className="w-full h-24 rounded-md border border-[#CBD5E1] bg-surface-container-lowest p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary resize-none placeholder:text-muted-foreground"
                    placeholder="자원에 대한 상세 설명이나 최대 수용 인원을 입력하세요."
                  />
                </div>

                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 mb-3 block">상태</label>
                  <RadioGroup value={status} onValueChange={setStatus} className="flex gap-6">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="AVAILABLE" id="r1" />
                      <Label htmlFor="r1" className="text-[14px]">사용 가능</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MAINTENANCE" id="r2" />
                      <Label htmlFor="r2" className="text-[14px] font-normal">정비 중</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="UNAVAILABLE" id="r3" />
                      <Label htmlFor="r3" className="text-[14px] font-normal">사용 불가</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>

            <hr className="border-border my-8" />

            {/* Custom Columns */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-foreground">사용자 정의 컬럼</h2>
                <Button variant="ghost" className="text-primary hover:bg-primary-fixed" onClick={() => setCustomFields([...customFields, {name:'', value:''}])}>
                  + 컬럼 추가
                </Button>
              </div>

              {customFields.map((field, idx) => (
                <div key={idx} className="flex items-center gap-4 mb-3">
                  <div className="flex-[0.4]">
                    <Input placeholder="컬럼명 입력" value={field.name} onChange={(e) => {
                      const newF = [...customFields];
                      newF[idx].name = e.target.value;
                      setCustomFields(newF);
                    }} />
                  </div>
                  <div className="flex-[0.6] flex items-center gap-3">
                    <div className="flex-1">
                      <Input placeholder="기본값 입력" value={field.value} onChange={(e) => {
                        const newF = [...customFields];
                        newF[idx].value = e.target.value;
                        setCustomFields(newF);
                      }} />
                    </div>
                    <button className="text-slate-400 hover:text-error" onClick={() => setCustomFields(customFields.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 mt-2">
                자원별로 추가적인 정보를 관리하고 싶을 때 사용자 정의 컬럼을 활용하세요.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border flex justify-end gap-3 bg-surface-container-lowest">
            <Button variant="outline" className="w-24" onClick={() => navigate('/resources')}>취소</Button>
            <Button className="w-28 font-bold" onClick={handleSubmit} disabled={categories.length === 0}>{submitText}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
