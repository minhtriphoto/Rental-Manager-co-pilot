import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, User, MapPin, Maximize, BedDouble, Images, Box, FileText, AlignLeft, Info } from 'lucide-react';
import { Room } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export const Rooms = () => {
  const { state, setState } = useAppStore();
  const [filterBuilding, setFilterBuilding] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isEditingRoom, setIsEditingRoom] = useState(false);
  const [editedRoomData, setEditedRoomData] = useState<any>(null);

  const [editedRepName, setEditedRepName] = useState('');
  const [editedRepIdCard, setEditedRepIdCard] = useState('');

  const getRepresentative = (roomId: string) => {
    const roomTenants = state.tenants.filter(t => t.roomId === roomId && t.status === 'đang thuê');
    return roomTenants.find(t => t.isRepresentative) || roomTenants[0];
  };

  const startEditRoom = () => {
    setEditedRoomData({ ...selectedRoom });
    if (selectedRoom) {
      const rep = getRepresentative(selectedRoom.id);
      if (rep) {
        setEditedRepName(rep.fullName);
        setEditedRepIdCard(rep.idCard);
      } else {
        setEditedRepName('');
        setEditedRepIdCard('');
      }
    }
    setIsEditingRoom(true);
  };

  const saveRoomEdit = () => {
    if (!selectedRoom) return;
    const updatedRoom = { ...selectedRoom, ...editedRoomData };
    
    // Find representative to update
    const rep = getRepresentative(selectedRoom.id);
    
    setState(prev => {
      let updatedTenants = prev.tenants;
      if (rep) {
        updatedTenants = prev.tenants.map(t => 
          t.id === rep.id ? { 
            ...t, 
            fullName: editedRepName.trim() !== '' ? editedRepName : t.fullName, 
            idCard: editedRepIdCard.trim() !== '' ? editedRepIdCard : t.idCard 
          } : t
        );
      }
      return {
        ...prev,
        rooms: prev.rooms.map(r => r.id === selectedRoom.id ? updatedRoom : r),
        tenants: updatedTenants
      };
    });

    setSelectedRoom(updatedRoom);
    setIsEditingRoom(false);
    alert('Cập nhật thông tin phòng và chủ đại diện thành công!');
  };

  const cancelEditRoom = () => {
    setIsEditingRoom(false);
    setEditedRoomData(null);
  };

  const handleRoomDataChange = (key: string, value: any) => {
    setEditedRoomData({ ...editedRoomData, [key]: value });
  };


  const filteredRooms = state.rooms.filter(room => {
    if (filterBuilding !== 'all' && room.buildingId !== filterBuilding) return false;
    if (search && !room.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getDerivedStatus = (room: Room) => {
    if (room.status === 'đang sửa') return 'đang sửa chữa';
    if (room.status === 'trống') return 'phòng trống';
    if (room.status === 'ngừng cho thuê' || room.status === 'đặt cọc') return room.status;

    // Check for debt
    const roomInvoices = state.invoices.filter(i => i.roomId === room.id);
    const hasDebt = roomInvoices.some(i => i.totalAmount > i.paidAmount && new Date(i.dueDate) <= new Date());
    if (hasDebt) return 'nợ tiền';

    // Check for expiring contract
    const roomContract = state.contracts.find(c => c.roomId === room.id && (c.status === 'còn hiệu lực' || c.status === 'sắp hết hạn'));
    if (roomContract && roomContract.status === 'sắp hết hạn') return 'sắp hết hạn hợp đồng';

    return 'đang thuê';
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'đang thuê': return 'bg-blue-500 text-white border-transparent';
      case 'phòng trống': return 'bg-slate-50 text-slate-500 border-2 border-dashed border-slate-300';
      case 'nợ tiền': return 'bg-red-500 text-white border-transparent';
      case 'sắp hết hạn hợp đồng': return 'bg-yellow-400 text-white border-transparent';
      case 'đang sửa chữa': return 'bg-purple-400 text-white border-transparent';
      case 'đặt cọc': return 'bg-indigo-400 text-white border-transparent';
      case 'ngừng cho thuê': return 'bg-slate-800 text-white border-transparent';
      default: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'đang thuê': return <Badge className="bg-blue-500 hover:bg-blue-600">Đang thuê</Badge>;
      case 'phòng trống': return <Badge className="bg-slate-400 hover:bg-slate-500">Trống</Badge>;
      case 'nợ tiền': return <Badge className="bg-red-500 hover:bg-red-600">Nợ tiền</Badge>;
      case 'sắp hết hạn hợp đồng': return <Badge className="bg-yellow-400 hover:bg-yellow-500">Hết hạn</Badge>;
      case 'đang sửa chữa': return <Badge className="bg-purple-400 hover:bg-purple-500">Đang sửa</Badge>;
      case 'đặt cọc': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Đặt cọc</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sơ đồ phòng</h2>
          <div className="flex gap-4 mt-2 text-sm">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Đang thuê</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>Trống</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>Nợ tiền</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400"></span>Hết hạn HĐ</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>Sửa chữa</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={filterBuilding} onValueChange={setFilterBuilding}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tất cả khu nhà" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khu nhà</SelectItem>
              {state.buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm phòng..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <TabsList>
          <TabsTrigger value="grid">Lưới sơ đồ</TabsTrigger>
          <TabsTrigger value="floorplan">Bản vẽ tầng</TabsTrigger>
          <TabsTrigger value="list">Danh sách</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-6">
          {/* Group by building and floor */}
          {state.buildings.filter(b => filterBuilding === 'all' || b.id === filterBuilding).map(building => {
            const bRooms = filteredRooms.filter(r => r.buildingId === building.id);
            if (bRooms.length === 0) return null;
            
            const floors = Array.from(new Set(bRooms.map(r => r.floor))).sort((a: any, b: any) => a - b);
            
            return (
              <div key={building.id} className="mb-8 space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2">{building.name}</h3>
                
                {floors.map(floor => {
                  const fRooms = bRooms.filter(r => r.floor === floor).sort((a,b) => a.code.localeCompare(b.code));
                  return (
                    <div key={floor} className="flex flex-col md:flex-row gap-4 items-start">
                      <div className="w-20 font-medium text-slate-500 pt-2 text-sm">Tầng {floor}</div>
                      <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                        {fRooms.map(room => {
                          const tenants = state.tenants.filter(t => t.roomId === room.id && t.status === 'đang thuê');
                          const derivedStatus = getDerivedStatus(room);
                          return (
                            <div 
                              key={room.id}
                              onClick={() => setSelectedRoom(room)}
                              className={`aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:opacity-90 relative ${getStatusStyle(derivedStatus)}`}
                            >
                              <div className="font-bold text-sm tracking-tight">{room.name}</div>
                              <div className="text-[10px] opacity-90 mt-1 capitalize">
                                {derivedStatus === 'sắp hết hạn hợp đồng' ? 'Hết hạn' : derivedStatus === 'phòng trống' ? 'Trống' : derivedStatus === 'đang sửa chữa' ? 'Đang sửa' : derivedStatus === 'nợ tiền' ? 'Nợ tiền' : derivedStatus === 'đang thuê' ? 'Thu đủ' : derivedStatus}
                              </div>
                              <div className="absolute top-2 right-2 text-[10px] opacity-80 flex items-center gap-0.5">
                                <User className="w-2.5 h-2.5" />
                                {tenants.length}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </TabsContent>
        <TabsContent value="floorplan" className="mt-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-600" /> Bản vẽ mặt bằng phân lô
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {state.buildings.filter(b => filterBuilding === 'all' || b.id === filterBuilding).map(building => {
                const bRooms = filteredRooms.filter(r => r.buildingId === building.id);
                if (bRooms.length === 0) return null;
                
                const floors = Array.from(new Set(bRooms.map(r => r.floor))).sort((a: any, b: any) => a - b);
                
                return (
                  <div key={building.id} className="mb-10 last:mb-0">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                       {building.name}
                    </h3>
                    
                    <div className="space-y-8">
                      {floors.map(floor => {
                        const fRooms = bRooms.filter(r => r.floor === floor).sort((a,b) => a.code.localeCompare(b.code));
                        // Determine hallway layout based on number of rooms
                        // Simple Mockup: 2 parallel rows of rooms representing a hallway in between
                        const half = Math.ceil(fRooms.length / 2);
                        const row1 = fRooms.slice(0, half);
                        const row2 = fRooms.slice(half);

                        return (
                          <div key={floor} className="bg-slate-50 rounded-xl p-6 border border-slate-200 shadow-sm relative">
                            <div className="absolute top-0 right-8 bg-indigo-600 text-white px-3 py-1 font-bold text-sm tracking-wider rounded-b-md shadow-md">
                              TẦNG {floor}
                            </div>
                            
                            <div className="relative mt-4">
                              {/* Row 1 (Top) */}
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 border-b-8 border-slate-300 pb-6 mb-6 relative">
                                <div className="absolute bottom-0 left-0 w-full h-8 bg-slate-200/50 -mb-8"></div>
                                {row1.map(room => {
                                  const derivedStatus = getDerivedStatus(room);
                                  return (
                                    <div 
                                      key={room.id}
                                      onClick={() => setSelectedRoom(room)}
                                      className={`h-28 rounded shadow-sm border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 relative
                                        ${derivedStatus === 'đang thuê' ? 'bg-blue-50 border-blue-200 pointer-events-auto' : 
                                          derivedStatus === 'phòng trống' ? 'bg-white border-dashed border-slate-300' :
                                          derivedStatus === 'đang sửa chữa' ? 'bg-slate-100 border-purple-200 opacity-60' :
                                          'bg-slate-50 border-slate-200'}
                                      `}
                                    >
                                      <div className="font-black text-slate-700 text-lg">{room.name}</div>
                                      <div className="text-[10px] text-slate-500 font-medium">B.{room.area}m²</div>
                                      <div className="absolute -bottom-3 w-4 h-6 bg-[#8b5a2b] border-2 border-slate-800 rounded-sm"></div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Hallway Label */}
                              <div className="text-center font-bold text-slate-300 tracking-[0.5em] text-xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                HÀNH LANG
                              </div>

                              {/* Row 2 (Bottom) */}
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 border-t-8 border-slate-300 pt-6 mt-6 relative">
                                <div className="absolute top-0 left-0 w-full h-8 bg-slate-200/50 -mt-8"></div>
                                {row2.map(room => {
                                  const derivedStatus = getDerivedStatus(room);
                                  return (
                                    <div 
                                      key={room.id}
                                      onClick={() => setSelectedRoom(room)}
                                      className={`h-28 rounded shadow-sm border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 relative
                                        ${derivedStatus === 'đang thuê' ? 'bg-blue-50 border-blue-200' : 
                                          derivedStatus === 'phòng trống' ? 'bg-white border-dashed border-slate-300' :
                                          derivedStatus === 'đang sửa chữa' ? 'bg-slate-100 border-purple-200 opacity-60' :
                                          'bg-slate-50 border-slate-200'}
                                      `}
                                    >
                                      <div className="absolute -top-3 w-4 h-6 bg-[#8b5a2b] border-2 border-slate-800 rounded-sm"></div>
                                      <div className="font-black text-slate-700 text-lg">{room.name}</div>
                                      <div className="text-[10px] text-slate-500 font-medium">B.{room.area}m²</div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Stairs / Elevator indication */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-6 w-12 h-20 bg-slate-800 rounded-md border-4 border-slate-300 flex items-center justify-center flex-col text-white pb-1 rotate-180" style={{ writingMode: 'vertical-rl' }}>
                                <span className="font-bold text-[10px] tracking-widest uppercase">Thang Máy</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">Mã phòng</th>
                      <th className="px-4 py-3 font-medium">Khu nhà</th>
                      <th className="px-4 py-3 font-medium">Loại</th>
                      <th className="px-4 py-3 font-medium">Giá thuê</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRooms.map(room => {
                      const derivedStatus = getDerivedStatus(room);
                      return (
                      <tr key={room.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{room.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{state.buildings.find(b => b.id === room.buildingId)?.name}</td>
                        <td className="px-4 py-3 truncate max-w-[150px]">{room.type}</td>
                        <td className="px-4 py-3">{room.basePrice.toLocaleString()} ₫</td>
                        <td className="px-4 py-3">{getStatusBadge(derivedStatus)}</td>
                        <td className="px-4 py-3">
                          <button className="text-primary hover:underline" onClick={() => setSelectedRoom(room)}>Chi tiết</button>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Sheet open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
        <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto">
          {selectedRoom && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start justify-between">
                  <div>
                    <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                      {selectedRoom.name}
                      {getStatusBadge(getDerivedStatus(selectedRoom))}
                    </SheetTitle>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4" /> 
                      {state.buildings.find(b => b.id === selectedRoom.buildingId)?.name} - Tầng {selectedRoom.floor}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                {isEditingRoom ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Tên phòng</label>
                      <Input value={editedRoomData.name} onChange={(e) => handleRoomDataChange('name', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Giá thuê mặc định</label>
                        <Input type="number" value={editedRoomData.basePrice} onChange={(e) => handleRoomDataChange('basePrice', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Cọc yêu cầu</label>
                        <Input type="number" value={editedRoomData.depositRequired} onChange={(e) => handleRoomDataChange('depositRequired', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Diện tích (m²)</label>
                        <Input type="number" value={editedRoomData.area} onChange={(e) => handleRoomDataChange('area', Number(e.target.value))} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Số người tối đa</label>
                        <Input type="number" value={editedRoomData.maxOccupants} onChange={(e) => handleRoomDataChange('maxOccupants', Number(e.target.value))} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Nội thất nguyên bản</label>
                      <Input value={editedRoomData.furnitureDescription} onChange={(e) => handleRoomDataChange('furnitureDescription', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Ghi chú</label>
                      <Input value={editedRoomData.notes} onChange={(e) => handleRoomDataChange('notes', e.target.value)} />
                    </div>

                    {getRepresentative(selectedRoom.id) && (
                      <div className="space-y-3 p-4 rounded-xl border border-blue-100 bg-blue-50/50 mt-2">
                        <h4 className="font-bold flex items-center gap-2 text-sm text-blue-900">
                          <User className="w-4 h-4 text-blue-600" />
                          Sửa thông tin Chủ đại diện
                        </h4>
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Họ tên chủ đại diện</label>
                            <Input 
                              value={editedRepName} 
                              onChange={(e) => setEditedRepName(e.target.value)} 
                              placeholder="Nhập họ và tên..."
                              className="bg-white font-semibold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-600">Số CCCD chủ đại diện</label>
                            <Input 
                              value={editedRepIdCard} 
                              onChange={(e) => setEditedRepIdCard(e.target.value)} 
                              placeholder="Nhập số CCCD..."
                              className="bg-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelEditRoom}>Hủy</Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveRoomEdit}>Lưu thay đổi</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {selectedRoom.images && selectedRoom.images.length > 0 && (
                      <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center relative">
                        <img src={selectedRoom.images[0]} alt={selectedRoom.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                          <Images className="w-3 h-3" />
                          {selectedRoom.images.length}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1 font-medium">Giá thuê mặc định</div>
                        <div className="font-bold text-lg text-blue-600">{selectedRoom.basePrice.toLocaleString()} ₫</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1 font-medium">Cọc yêu cầu</div>
                        <div className="font-bold text-lg">{selectedRoom.depositRequired.toLocaleString()} ₫</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Maximize className="w-4 h-4" />
                        <span className="font-medium text-slate-900">{selectedRoom.area} m²</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4" />
                        <span className="font-medium text-slate-900">Tối đa {selectedRoom.maxOccupants} người</span>
                      </div>
                      <div className="col-span-2 flex items-center gap-2 text-slate-600">
                        <BedDouble className="w-4 h-4 shrink-0" />
                        <span className="font-medium text-slate-900 capitalize">{selectedRoom.type}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-sm border-b pb-2">
                        <Box className="w-4 h-4" />
                        Nội thất & Tài sản
                      </h4>
                      <div className="text-sm text-slate-600 leading-relaxed">
                        Nguyên bản: {selectedRoom.furnitureDescription}
                      </div>
                      {selectedRoom.assets && selectedRoom.assets.length > 0 && (
                        <ul className="text-sm text-slate-600 space-y-1 pl-5 list-disc mt-2">
                          {selectedRoom.assets.map((asset, i) => (
                            <li key={i}>{asset}</li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {selectedRoom.notes && (
                      <div className="space-y-3">
                        <h4 className="font-bold flex items-center gap-2 text-sm border-b pb-2">
                          <FileText className="w-4 h-4" />
                          Ghi chú riêng
                        </h4>
                        <p className="text-sm text-slate-600">{selectedRoom.notes}</p>
                      </div>
                    )}

                    {getRepresentative(selectedRoom.id) && (
                      <div className="space-y-3 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <h4 className="font-bold flex items-center gap-2 text-sm text-blue-900">
                          <User className="w-4 h-4 text-blue-600" />
                          Khách thuê đại diện phòng
                        </h4>
                        <div className="grid grid-cols-2 gap-y-2 text-xs text-slate-700">
                          <div>
                            <span className="text-slate-500 font-medium block">Họ và tên:</span>
                            <span className="font-bold text-slate-900 text-sm">{getRepresentative(selectedRoom.id).fullName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 font-medium block">Số CCCD:</span>
                            <span className="font-mono font-semibold text-slate-950 text-sm">{getRepresentative(selectedRoom.id).idCard || 'Chưa cập nhật'}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-slate-500 font-medium block">Số điện thoại:</span>
                            <span className="font-semibold text-slate-900">{getRepresentative(selectedRoom.id).phone || 'Chưa cập nhật'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedRoom(null)}>Đóng</Button>
                      <Button onClick={startEditRoom} className="bg-indigo-600 hover:bg-indigo-700">Chỉnh sửa</Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
