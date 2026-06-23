import React, { useState, useEffect } from 'react';
import { useAppStore } from '../../lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  DoorOpen, 
  FileText, 
  Receipt, 
  Phone, 
  CreditCard, 
  Calendar, 
  MapPin, 
  Briefcase, 
  AlertTriangle, 
  Check, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  Info,
  DollarSign,
  Droplet,
  Zap,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GlobalSearch = () => {
  const { state } = useAppStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Inspector state
  const [inspectedItem, setInspectedItem] = useState<{
    type: 'tenant' | 'room' | 'contract' | 'invoice';
    data: any;
  } | null>(null);

  // Keyboard shortcut Ctrl+K to open global search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clear query and inspector when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setInspectedItem(null);
    }
  }, [isOpen]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const getFilteredResults = () => {
    if (!query.trim()) return { tenants: [], rooms: [], contracts: [], invoices: [] };
    const q = query.toLowerCase().trim();

    // 1. Search Tenants (name, phone, idCard)
    const tenants = state.tenants.filter(t => {
      const room = state.rooms.find(r => r.id === t.roomId);
      return (
        t.fullName.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        t.idCard.includes(q) ||
        room?.name.toLowerCase().includes(q)
      );
    });

    // 2. Search Rooms (name/code, type)
    const rooms = state.rooms.filter(r => 
      r.name.toLowerCase().includes(q) || 
      (r.code && r.code.toLowerCase().includes(q)) ||
      r.type.toLowerCase().includes(q)
    );

    // 3. Search Contracts (contract ID, tenant names, room names)
    const contracts = state.contracts.filter(c => {
      const tenant = state.tenants.find(t => t.id === c.representativeId);
      const room = state.rooms.find(r => r.id === c.roomId);
      return (
        c.id.toLowerCase().includes(q) ||
        tenant?.fullName.toLowerCase().includes(q) ||
        room?.name.toLowerCase().includes(q)
      );
    });

    // 4. Search Invoices (invoice ID, tenant names, room names, month)
    const invoices = state.invoices.filter(i => {
      const tenant = state.tenants.find(t => t.id === i.tenantId) || 
                     state.tenants.find(t => t.roomId === i.roomId && t.isRepresentative && t.status === 'đang thuê');
      const room = state.rooms.find(r => r.id === i.roomId);
      return (
        i.id.toLowerCase().includes(q) ||
        (tenant?.fullName && tenant.fullName.toLowerCase().includes(q)) ||
        (room?.name && room.name.toLowerCase().includes(q)) ||
        i.month.toLowerCase().includes(q)
      );
    });

    return { tenants, rooms, contracts, invoices };
  };

  const results = getFilteredResults();
  const totalResultsCount = results.tenants.length + results.rooms.length + results.contracts.length + results.invoices.length;

  // Set first result as inspected when list changes
  useEffect(() => {
    if (totalResultsCount > 0) {
      if (results.tenants.length > 0) {
        setInspectedItem({ type: 'tenant', data: results.tenants[0] });
      } else if (results.rooms.length > 0) {
        setInspectedItem({ type: 'room', data: results.rooms[0] });
      } else if (results.contracts.length > 0) {
        setInspectedItem({ type: 'contract', data: results.contracts[0] });
      } else if (results.invoices.length > 0) {
        setInspectedItem({ type: 'invoice', data: results.invoices[0] });
      }
    } else {
      setInspectedItem(null);
    }
  }, [query]);

  const handleNavigateToResult = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Permanent Search Trigger Button in AppLayout Header */}
      <div className="relative w-48 sm:w-72 max-w-full group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
        <button
          onClick={() => setIsOpen(true)}
          className="w-full h-9 pl-9 pr-12 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-left text-xs text-slate-500 transition-all cursor-pointer font-medium"
        >
          <span>Tìm kiếm toàn hệ thống...</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-sm leading-none">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* SpotLight Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border-slate-200 outline-none flex flex-col h-[580px] bg-white gap-0">
          
          {/* Header query box */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 shrink-0">
            <Search className="w-5 h-5 text-indigo-600" />
            <Input
              placeholder="Nhập tên khách thuê, Số điện thoại, CCCD, Mã phòng, Mã hợp đồng, Mã phiếu thu..."
              className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base font-medium placeholder:text-slate-400"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] text-slate-450 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 rounded px-2"
                onClick={() => setQuery('')}
              >
                Xóa
              </Button>
            )}
          </div>

          {/* Main Workspace: Left List - Right Detail Inspector */}
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 bg-white">
            
            {/* Left list results panel */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-100 overflow-y-auto p-3 space-y-4">
              {!query.trim() ? (
                <div className="flex flex-col items-center justify-center text-center py-16 text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">Tìm kiếm tức thì toàn khu trọ</h5>
                    <p className="text-xs text-slate-500 mt-1 max-w-[280px] leading-normal">
                      Nhập thông tin bất kỳ, hệ thống sẽ rà soát các hợp vật lý, khách lưu trú, phòng ốc và công nợ.
                    </p>
                  </div>
                  <div className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded border border-slate-200">
                    Sử dụng các tiền tố hoặc cụm từ tự nhiên tiếng Việt
                  </div>
                </div>
              ) : totalResultsCount === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-24 text-slate-400 space-y-2">
                  <span className="text-lg font-bold">😕 Không tìm thấy kết quả</span>
                  <p className="text-xs text-slate-500 max-w-[280px]">
                    Hệ thống không ghi nhận dữ liệu khớp với thông tin "{query}". Vui lòng kiểm tra lại chính tả hoặc khoảng cách.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Category: Tenants */}
                  {results.tenants.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider flex justify-between">
                        <span>Khách thuê lưu trú ({results.tenants.length})</span>
                      </div>
                      <div className="space-y-0.5">
                        {results.tenants.map(t => {
                          const room = state.rooms.find(r => r.id === t.roomId);
                          const isInspected = inspectedItem?.type === 'tenant' && inspectedItem.data.id === t.id;
                          return (
                            <div
                              key={t.id}
                              onClick={() => setInspectedItem({ type: 'tenant', data: t })}
                              className={`p-2.5 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between group ${
                                isInspected ? 'bg-indigo-50 border-indigo-250 border' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                  {t.fullName.split(' ').pop()?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-indigo-700">{t.fullName}</span>
                                  <span className="text-[10px] text-slate-450 flex items-center gap-1">
                                    <Phone className="w-2.5 h-2.5" /> {t.phone} {room && `• Phòng ${room.name}`}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category: Rooms */}
                  {results.rooms.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
                        Danh sách phòng trọ ({results.rooms.length})
                      </div>
                      <div className="space-y-0.5">
                        {results.rooms.map(r => {
                          const isInspected = inspectedItem?.type === 'room' && inspectedItem.data.id === r.id;
                          return (
                            <div
                              key={r.id}
                              onClick={() => setInspectedItem({ type: 'room', data: r })}
                              className={`p-2.5 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between group ${
                                isInspected ? 'bg-amber-50 border-amber-250 border' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-850 flex items-center justify-center font-bold text-xs shrink-0">
                                  {r.name.replace(/\D/g, '') || r.name}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 block truncate group-hover:text-amber-700">Phòng {r.name}</span>
                                  <span className="text-[10px] text-slate-450 capitalize">
                                    Tầng {r.floor} • {r.type} • {r.status}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category: Contracts */}
                  {results.contracts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
                        Phụ lục hợp đồng ({results.contracts.length})
                      </div>
                      <div className="space-y-0.5">
                        {results.contracts.map(c => {
                          const room = state.rooms.find(r => r.id === c.roomId);
                          const tenant = state.tenants.find(t => t.id === c.representativeId);
                          const isInspected = inspectedItem?.type === 'contract' && inspectedItem.data.id === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setInspectedItem({ type: 'contract', data: c })}
                              className={`p-2.5 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between group ${
                                isInspected ? 'bg-purple-50 border-purple-255 border' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-750 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4 text-purple-650" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 block truncate">HĐ {c.id}</span>
                                  <span className="text-[10px] text-slate-450 truncate block">
                                    P.{room?.name || '---'} • {tenant?.fullName || 'Khách thuê'} ({c.status})
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category: Invoices */}
                  {results.invoices.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400 px-2 tracking-wider">
                        Phiếu thu & Hóa đơn ({results.invoices.length})
                      </div>
                      <div className="space-y-0.5">
                        {results.invoices.map(i => {
                          const room = state.rooms.find(r => r.id === i.roomId);
                          const isInspected = inspectedItem?.type === 'invoice' && inspectedItem.data.id === i.id;
                          return (
                            <div
                              key={i.id}
                              onClick={() => setInspectedItem({ type: 'invoice', data: i })}
                              className={`p-2.5 rounded-lg text-left cursor-pointer transition-all flex items-center justify-between group ${
                                isInspected ? 'bg-emerald-50 border-emerald-250 border' : 'hover:bg-slate-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-750 flex items-center justify-center shrink-0">
                                  <Receipt className="w-4 h-4 text-emerald-650" />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-semibold text-xs text-slate-900 block truncate">Phiêu thu #{i.id.split('-').pop()?.toUpperCase()}</span>
                                  <span className="text-[10px] text-slate-450 block">
                                    Tháng {i.month.split('-').reverse().join('/')} • P.{room?.name} • <span className="font-bold text-slate-600">{i.totalAmount.toLocaleString()} đ</span>
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-350 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            {/* Right details Inspector Panel */}
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-50/70 overflow-y-auto p-4 flex flex-col justify-between min-h-0">
              {inspectedItem ? (
                <div className="space-y-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header badge of inspection type */}
                    <div className="flex items-center justify-between">
                      <Badge className={`uppercase text-[9px] font-black tracking-widest ${
                        inspectedItem.type === 'tenant' ? 'bg-indigo-650 text-white' :
                        inspectedItem.type === 'room' ? 'bg-amber-600 text-white' :
                        inspectedItem.type === 'contract' ? 'bg-purple-650 text-white' : 'bg-emerald-650 text-white'
                      }`}>
                        Chi tiết {
                          inspectedItem.type === 'tenant' ? 'Khách thuê' :
                          inspectedItem.type === 'room' ? 'Phòng trọ' :
                          inspectedItem.type === 'contract' ? 'Hợp đồng' : 'Hóa đơn / Phiếu thu'
                        }
                      </Badge>
                      <button 
                        onClick={() => handleCopyText(JSON.stringify(inspectedItem.data, null, 2), inspectedItem.data.id)}
                        className="text-[10px] text-slate-450 hover:text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded px-1.5 py-0.5 flex items-center gap-1 shadow-xs transition-all"
                      >
                        {copiedId === inspectedItem.data.id ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-green-500" /> Co-copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" /> Copy Data
                          </>
                        )}
                      </button>
                    </div>

                    {/* RENDER DYNAMIC INSPECTOR VIEWS */}
                    
                    {/* 1. Tenant inspector */}
                    {inspectedItem.type === 'tenant' && (() => {
                      const t = inspectedItem.data;
                      const room = state.rooms.find(r => r.id === t.roomId);
                      return (
                        <div className="mt-4 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-extrabold text-lg border border-indigo-200 shadow-sm">
                              {t.fullName.split(' ').pop()?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-extrabold text-base text-slate-900 leading-tight">{t.fullName}</h4>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                <span className={t.status === 'đang thuê' ? 'text-green-600 bg-green-50 px-1.5 py-0.2 rounded font-bold' : 'text-slate-400 font-medium'}>
                                  {t.status}
                                </span>
                                {t.isRepresentative && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 rounded font-bold uppercase">Đại diện HĐ</span>}
                              </p>
                            </div>
                          </div>

                          <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2.5 text-xs">
                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Điện thoại</span>
                                <span className="text-slate-800 font-semibold">{t.phone}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Số CCCD</span>
                                <span className="text-slate-800 font-semibold font-mono">{t.idCard}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Địa chỉ phòng</span>
                                <span className="text-slate-900 font-black">Phòng {room?.name || '---'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Ngày vào ở</span>
                                <span className="text-slate-800 font-semibold">{t.startDate}</span>
                              </div>
                            </div>

                            <div className="pb-2 border-b border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Email liên hệ</span>
                              <span className="text-slate-800">{t.email || 'Chưa cập nhật'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Công việc</span>
                                <span className="text-slate-800">{t.job || '---'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Quê quán</span>
                                <span className="text-slate-800 truncate block">{t.hometown || '---'}</span>
                              </div>
                            </div>
                          </div>

                          {t.notes && (
                            <div className="bg-slate-100 text-slate-650 rounded-lg p-2.5 text-xs border border-slate-200">
                              <span className="font-bold block mb-0.5 text-[10px] uppercase text-slate-400">Ghi chú</span>
                              {t.notes}
                            </div>
                          )}

                          <div className="pt-2 flex gap-2">
                            <Button size="sm" className="w-full bg-indigo-650 text-white font-bold text-xs" onClick={() => handleNavigateToResult('/tenants')}>
                              Quản lý Khách thuê
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 2. Room Inspector */}
                    {inspectedItem.type === 'room' && (() => {
                      const r = inspectedItem.data;
                      const activeTenant = state.tenants.find(t => t.roomId === r.id && t.isRepresentative && t.status === 'đang thuê');
                      const roomAssetsSum = state.roomAssets.filter(asset => asset.roomId === r.id).length;
                      return (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="font-black text-slate-900 text-xl flex items-center gap-1.5">
                              Phòng {r.name}
                              <Badge className={
                                r.status === 'đang thuê' ? 'bg-green-150 text-green-700 border border-green-200 hover:bg-green-150 shadow-xs font-black' :
                                r.status === 'trống' ? 'bg-pink-100 text-pink-700 hover:bg-pink-100 font-bold' : 'bg-slate-200 text-slate-700 hover:bg-slate-200'
                              }>
                                {r.status}
                              </Badge>
                            </h4>
                            <p className="text-[11px] text-slate-450 mt-1 capitalize font-medium">{r.type} • Tầng {r.floor} • Diện tích {r.area} m²</p>
                          </div>

                          <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2.5 text-xs">
                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Giá thuê cố định</span>
                                <span className="text-amber-700 font-black text-sm">{r.basePrice.toLocaleString()} đ/Tháng</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Tiền cọc yêu cầu</span>
                                <span className="text-slate-800 font-bold">{r.depositRequired.toLocaleString()} đ</span>
                              </div>
                            </div>

                            <div className="pb-2 border-b border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Khách đại diện hiện tại</span>
                              <span className="text-slate-950 font-semibold">{activeTenant ? activeTenant.fullName : 'Chưa có hợp đồng / Phòng trống'}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Số người tối đa</span>
                                <span className="text-slate-800 font-medium">{r.maxOccupants} người</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Tổng số tài sản bàn giao</span>
                                <span className="text-slate-800 font-medium">{roomAssetsSum} trang bị lớn</span>
                              </div>
                            </div>
                          </div>

                          {r.furnitureDescription && (
                            <div className="bg-slate-100 text-slate-650 rounded-lg p-2.5 text-xs border border-slate-200">
                              <span className="font-bold block mb-0.5 text-[10px] uppercase text-slate-400">Hiện trạng nội thất bàn giao</span>
                              {r.furnitureDescription}
                            </div>
                          )}

                          <div className="pt-2">
                            <Button size="sm" variant="outline" className="w-full border-slate-350 text-xs font-bold" onClick={() => handleNavigateToResult('/rooms')}>
                              Đến Sơ đồ phòng ngủ / Căn hộ
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Contract Inspector */}
                    {inspectedItem.type === 'contract' && (() => {
                      const c = inspectedItem.data;
                      const room = state.rooms.find(r => r.id === c.roomId);
                      const tenant = state.tenants.find(t => t.id === c.representativeId);
                      return (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="font-black text-slate-950 text-base">Hợp đồng thuê phòng {room?.name || '---'}</h4>
                            <p className="text-[10px] text-slate-450 font-mono mt-0.5">ID: {c.id}</p>
                          </div>

                          <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2.5 text-xs">
                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Chủ hợp đồng</span>
                                <span className="text-slate-850 font-bold block truncate">{tenant ? tenant.fullName : '---'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Số điện thoại</span>
                                <span className="text-slate-850 font-bold block">{tenant?.phone || '---'}</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pb-2 border-b border-slate-100">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Giá thuê trong HĐ</span>
                                <span className="text-indigo-700 font-bold">{c.price.toLocaleString()} đ/Tháng</span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Đặt cọc thực đóng</span>
                                <span className="text-green-700 font-bold">{c.deposit.toLocaleString()} đ</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Hạn hợp đồng</span>
                                <span className="text-slate-800 font-medium block leading-normal">
                                  {c.startDate} <br />
                                  đến {c.endDate}
                                </span>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wide">Chu kỳ đóng</span>
                                <span className="text-slate-800 font-medium capitalize">Mỗi {c.paymentCycle} / Ngày {c.collectionDay}</span>
                              </div>
                            </div>
                          </div>

                          {c.fixedServices && c.fixedServices.length > 0 && (
                            <div className="bg-slate-100 text-slate-650 rounded-lg p-2.5 text-xs border border-slate-200 space-y-1">
                              <span className="font-bold block text-[10px] uppercase text-slate-400">Các dịch vụ đi kèm</span>
                              <div className="space-y-0.5">
                                {c.fixedServices.map((srv: any, i: number) => (
                                  <div key={i} className="flex justify-between text-[11px] font-medium">
                                    <span className="capitalize">{srv.name}</span>
                                    <span>{srv.price.toLocaleString()} đ</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="pt-2">
                            <Button size="sm" className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs" onClick={() => handleNavigateToResult('/tenants')}>
                              Xem chi tiết trên Hợp đồng
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 4. Invoice Inspector */}
                    {inspectedItem.type === 'invoice' && (() => {
                      const iv = inspectedItem.data;
                      const room = state.rooms.find(r => r.id === iv.roomId);
                      const tenant = state.tenants.find(t => t.id === iv.tenantId) || 
                                     state.tenants.find(t => t.roomId === iv.roomId && t.isRepresentative && t.status === 'đang thuê');
                      return (
                        <div className="mt-4 space-y-4">
                          <div>
                            <h4 className="font-black text-slate-950 text-base">Phiếu thu tháng {iv.month.split('-').reverse().join('/')}</h4>
                            <p className="text-[10px] text-slate-400">Phòng {room?.name || '---'} • <span className="font-bold text-slate-500">{tenant?.fullName}</span></p>
                          </div>

                          <div className="border border-slate-150 rounded-lg p-3 bg-white space-y-2.5 text-xs">
                            <div className="flex justify-between pb-1.5 border-b border-dashed">
                              <span className="text-slate-550 font-bold block">Tổng cộng thu chi chi tiết:</span>
                              <Badge className={`uppercase text-[9px] font-black ${
                                iv.status === 'đã thu đủ' ? 'bg-emerald-50 text-emerald-800 border-emerald-200 border' : 'bg-red-50 text-red-800 border-red-200 border animate-pulse'
                              }`}>
                                {iv.status}
                              </Badge>
                            </div>

                            <div className="space-y-1 border-b pb-2">
                              <div className="flex justify-between text-slate-600">
                                <span>Tiền phòng cố định:</span>
                                <span>{iv.roomRent.toLocaleString()} đ</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Tiền Điện sinh hoạt:</span>
                                <span>{iv.electricFee.toLocaleString()} đ</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Tiền Nước lưu sinh:</span>
                                <span>{iv.waterFee.toLocaleString()} đ</span>
                              </div>
                              {(iv.internetFee > 0 || iv.parkingFee > 0 || iv.cleaningFee > 0) && (
                                <div className="flex justify-between text-slate-600">
                                  <span>Tổng dịch vụ phụ trợ:</span>
                                  <span>{(iv.internetFee + iv.parkingFee + iv.cleaningFee).toLocaleString()} đ</span>
                                </div>
                              )}
                              {iv.discount > 0 && (
                                <div className="flex justify-between text-emerald-600 font-semibold">
                                  <span>Khấu trừ / Giảm giá:</span>
                                  <span>-{iv.discount.toLocaleString()} đ</span>
                                </div>
                              )}
                              {iv.surcharge > 0 && (
                                <div className="flex justify-between text-amber-700">
                                  <span>Phụ thu khác:</span>
                                  <span>+{iv.surcharge.toLocaleString()} đ</span>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1">
                              <div>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Tổng tiền phiếu</span>
                                <span className="text-slate-900 font-extrabold text-sm">{iv.totalAmount.toLocaleString()} đ</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">Hạn cuối nộp</span>
                                <span className="text-red-700 font-extrabold">{iv.dueDate}</span>
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => handleNavigateToResult('/billing')}>
                              Mở Phiếu Thu Tháng
                            </Button>
                            <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs" onClick={() => handleNavigateToResult('/debts')}>
                              Đến Công Nợ Gốc
                            </Button>
                          </div>
                        </div>
                      );
                    })()}

                  </div>

                  {/* Inspector Footer Branding */}
                  <div className="text-[10px] border-t pt-3 flex items-center justify-between text-slate-400">
                    <span>Hệ thống Rental Manager v2.5</span>
                    <span>An toàn bảo mật dữ liệu</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center h-full py-12 text-slate-450 space-y-2">
                  <Info className="w-8 h-8 text-slate-300" />
                  <span className="font-semibold text-xs">Ấn vào kết quả tìm kiếm</span>
                  <p className="text-[10px] text-slate-400 max-w-[180px] leading-normal">
                    Chi tiết về dịch vụ phòng, khách gia đình, lịch sử nợ và hóa đơn sẽ hiện hữu tại đây.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Dialog System Footer */}
          <div className="bg-slate-100 px-4 py-2 text-[10px] font-semibold text-slate-400 border-t flex justify-between shrink-0 select-none">
            <span>Mẹo: Sử dụng phím mũi tên hoặc nhấp chuột để điều chỉnh inspector</span>
            <span>Ấn ESC để thoát nhanh</span>
          </div>

        </DialogContent>
      </Dialog>
    </>
  );
};
