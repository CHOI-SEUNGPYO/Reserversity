import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { ChevronDown, ChevronUp, Plus, X, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Resources() {
  const navigate = useNavigate();
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  
  const [categories, setCategories] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  const fetchData = async () => {
    if (window.electronAPI) {
      const cRes = await window.electronAPI.invoke('category:list');
      const rRes = await window.electronAPI.invoke('resource:list');
      if (cRes.success) setCategories(cRes.data);
      if (rRes.success) setResources(rRes.data);
    } else {
      const storedCats = localStorage.getItem('mock_categories');
      if (storedCats) setCategories(JSON.parse(storedCats));
      const storedRes = localStorage.getItem('mock_resources');
      if (storedRes) setResources(JSON.parse(storedRes));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleCat = (id: string) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  const handleAddCategory = async () => {
    if (newCatName.trim()) {
      if (window.electronAPI) {
        await window.electronAPI.invoke('category:create', { name: newCatName.trim(), description: '' });
        await fetchData();
      } else {
        const newId = Date.now();
        const newCats = [...categories, { id: newId, name: newCatName.trim() }];
        setCategories(newCats);
        localStorage.setItem('mock_categories', JSON.stringify(newCats));
        setExpandedCats(prev => ({ ...prev, [newId.toString()]: true }));
      }
      setNewCatName('');
      setIsAddingCat(false);
    }
  };

  const startEditCategory = (e: React.MouseEvent, cat: any) => {
    e.stopPropagation();
    setEditingCatId(cat.id);
    setEditingCatName(cat.name);
  };

  const handleEditCategory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingCatName.trim()) {
      setCategories(categories.map(c => c.id === editingCatId ? { ...c, name: editingCatName.trim() } : c));
      setEditingCatId(null);
    }
  };

  const handleDeleteCategory = async (e: React.MouseEvent, catId: string) => {
    e.stopPropagation();
    const ok = window.electronAPI
      ? await window.electronAPI.invoke('dialog:confirm', '이 카테고리를 삭제하시겠습니까? 관련된 모든 자원도 함께 삭제됩니다.')
      : confirm('이 카테고리를 삭제하시겠습니까? 관련된 모든 자원도 함께 삭제됩니다.');
    if (ok) {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('category:delete', parseInt(catId, 10));
        if (result.success) {
          await fetchData();
        } else {
          alert(result.error || '카테고리 삭제에 실패했습니다.');
        }
      } else {
        const newCats = categories.filter(c => c.id !== catId);
        setCategories(newCats);
        localStorage.setItem('mock_categories', JSON.stringify(newCats));
        const newRes = resources.filter(r => r.categoryId !== catId);
        setResources(newRes);
        localStorage.setItem('mock_resources', JSON.stringify(newRes));
      }
    }
  };

  const handleDeleteResource = async (e: React.MouseEvent, resId: string) => {
    e.stopPropagation();
    const ok = window.electronAPI
      ? await window.electronAPI.invoke('dialog:confirm', '이 자원을 삭제하시겠습니까?')
      : confirm('이 자원을 삭제하시겠습니까?');
    if (ok) {
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('resource:delete', parseInt(resId, 10));
        if (result.success) {
          await fetchData();
        } else {
          alert(result.error || '자원 삭제에 실패했습니다.');
        }
      } else {
        const newRes = resources.filter(r => r.id !== resId);
        setResources(newRes);
        localStorage.setItem('mock_resources', JSON.stringify(newRes));
      }
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Header */}
      <div className="h-[120px] flex-shrink-0 px-8 flex justify-between items-center border-b border-border bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">자원 관리</h1>
          <p className="text-sm text-slate-500">카테고리 및 자원을 관리합니다.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="border-primary text-primary hover:bg-primary-fixed"
            onClick={() => setIsAddingCat(true)}
          >
            + 카테고리 추가
          </Button>
          <Button 
            onClick={() => navigate('/resources/new')} 
            className="bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={categories.length === 0}
            title={categories.length === 0 ? "카테고리를 먼저 추가해주세요." : ""}
          >
            + 자원 추가
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-[1000px] mx-auto space-y-6">
          
          {/* Add Category Prompt */}
          {isAddingCat && (
            <div className="border border-border rounded-xl bg-white p-6 shadow-sm flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-700 mb-1.5 block">새 카테고리 이름</label>
                <Input 
                  placeholder="카테고리 이름 입력 (예: 연구 장비)" 
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                  autoFocus
                />
              </div>
              <div className="mt-5 flex gap-2">
                <Button onClick={handleAddCategory}>추가 완료</Button>
                <Button variant="ghost" onClick={() => setIsAddingCat(false)} className="text-slate-500"><X className="w-5 h-5" /></Button>
              </div>
            </div>
          )}

          {/* Render Categories */}
          {categories.map(cat => {
            const catResources = resources.filter(r => r.categoryId?.toString() === cat.id?.toString());
            const count = catResources.length;

            return (
              <div key={cat.id} className="border border-border rounded-xl bg-surface-container-lowest overflow-hidden shadow-sm group/cat">
                <div 
                  className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => {
                    if (editingCatId !== cat.id) toggleCat(cat.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {editingCatId === cat.id ? (
                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <Input 
                          value={editingCatName}
                          onChange={e => setEditingCatName(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleEditCategory(e as any)}
                          className="h-8 w-40 text-sm"
                          autoFocus
                        />
                        <Button size="sm" onClick={handleEditCategory} className="h-8 px-3 text-xs">수정</Button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingCatId(null); }} className="text-slate-400 p-1"><X className="w-4 h-4"/></button>
                      </div>
                    ) : (
                      <>
                        <h3 className="font-bold text-slate-800">{cat.name}</h3>
                        {count > 0 && <span className="bg-[#e6f0fd] text-primary text-xs px-2 py-0.5 rounded-full font-bold">{count}</span>}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {editingCatId !== cat.id && (
                      <>
                        <button 
                          className="text-slate-300 hover:text-primary opacity-0 group-hover/cat:opacity-100 transition-opacity p-2"
                          onClick={(e) => startEditCategory(e, cat)}
                          title="카테고리 수정"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-slate-300 hover:text-error opacity-0 group-hover/cat:opacity-100 transition-opacity p-2"
                          onClick={(e) => handleDeleteCategory(e, cat.id)}
                          title="카테고리 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="text-slate-400">
                      {expandedCats[cat.id] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {expandedCats[cat.id] && (
                  <div className="border-t border-border p-6 bg-white space-y-3">
                    {catResources.length > 0 ? (
                      catResources.map(res => (
                        <div key={res.id} className="border border-border rounded-lg p-4 flex justify-between items-center group/res">
                          <div className="font-medium text-slate-700">{res.name}</div>
                          <div className="flex items-center gap-4">
                            {res.status?.toLowerCase() === 'available' ? (
                              <div className="bg-[#e6f0fd] text-primary text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block"></span>
                                사용 가능
                              </div>
                            ) : (
                              <div className="bg-[#e6e8ea] text-slate-600 text-xs px-2 py-1 rounded font-bold">
                                정비 중
                              </div>
                            )}
                            <button 
                              className="text-slate-300 hover:text-primary opacity-0 group-hover/res:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/resources/new?edit=${res.id}`);
                              }}
                              title="자원 수정"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              className="text-slate-300 hover:text-error opacity-0 group-hover/res:opacity-100 transition-opacity"
                              onClick={(e) => handleDeleteResource(e, res.id)}
                              title="자원 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-slate-400 text-sm">
                        등록된 자원이 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}
