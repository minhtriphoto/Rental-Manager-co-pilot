import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Flashlight, Droplet, Camera, Zap, AlertTriangle, Play, Save, PenLine, FileText } from 'lucide-react';
import { UtilityReading, Room } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Utilities = () => {
  const { state, setUtilityReadings } = useAppStore();
  const [search, setSearch] = useState('');
  
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  
  const selectedRoom = state.rooms.find(r => r.id === selectedRoomId);
  const activeTenants = state.tenants.filter(t => t.roomId === selectedRoomId && t.status === 'đang thuê');
  const occupantCount = activeTenants.length;

  const [form, setForm] = useState<Partial<UtilityReading>>({
    electricOld: 0,
    electricNew: 0,
    electricPrice: 3500,
    waterCalcMethod: 'đồng hồ',
    waterOld: 0,
    waterNew: 0,
    waterUsage: 0,
    waterPrice: 20000,
  });

  useEffect(() => {
    if (selectedRoomId) {
      // Find this month's reading
      let currentReading = state.utilityReadings.find(r => r.roomId === selectedRoomId && r.month === targetMonth);
      
      // If none, maybe pre-fill from last month
      if (!currentReading) {
        // compute last month string
        const [y, m] = targetMonth.split('-');
        let lm = parseInt(m) - 1;
        let ly = parseInt(y);
        if (lm === 0) {
          lm = 12;
          ly -= 1;
        }
        const lastMonth = `${ly}-${String(lm).padStart(2, '0')}`;
        const lastReading = state.utilityReadings.find(r => r.roomId === selectedRoomId && r.month === lastMonth);
        
        let override: any = {};
        if (lastReading) {
            override = {
                electricOld: lastReading.electricNew,
                waterOld: lastReading.waterCalcMethod === 'đồng hồ' ? lastReading.waterNew : 0,
                waterCalcMethod: lastReading.waterCalcMethod,
                electricPrice: lastReading.electricPrice,
                waterPrice: lastReading.waterPrice,
            };
        } else {
             override = {
                electricOld: 0,
                waterOld: 0,
             };
        }

        setForm({
            ...form,
            ...override,
            electricNew: override.electricOld || 0,
            waterNew: override.waterOld || 0,
        });

      } else {
        setForm(currentReading);
      }
    }
  }, [selectedRoomId, targetMonth]);

  const handleSave = () => {
    if (!selectedRoomId) return;

    let eUsage = (form.electricNew || 0) - (form.electricOld || 0);
    // water calculation based on method
    let wUsage = 0;
    if (form.waterCalcMethod === 'người') {
        wUsage = form.waterUsage || occupantCount || 1; // Number of people
    } else {
        wUsage = (form.waterNew || 0) - (form.waterOld || 0); // Usage in cubic meters
    }

    const newReading: UtilityReading = {
      id: form.id || `ur-${Date.now()}-${selectedRoomId}`,
      roomId: selectedRoomId,
      month: targetMonth,
      electricOld: form.electricOld || 0,
      electricNew: form.electricNew || 0,
      electricUsage: eUsage,
      electricPrice: form.electricPrice || 3500,
      electricTotal: eUsage * (form.electricPrice || 3500),
      waterCalcMethod: form.waterCalcMethod || 'đồng hồ',
      waterOld: form.waterOld || 0,
      waterNew: form.waterNew || 0,
      waterUsage: wUsage,
      waterPrice: form.waterPrice || 20000,
      waterTotal: wUsage * (form.waterPrice || 20000),
      electricImageToVerify: form.electricImageToVerify,
      waterImageToVerify: form.waterImageToVerify,
    };

    const existingIndex = state.utilityReadings.findIndex(r => r.id === newReading.id || (r.roomId === selectedRoomId && r.month === targetMonth));
    let nextReadings = [...state.utilityReadings];
    if (existingIndex >= 0) {
      nextReadings[existingIndex] = newReading;
    } else {
      nextReadings.push(newReading);
    }
    setUtilityReadings(nextReadings);
    setSelectedRoomId(null);
  };

  const rentedRooms = state.rooms.filter(r => r.status === 'đang thuê');
  const filteredRooms = rentedRooms.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  const eUsageDiff = (form.electricNew || 0) - (form.electricOld || 0);
  const isElectricWarning = eUsageDiff < 0;
  const isHighElectric = eUsageDiff > 100; // Warning threshold >100 kWh

  const wUsageDiff = (form.waterNew || 0) - (form.waterOld || 0);
  const isWaterWarning = form.waterCalcMethod === 'đồng hồ' && wUsageDiff < 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chỉ số Điện Nước</h2>
          <p className="text-muted-foreground text-sm">Ghi chép và quản lý chỉ số tiêu thụ hàng tháng.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <Input type="month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="w-[150px] font-medium text-blue-600" />
            </div>
            <div className="relative w-full sm:w-64 border rounded-md">
                 <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                 <Input placeholder="Tìm phòng đang thuê..." className="pl-8 border-none" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {filteredRooms.map(room => {
                const reading = state.utilityReadings.find(r => r.roomId === room.id && r.month === targetMonth);
                return (
                    <div 
                        key={room.id} 
                        className={`p-4 border rounded-xl cursor-pointer hover:shadow-md transition-shadow relative ${reading ? 'bg-slate-50 border-blue-100' : 'bg-white border-slate-200'} group`}
                        onClick={() => setSelectedRoomId(room.id)}
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg">{room.name}</h3>
                            {reading ? (
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Đã chốt</Badge>
                            ) : (
                                <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">Chưa chốt</Badge>
                            )}
                        </div>
                        
                        {reading ? (
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100">
                                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500" /> Điện</span>
                                    <span className="font-medium text-slate-800">{reading.electricUsage} <span className="text-[10px] text-slate-400 font-normal">kWh</span></span>
                                </div>
                                <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-slate-100">
                                    <span className="flex items-center gap-1.5"><Droplet className="w-3.5 h-3.5 text-blue-500" /> Nước</span>
                                    <span className="font-medium text-slate-800">
                                        {reading.waterUsage} <span className="text-[10px] text-slate-400 font-normal">{reading.waterCalcMethod === 'người' ? 'người' : 'khối'}</span>
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-slate-400 py-3 flex justify-center border border-dashed rounded bg-slate-50/50">
                                Bấm để ghi chỉ số
                            </div>
                        )}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <PenLine className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                )
            })}
            {filteredRooms.length === 0 && (
                <div className="col-span-full py-10 text-center text-slate-500">
                    Không tìm thấy phòng đang thuê nào.
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedRoomId} onOpenChange={(open) => !open && setSelectedRoomId(null)}>
        <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto">
          {selectedRoom && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-500" /> 
                  Phòng {selectedRoom.name}
                </SheetTitle>
                <div className="text-sm text-muted-foreground">Kỳ chốt: Tháng {targetMonth}</div>
              </SheetHeader>

              <div className="space-y-8">
                {/* Electricity Section */}
                <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2 uppercase tracking-wide text-xs text-slate-500 border-b pb-2">
                        <Zap className="w-4 h-4 text-amber-500" /> Chỉ số điện (kWh)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs">Chỉ số cũ</label>
                            <Input type="number" value={form.electricOld} onChange={e => setForm({...form, electricOld: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-blue-700">Chỉ số mới</label>
                            <Input type="number" className="font-bold border-blue-200 bg-blue-50" value={form.electricNew} onChange={e => setForm({...form, electricNew: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    {isElectricWarning && (
                        <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-100">
                           <AlertTriangle className="w-4 h-4 shrink-0" />
                           <span>Chỉ số mới đang nhỏ hơn chỉ số cũ! Vui lòng kiểm tra lại.</span>
                        </div>
                    )}
                    {isHighElectric && !isElectricWarning && (
                        <div className="flex items-start gap-2 text-amber-600 text-xs bg-amber-50 p-2 rounded border border-amber-100">
                           <AlertTriangle className="w-4 h-4 shrink-0" />
                           <span>Mức tiêu thụ điện ({eUsageDiff} kWh) khá cao. Hãy xác nhận lại với khách.</span>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div>
                            <div className="text-[10px] text-slate-500 uppercase">Tiêu thụ</div>
                            <div className="font-bold">{Math.max(0, eUsageDiff)} kWh</div>
                        </div>
                        <div className="text-center text-slate-400">×</div>
                        <div className="text-right">
                             <div className="text-[10px] text-slate-500 uppercase">Đơn giá (₫)</div>
                             <Input type="number" className="h-7 text-right text-sm" value={form.electricPrice} onChange={e => setForm({...form, electricPrice: parseInt(e.target.value) || 0})} />
                        </div>
                    </div>
                    
                    <div className="flex justify-start">
                        <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => alert('Tính năng chụp ảnh đang phát triển')}>
                            <Camera className="w-3.5 h-3.5 mr-1" /> Chụp đồng hồ điện
                        </Button>
                    </div>
                </div>

                {/* Water Section */}
                <div className="space-y-4">
                    <h4 className="font-bold flex items-center justify-between gap-2 border-b pb-2">
                        <div className="flex items-center gap-2 uppercase tracking-wide text-xs text-slate-500">
                            <Droplet className="w-4 h-4 text-blue-500" /> Nước sinh hoạt
                        </div>
                        <Select value={form.waterCalcMethod} onValueChange={(v: any) => setForm({...form, waterCalcMethod: v})}>
                            <SelectTrigger className="w-[130px] h-7 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="đồng hồ">Theo đồng hồ</SelectItem>
                                <SelectItem value="người">Theo đầu người</SelectItem>
                            </SelectContent>
                        </Select>
                    </h4>

                    {form.waterCalcMethod === 'đồng hồ' ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs">Chỉ số cũ</label>
                                    <Input type="number" value={form.waterOld} onChange={e => setForm({...form, waterOld: parseInt(e.target.value) || 0})} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-blue-700">Chỉ số mới</label>
                                    <Input type="number" className="font-bold border-blue-200 bg-blue-50" value={form.waterNew} onChange={e => setForm({...form, waterNew: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>
                            {isWaterWarning && (
                                <div className="flex items-start gap-2 text-red-600 text-xs bg-red-50 p-2 rounded border border-red-100">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                <span>Chỉ số mới đang nhỏ hơn chỉ số cũ! Vui lòng kiểm tra lại.</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase">Tiêu thụ</div>
                                    <div className="font-bold">{Math.max(0, wUsageDiff)} m³</div>
                                </div>
                                <div className="text-center text-slate-400">×</div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-500 uppercase">Đơn giá (₫)</div>
                                    <Input type="number" className="h-7 text-right text-sm" value={form.waterPrice} onChange={e => setForm({...form, waterPrice: parseInt(e.target.value) || 0})} />
                                </div>
                            </div>
                            <div className="flex justify-start">
                                <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => alert('Tính năng chụp ảnh đang phát triển')}>
                                    <Camera className="w-3.5 h-3.5 mr-1" /> Chụp đồng hồ nước
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="grid grid-cols-3 gap-4 items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <div>
                                <div className="text-[10px] text-slate-500 uppercase">Số người</div>
                                <Input type="number" className="h-7 mt-1 font-bold" value={form.waterUsage || occupantCount} onChange={e => setForm({...form, waterUsage: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="text-center text-slate-400 mt-5">×</div>
                            <div className="text-right">
                                 <div className="text-[10px] text-slate-500 uppercase">Đơn giá người (₫)</div>
                                 <Input type="number" className="h-7 mt-1 text-right text-sm" value={form.waterPrice} onChange={e => setForm({...form, waterPrice: parseInt(e.target.value) || 0})} />
                            </div>
                        </div>
                    )}
                </div>

                 <div className="pt-6 border-t flex justify-end gap-3 mt-8">
                  <Button variant="outline" onClick={() => setSelectedRoomId(null)}>Hủy</Button>
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" /> Lưu chỉ số
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
