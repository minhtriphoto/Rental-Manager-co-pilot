import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Building2, MapPin, User, DoorOpen, HardHat, FileText, Settings, AlertCircle, Edit, ListTree } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Building } from '../types';

export const Buildings = () => {
  const { state } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const filteredBuildings = state.buildings.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.address.toLowerCase().includes(search.toLowerCase())
  );

  const getBuildingStats = (buildingId: string) => {
    const rooms = state.rooms.filter(r => r.buildingId === buildingId);
    const occupied = rooms.filter(r => r.status === 'đang thuê').length;
    const empty = rooms.filter(r => r.status === 'trống').length;
    const maintenance = rooms.filter(r => r.status === 'đang sửa').length;
    return { total: rooms.length, occupied, empty, maintenance };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Khu nhà</h2>
          <p className="text-muted-foreground">Quản lý danh sách các khu nhà, tòa nhà hoặc xóm trọ.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Thêm khu nhà
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Tìm theo tên hoặc địa chỉ khu nhà..." 
          className="pl-9 bg-white" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredBuildings.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">Không tìm thấy khu nhà nào</h3>
          <p className="text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm mới.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredBuildings.map(building => {
            const stats = getBuildingStats(building.id);
            const occupancyRate = stats.total > 0 ? Math.round((stats.occupied / stats.total) * 100) : 0;
            
            return (
              <Card key={building.id} className="overflow-hidden bg-white hover:border-slate-300 transition-colors">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-xl font-bold text-slate-900">{building.name}</CardTitle>
                        <Badge className={building.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-slate-200 text-slate-700 hover:bg-slate-200'}>
                          {building.status === 'active' ? 'Đang HĐ' : 'Ngừng HĐ'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 flex items-start gap-1.5 mt-2">
                        <MapPin className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
                        {building.address}
                      </p>
                    </div>
                    <div className="shrink-0 space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setSelectedBuilding(building)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setSelectedBuilding(building)}>
                        <ListTree className="w-4 h-4 mr-1.5" />
                        Chi tiết
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1 uppercase tracking-wide">Tổng phòng</div>
                      <div className="text-2xl font-black text-slate-900">{stats.total}</div>
                    </div>
                    <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100">
                      <div className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wide">Đang thuê</div>
                      <div className="text-2xl font-black text-slate-900">{stats.occupied}</div>
                    </div>
                    <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100">
                      <div className="text-xs font-semibold text-orange-600 mb-1 uppercase tracking-wide">Trống</div>
                      <div className="text-2xl font-black text-slate-900">{stats.empty}</div>
                    </div>
                    <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                      <div className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Đang sửa</div>
                      <div className="text-2xl font-black text-slate-900">{stats.maintenance}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-4 py-3 border-t border-slate-100/60 text-sm">
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <User className="w-4 h-4 text-slate-400" />
                      Quản lý: <span className="text-slate-900 font-bold">{building.manager}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <HardHat className="w-4 h-4 text-slate-400" />
                      Số tầng: <span className="text-slate-900 font-bold">{building.floors}</span>
                    </div>
                  </div>

                  {/* Progress bar for occupancy */}
                  <div className="mt-4 pt-4 border-t border-slate-100/60">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-slate-500">Tỷ lệ lấp đầy</span>
                      <span className="text-xs font-extrabold text-indigo-700">{occupancyRate}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${occupancyRate}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail/Edit Sheet */}
      <Sheet open={!!selectedBuilding} onOpenChange={(open) => !open && setSelectedBuilding(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 bg-slate-50 overflow-y-auto">
          {selectedBuilding && (
            <div className="h-full flex flex-col">
              <div className="p-6 bg-white border-b border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xl text-slate-900">{selectedBuilding.name}</h3>
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                      Đang quản lý bởi {selectedBuilding.manager}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6 flex-1">
                <Card>
                  <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                       <MapPin className="w-4 h-4 text-slate-400" /> Địa chỉ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium text-slate-800">{selectedBuilding.address}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg shrink-0">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Số tầng</span>
                        <span className="text-lg font-black text-slate-900 block leading-tight">{selectedBuilding.floors}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-600 p-2.5 rounded-lg shrink-0">
                        <DoorOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Thiết kế</span>
                        <span className="text-lg font-black text-slate-900 block leading-tight">{selectedBuilding.totalRooms} phòng</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedBuilding.notes && (
                  <Card>
                    <CardHeader className="pb-3 bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                         <FileText className="w-4 h-4 text-slate-400" /> Ghi chú
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedBuilding.notes}</p>
                    </CardContent>
                  </Card>
                )}

                <div className="p-4 bg-blue-50 text-blue-800 rounded-xl border border-blue-100/50 shadow-sm">
                  <h4 className="font-bold flex items-center gap-2 mb-2 text-blue-900">
                    <AlertCircle className="w-4 h-4" /> Hành động nhanh
                  </h4>
                  <p className="text-[11px] font-medium opacity-80 mb-4">Các tính năng dưới đây cho phép quản lý phòng trọ thuộc khu nhà này.</p>
                  <div className="grid gap-2">
                    <Button variant="outline" className="w-full bg-white justify-start border-blue-200">
                      <DoorOpen className="w-4 h-4 mr-2 text-blue-600" /> Xem danh sách phòng
                    </Button>
                    <Button variant="outline" className="w-full bg-white justify-start border-blue-200">
                      <Settings className="w-4 h-4 mr-2 text-blue-600" /> Cài đặt dịch vụ khu nhà
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
                <Button variant="outline" onClick={() => setSelectedBuilding(null)}>Đóng</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">Chỉnh sửa</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
};
