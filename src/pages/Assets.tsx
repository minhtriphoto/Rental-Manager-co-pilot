import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Plus, 
  Trash2, 
  Edit, 
  DoorOpen, 
  Armchair, 
  ClipboardCheck, 
  DollarSign, 
  Calendar, 
  Search, 
  CheckCircle, 
  AlertOctagon,
  Image,
  Info,
  Building2,
  FileText
} from 'lucide-react';
import { RoomAsset, CheckoutChecklist, Room } from '../types';

export const Assets = () => {
  const { state, setState, updateRoomStatus } = useAppStore();

  const [activeTab, setActiveTab] = useState<'inventory' | 'checkouts'>('inventory');
  const [selectedRoomId, setSelectedRoomId] = useState<string>(state.rooms[0]?.id || 'all');
  const [assetSearchQuery, setAssetSearchQuery] = useState('');

  // Asset Dialog state
  const [isAssetSheetOpen, setIsAssetSheetOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<RoomAsset | null>(null);
  
  // Asset Form fields
  const [assetName, setAssetName] = useState('');
  const [assetQty, setAssetQty] = useState<number>(1);
  const [assetStatus, setAssetStatus] = useState('Hoạt động tốt');
  const [assetImage, setAssetImage] = useState('');
  const [assetValue, setAssetValue] = useState<number>(0);
  const [assetHandoverDate, setAssetHandoverDate] = useState(new Date().toISOString().split('T')[0]);
  const [assetNotes, setAssetNotes] = useState('');

  // Checkout Checklist Wizard State
  const [isCheckoutSheetOpen, setIsCheckoutSheetOpen] = useState(false);
  const [checkoutRoomId, setCheckoutRoomId] = useState('');
  const [isAssetsComplete, setIsAssetsComplete] = useState(true);
  const [isDamaged, setIsDamaged] = useState(false);
  const [damageDetails, setDamageDetails] = useState('');
  const [deductDeposit, setDeductDeposit] = useState<number>(0);
  const [compensationCost, setCompensationCost] = useState<number>(0);
  const [liquidationNotes, setLiquidationNotes] = useState('');
  const [newRoomStatus, setNewRoomStatus] = useState<'trống' | 'đang sửa'>('trống');

  // Computed Room list
  const currentRoom = state.rooms.find(r => r.id === selectedRoomId);
  
  // Filter assets
  const filteredAssets = state.roomAssets.filter(asset => {
    if (selectedRoomId !== 'all' && asset.roomId !== selectedRoomId) return false;
    if (assetSearchQuery) {
      if (!asset.name.toLowerCase().includes(assetSearchQuery.toLowerCase())) return false;
    }
    return true;
  });

  // Calculate sum values
  const totalAssetsCount = filteredAssets.reduce((sum, a) => sum + (a.quantity || 0), 0);
  const totalAssetsValue = filteredAssets.reduce((sum, a) => sum + ((a.estimatedValue || 0) * (a.quantity || 1)), 0);

  // Asset Actions
  const handleOpenAddAsset = () => {
    if (selectedRoomId === 'all') {
      alert('Vui lòng chọn một phòng cụ thể để thêm tài sản bàn giao!');
      return;
    }
    setEditingAsset(null);
    setAssetName('');
    setAssetQty(1);
    setAssetStatus('Mới 100%');
    setAssetImage('');
    setAssetValue(2000000);
    setAssetHandoverDate(new Date().toISOString().split('T')[0]);
    setAssetNotes('');
    setIsAssetSheetOpen(true);
  };

  const handleOpenEditAsset = (asset: RoomAsset) => {
    setEditingAsset(asset);
    setAssetName(asset.name);
    setAssetQty(asset.quantity);
    setAssetStatus(asset.initialStatus);
    setAssetImage(asset.image || '');
    setAssetValue(asset.estimatedValue);
    setAssetHandoverDate(asset.handoverDate);
    setAssetNotes(asset.notes);
    setIsAssetSheetOpen(true);
  };

  const handleSaveAsset = () => {
    if (!assetName.trim()) {
      alert('Vui lòng nhập tên tài sản!');
      return;
    }

    if (editingAsset) {
      // Edit mode
      const updatedAssets = state.roomAssets.map(a => {
        if (a.id === editingAsset.id) {
          return {
            ...a,
            name: assetName,
            quantity: assetQty,
            initialStatus: assetStatus,
            image: assetImage,
            estimatedValue: assetValue,
            handoverDate: assetHandoverDate,
            notes: assetNotes
          };
        }
        return a;
      });
      setState(prev => ({ ...prev, roomAssets: updatedAssets }));
      setIsAssetSheetOpen(false);
      alert('Đã cập nhật thông tin tài sản phòng!');
    } else {
      // Create mode
      const newAsset: RoomAsset = {
        id: `asset-${Date.now()}`,
        roomId: selectedRoomId,
        name: assetName,
        quantity: assetQty,
        initialStatus: assetStatus,
        image: assetImage,
        estimatedValue: assetValue,
        handoverDate: assetHandoverDate,
        notes: assetNotes
      };
      setState(prev => ({ ...prev, roomAssets: [...prev.roomAssets, newAsset] }));
      setIsAssetSheetOpen(false);
      alert('Đã thêm sản phẩm bàn giao thành công!');
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    if (window.confirm('Bạn có thực sự muốn xóa tài sản bàn giao này?')) {
      const remainingAssets = state.roomAssets.filter(a => a.id !== assetId);
      setState(prev => ({ ...prev, roomAssets: remainingAssets }));
    }
  };

  // Checkout Checklist Actions
  const handleOpenCheckoutWizard = () => {
    // Collect active rooms (which are "đang thuê" and have tenants / active contracts)
    const activeRooms = state.rooms.filter(r => r.status === 'đang thuê');
    if (activeRooms.length === 0) {
      alert('Hiện không có phòng nào có khách đang thuê để thực hiện thủ tục trả phòng dọn ra.');
      return;
    }
    setCheckoutRoomId(activeRooms[0].id);
    setIsAssetsComplete(true);
    setIsDamaged(false);
    setDamageDetails('');
    setDeductDeposit(0);
    setCompensationCost(0);
    setLiquidationNotes('');
    setNewRoomStatus('trống');
    setIsCheckoutSheetOpen(true);
  };

  const handleSubmitCheckout = () => {
    if (!checkoutRoomId) return;

    // Find room, contract and representative tenant
    const room = state.rooms.find(r => r.id === checkoutRoomId);
    const contract = state.contracts.find(c => c.roomId === checkoutRoomId && c.status === 'còn hiệu lực');
    const representativeTenant = state.tenants.find(t => t.roomId === checkoutRoomId && t.isRepresentative && t.status === 'đang thuê');

    const newChecklist: CheckoutChecklist = {
      id: `checkout-${Date.now()}`,
      roomId: checkoutRoomId,
      contractId: contract?.id || 'no-contract',
      tenantId: representativeTenant?.id || 'no-tenant',
      checkoutDate: new Date().toISOString().split('T')[0],
      isAssetsComplete,
      isDamaged,
      damageDetails: isDamaged ? damageDetails : '',
      deductDepositAmount: deductDeposit,
      compensationCost,
      liquidationNotes,
      status: 'completed'
    };

    // Begin State Updates
    let updatedRooms = state.rooms.map(r => {
      if (r.id === checkoutRoomId) {
        return { ...r, status: newRoomStatus }; // 'trống' hoặc 'đang sửa'
      }
      return r;
    });

    let updatedTenants = state.tenants.map(t => {
      // Find all tenants of this room and move to 'đã rời đi' (ended)
      if (t.roomId === checkoutRoomId && t.status === 'đang thuê') {
        return { ...t, status: 'đã rời đi' as const };
      }
      return t;
    });

    let updatedContracts = state.contracts.map(c => {
      if (c.roomId === checkoutRoomId && c.status === 'còn hiệu lực') {
        return { ...c, status: 'đã thanh lý' as const };
      }
      return c;
    });

    // If compensationCost > 0, we should record a TRANSACTION of INCOME (thụ bồi thường)!
    let updatedTransactions = [...state.transactions];
    if (compensationCost > 0) {
      const compensationTxn = {
        id: `txn-comp-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'thu' as const,
        category: 'phụ thu' as const,
        amount: compensationCost,
        buildingId: room?.buildingId,
        roomId: checkoutRoomId,
        personName: representativeTenant?.fullName || 'Khách thuê',
        notes: `Thu bồi thường hư hại tài sản dọn ra - Phòng ${room?.name || '---'}`,
        paymentMethod: 'chuyển khoản' as const
      };
      updatedTransactions.push(compensationTxn);
    }

    // Save back to store state
    setState(prev => ({
      ...prev,
      rooms: updatedRooms,
      tenants: updatedTenants,
      contracts: updatedContracts,
      checkoutChecklists: [newChecklist, ...prev.checkoutChecklists],
      transactions: updatedTransactions
    }));

    setIsCheckoutSheetOpen(false);
    alert(`Đã hoàn tất thanh lý phòng ${room?.name}! Trạng thái phòng được đặt thành: "[${newRoomStatus.toUpperCase()}]" và hợp đồng đã chuyển sang dạng "[ĐÃ THANH LÝ]".`);
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tài Sản & Thanh Lý Phòng</h2>
          <p className="text-muted-foreground text-sm">
            Quản lý trang thiết bị đồ đạc bàn giao từng phòng và quy trình thanh lý trả phòng của người thuê.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenCheckoutWizard}>
            <ClipboardCheck className="w-4 h-4 mr-2" /> Trả phòng & Thanh lý
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)}>
        <TabsList className="bg-slate-100 p-1 rounded-lg">
          <TabsTrigger value="inventory" className="rounded-md px-4 font-bold text-xs">
            <Armchair className="w-4 h-4 mr-2 text-slate-500" /> DANH SÁCH BÀN GIAO THIẾT BỊ
          </TabsTrigger>
          <TabsTrigger value="checkouts" className="rounded-md px-4 font-bold text-xs">
            <ClipboardCheck className="w-4 h-4 mr-2 text-slate-500" /> LỊCH SỬ CHECKOUT & BỒI THƯỜNG
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Equipment audit list per room */}
        <TabsContent value="inventory" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left selector - Room choices list */}
            <div className="lg:col-span-1 space-y-3">
              <Card className="p-4 bg-white border border-slate-200">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Lựa chọn phòng trọ</h4>
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  <button 
                    onClick={() => setSelectedRoomId('all')}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                      selectedRoomId === 'all' 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      Tất cả phòng (Audit tổng)
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 bg-white text-slate-500">
                      {state.roomAssets.length}
                    </Badge>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  {state.rooms.map(room => {
                    const roomAssetsCount = state.roomAssets.filter(a => a.roomId === room.id).length;
                    const representative = state.tenants.find(t => t.roomId === room.id && t.isRepresentative && t.status === 'đang thuê');
                    return (
                      <button 
                        key={room.id}
                        onClick={() => setSelectedRoomId(room.id)}
                        className={`w-full text-left p-3 rounded-lg flex flex-col gap-1 transition-colors ${
                          selectedRoomId === room.id 
                          ? 'bg-blue-600 text-white' 
                          : 'hover:bg-slate-50 text-slate-600 border border-transparent'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5" />
                            Phòng {room.name}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            selectedRoomId === room.id 
                            ? 'bg-blue-100/20 text-white' 
                            : room.status === 'đang thuê' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {roomAssetsCount} món
                          </span>
                        </div>
                        <span className={`text-[10px] truncate ${selectedRoomId === room.id ? 'text-blue-100' : 'text-slate-400'}`}>
                          {room.status === 'đang thuê' ? `Khách: ${representative?.fullName || 'Đang xác minh'}` : 'Phòng trống'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </Card>
            </div>

            {/* Right details - selected room assets */}
            <div className="lg:col-span-3 space-y-4">
              {/* Stats of specific area selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-slate-50/50 p-4 border border-slate-200">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tổng số lượng đồ dùng</p>
                  <h3 className="text-2xl font-extrabold text-slate-800">{totalAssetsCount} sản phẩm</h3>
                </Card>
                <Card className="bg-slate-50/50 p-4 border border-slate-200">
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Tổng giá trị ước tính thiết bị</p>
                  <h3 className="text-2xl font-extrabold text-blue-600 font-sans tracking-tight">{totalAssetsValue.toLocaleString()} ₫</h3>
                </Card>
              </div>

              {/* Table details list */}
              <Card>
                <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-1">
                      {selectedRoomId === 'all' ? 'Tất Cả Trang Thiết Bị Trong Các Tòa Nhà' : `Bàn Giao Vật Tư - Phòng ${currentRoom?.name}`}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {selectedRoomId === 'all' ? 'Tổng quan tài sản lưu kho và bàn giao phòng' : `Ảnh và tình trạng thiết bị lắp đặt sẵn khi ký bàn giao.`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Tìm tên vật tư..." 
                      className="text-xs w-44" 
                      value={assetSearchQuery}
                      onChange={e => setAssetSearchQuery(e.target.value)}
                    />
                    <Button size="sm" onClick={handleOpenAddAsset} className="bg-emerald-600 hover:bg-emerald-700 text-xs text-white">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm mới
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left min-w-[800px]">
                      <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b">
                        <tr>
                          {selectedRoomId === 'all' && <th className="px-5 py-3.5">Phòng</th>}
                          <th className="px-5 py-3.5">Hồ Sơ / Tên Tài Sản</th>
                          <th className="px-5 py-3.5 text-center">Số Lượng</th>
                          <th className="px-5 py-3.5">Tình Trạng Ban Đầu</th>
                          <th className="px-5 py-3.5">Ngày Bàn Giao</th>
                          <th className="px-5 py-3.5 text-right font-sans">Giá Trị Ước Tính</th>
                          <th className="px-5 py-3.5">Ghi Chú Kỹ Thuật</th>
                          <th className="px-5 py-3.5 text-right">Lựa Chọn</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredAssets.map(asset => {
                          const r = state.rooms.find(rm => rm.id === asset.roomId);
                          return (
                            <tr key={asset.id} className="hover:bg-slate-50/70 transition-colors">
                              {/* Room name display if showing all */}
                              {selectedRoomId === 'all' && (
                                <td className="px-5 py-3.5 font-bold text-slate-700 whitespace-nowrap">
                                  P.{r?.name || '---'}
                                </td>
                              )}

                              {/* Asset Photo and Name */}
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0 border text-slate-400">
                                    {asset.image ? (
                                      <img src={asset.image} alt={asset.name} className="w-10 h-10 object-cover rounded" referrerPolicy="no-referrer" />
                                    ) : (
                                      <Armchair className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-800 leading-tight">{asset.name}</div>
                                    <span className="text-[10px] text-slate-400">Ref: #{asset.id.slice(-5)}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Quantity */}
                              <td className="px-5 py-3.5 text-center font-bold text-slate-800">
                                {asset.quantity || 1}
                              </td>

                              {/* Initial status */}
                              <td className="px-5 py-3.5">
                                <Badge variant="outline" className="text-[10px] border-slate-200">
                                  {asset.initialStatus || 'Bình thường'}
                                </Badge>
                              </td>

                              {/* Handover Date */}
                              <td className="px-5 py-3.5 font-medium text-slate-500 whitespace-nowrap">
                                {asset.handoverDate}
                              </td>

                              {/* Estimated value */}
                              <td className="px-5 py-3.5 text-right font-bold text-slate-700">
                                {asset.estimatedValue ? `${asset.estimatedValue.toLocaleString()} ₫` : '---'}
                              </td>

                              {/* Notes */}
                              <td className="px-5 py-3.5 text-slate-500 max-w-[150px] truncate">
                                {asset.notes || <span className="text-[10px] text-slate-300 italic">Không có</span>}
                              </td>

                              {/* Action buttons */}
                              <td className="px-5 py-3.5 text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-slate-100 text-slate-500" onClick={() => handleOpenEditAsset(asset)}>
                                    <Edit className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="w-7 h-7 hover:bg-red-50 text-red-500" onClick={() => handleDeleteAsset(asset.id)}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredAssets.length === 0 && (
                          <tr>
                            <td colSpan={selectedRoomId === 'all' ? 8 : 7} className="px-5 py-10 text-center text-slate-400 font-medium">
                              Phòng này chưa được thiết lập danh sách thiết bị bàn giao nào. Bấm nút "Thêm mới" để định nghĩa!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Checkout / liquidation checklists logs history */}
        <TabsContent value="checkouts" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">Nhật Ký Thanh Lý Trả Phòng</CardTitle>
                <CardDescription className="text-xs">Lưu trữ các biên bản kiểm tra đồ dùng bồi thường hư hỏng từ trước tới nay.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b">
                    <tr>
                      <th className="px-6 py-4">Sơ đồ Phòng</th>
                      <th className="px-6 py-4">Đại diện dọn ra</th>
                      <th className="px-6 py-4">Ngày trả phòng</th>
                      <th className="px-6 py-4 text-center">Bàn giao thiết bị</th>
                      <th className="px-6 py-4 text-center">Xác nhận hư hỏng</th>
                      <th className="px-6 py-4 text-right">Trừ cọc giữ chỗ (₫)</th>
                      <th className="px-6 py-4 text-right">Hóa đơn bồi thường (₫)</th>
                      <th className="px-6 py-4">Nội dung thanh lý chi tiết</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {state.checkoutChecklists.map(chk => {
                      const room = state.rooms.find(r => r.id === chk.roomId);
                      const representative = state.tenants.find(t => t.id === chk.tenantId);
                      return (
                        <tr key={chk.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Room Name */}
                          <td className="px-6 py-4 font-bold text-slate-800">
                            P.{room?.name || 'Vãng lai'}
                          </td>

                          {/* Representative */}
                          <td className="px-6 py-4 font-medium text-slate-600">
                            {representative?.fullName || 'Khách thuê dã lưu trữ'}
                          </td>

                          {/* Date of checkout */}
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {chk.checkoutDate}
                          </td>

                          {/* Is Assets Complete */}
                          <td className="px-6 py-4 text-center">
                            {chk.isAssetsComplete ? (
                              <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-none font-bold text-[10px]">Đầy đủ</Badge>
                            ) : (
                              <Badge className="bg-red-50 text-red-750 hover:bg-red-55 border-none font-bold text-[10px]">Thiếu đồ dùng</Badge>
                            )}
                          </td>

                          {/* Is Damaged */}
                          <td className="px-6 py-4 text-center">
                            {chk.isDamaged ? (
                              <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 border-none font-bold text-[10px]">Có hỏng hóc</Badge>
                            ) : (
                              <Badge className="bg-slate-50 text-slate-500 hover:bg-slate-50 border-none text-[10px]">Không hỏng</Badge>
                            )}
                          </td>

                          {/* Deduct Deposit */}
                          <td className="px-6 py-4 text-right font-medium text-amber-600">
                            {chk.deductDepositAmount.toLocaleString()} ₫
                          </td>

                          {/* Compensation Cost */}
                          <td className="px-6 py-4 text-right font-bold text-red-600">
                            {chk.compensationCost.toLocaleString()} ₫
                          </td>

                          {/* Detailed remarks notes */}
                          <td className="px-6 py-4 text-slate-500 max-w-[200px]">
                            <div className="flex flex-col gap-1">
                              {chk.isDamaged && chk.damageDetails && (
                                <span className="text-[10px] text-red-500 font-semibold italic">Hư hỏng: {chk.damageDetails}</span>
                              )}
                              <span className="truncate">{chk.liquidationNotes || <span className="text-slate-350 italic">Không có bàn luận thêm</span>}</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 text-center">
                            <Badge className="bg-emerald-600 text-white font-bold text-[10px]">Đã thanh lý</Badge>
                          </td>
                        </tr>
                      )
                    })}
                    {state.checkoutChecklists.length === 0 && (
                      <tr>
                        <td colSpan={9} className="px-6 py-10 text-center text-slate-400 font-medium">
                          Chưa có biên bản thanh lý và dọn trả phòng nào được tạo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Asset sheet drawer (Add / Edit equipment assets) */}
      <Sheet open={isAssetSheetOpen} onOpenChange={setIsAssetSheetOpen}>
        <SheetContent className="sm:max-w-[420px] w-full overflow-y-auto">
          <div className="space-y-6 pt-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 border-b pb-3">
                <Armchair className="w-5 h-5 text-blue-600" />
                {editingAsset ? 'Chỉnh Sửa Thiết Bị Bàn Giao' : 'Thêm Thiết Bị Bàn Giao Mới'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              {/* Tên tài sản */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tên trang thiết bị tài sản:</label>
                <Input 
                  placeholder="Ví dụ: Tủ quần áo gỗ sồi, Khóa cửa thông minh..." 
                  value={assetName}
                  onChange={e => setAssetName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Số lượng */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Số lượng:</label>
                  <Input 
                    type="number" 
                    value={assetQty || ''}
                    onChange={e => setAssetQty(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                {/* Ước tính giá trị */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Giá trị ước lượng (₫):</label>
                  <Input 
                    type="number" 
                    value={assetValue || ''}
                    onChange={e => setAssetValue(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Tình trạng ban đầu */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Tình trạng khi bàn giao:</label>
                <Input 
                  placeholder="Mới 100%, có vài vết xước sơn nhẹ, hoạt động êm..." 
                  value={assetStatus}
                  onChange={e => setAssetStatus(e.target.value)}
                />
              </div>

              {/* Ngày bàn giao */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Ngày lắp đặt/bàn giao tài sản:</label>
                <Input 
                  type="date"
                  value={assetHandoverDate}
                  onChange={e => setAssetHandoverDate(e.target.value)}
                />
              </div>

              {/* Link ảnh tài sản mock */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Link ảnh mẫu tài sản (Tùy chọn):</label>
                <Input 
                  placeholder="https://images.unsplash.com/... hoặc bỏ trống"
                  value={assetImage}
                  onChange={e => setAssetImage(e.target.value)}
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Ghi chú bổ sung:</label>
                <textarea 
                  placeholder="VD: Thuộc diện bảo hành chính hãng Daikin 24 tháng..." 
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-blue-400 h-20"
                  value={assetNotes}
                  onChange={e => setAssetNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setIsAssetSheetOpen(false)}>Hủy bỏ</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={handleSaveAsset}>
                  {editingAsset ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Checkout checklist sheet (Trả phòng can check out representative guest & adjust deposit state) */}
      <Sheet open={isCheckoutSheetOpen} onOpenChange={setIsCheckoutSheetOpen}>
        <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto">
          <div className="space-y-6 pt-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold flex items-center gap-2 text-rose-600 border-b pb-3">
                <ClipboardCheck className="w-5 h-5 text-red-500" />
                Biên Bản Kiểm Kê Trả Phòng
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              {/* Select room to check out */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Chọn phòng khách thuê thanh lý:</label>
                <Select value={checkoutRoomId} onValueChange={setCheckoutRoomId}>
                  <SelectTrigger className="text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.rooms.filter(r => r.status === 'đang thuê').map(r => {
                      const rep = state.tenants.find(t => t.roomId === r.id && t.isRepresentative && t.status === 'đang thuê');
                      return (
                        <SelectItem key={r.id} value={r.id}>
                          Phòng {r.name} - Khách: {rep?.fullName || 'Không tên'}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Show list of assets in this room and force inspect checkbox */}
              <div className="p-3 bg-slate-50 border rounded-lg space-y-2">
                <h5 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Trang thiết bị cần nhận bàn giao lại:</h5>
                <div className="space-y-1 pb-1 max-h-40 overflow-y-auto">
                  {state.roomAssets.filter(a => a.roomId === checkoutRoomId).map(asset => (
                    <div key={asset.id} className="flex justify-between text-xs py-1 border-b last:border-0">
                      <span>• {asset.name} (SL: <strong>{asset.quantity || 1}</strong>)</span>
                      <span className="text-[10px] text-slate-400 italic">Bàn giao ngày {asset.handoverDate}</span>
                    </div>
                  ))}
                  {state.roomAssets.filter(a => a.roomId === checkoutRoomId).length === 0 && (
                    <p className="text-[11.5px] text-slate-400 italic">Không có thiết bị bàn giao sẵn trong dữ liệu của phòng này.</p>
                  )}
                </div>
              </div>

              {/* Checklist inputs: isAssetsComplete */}
              <div className="flex items-center justify-between p-2.5 bg-yellow-50/20 border border-yellow-100 rounded-lg">
                <div>
                  <h6 className="text-xs font-bold text-slate-700">Tài sản bàn giao còn nguyên vẹn, đầy đủ:</h6>
                  <p className="text-[10px] text-slate-400">Tất cả trang bị của phòng đều đầy đủ số lượng kĩ thuật</p>
                </div>
                <button 
                  type="button"
                  className={`w-14 h-7 rounded-full transition-colors flex items-center p-0.5 ${isAssetsComplete ? 'bg-emerald-500 justify-end' : 'bg-slate-300 justify-start'}`}
                  onClick={() => setIsAssetsComplete(!isAssetsComplete)}
                >
                  <span className="w-6 h-6 bg-white rounded-full shadow-sm"></span>
                </button>
              </div>

              {/* Checklist inputs: isDamaged */}
              <div className="flex items-center justify-between p-2.5 bg-rose-50/20 border border-rose-100 rounded-lg">
                <div>
                  <h6 className="text-xs font-bold text-slate-700">Có hỏng hóc hoặc mất mát tài sản:</h6>
                  <p className="text-[10px] text-slate-400">Cần thiết lập danh lý bồi hoàn tiền đền bù</p>
                </div>
                <button 
                  type="button"
                  className={`w-14 h-7 rounded-full transition-colors flex items-center p-0.5 ${isDamaged ? 'bg-red-500 justify-end' : 'bg-slate-300 justify-start'}`}
                  onClick={() => setIsDamaged(!isDamaged)}
                >
                  <span className="w-6 h-6 bg-white rounded-full shadow-sm"></span>
                </button>
              </div>

              {/* Damage details box if true */}
              {isDamaged && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-red-600">Chi tiết tài sản hư hại / hao hụt vật tư:</label>
                  <Input 
                    placeholder="Ví dụ: Vỡ điều khiển điều hòa, rách rèm cửa..." 
                    value={damageDetails}
                    onChange={e => setDamageDetails(e.target.value)}
                  />
                </div>
              )}

              {/* Financial checkout metrics */}
              <div className="grid grid-cols-2 gap-4">
                {/* Deduct Deposit */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Trừ tiền cọc của khách (₫):</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={deductDeposit || ''}
                    onChange={e => setDeductDeposit(Number(e.target.value))}
                  />
                  <p className="text-[9.5px] text-slate-400">Trừ trực tiếp từ khoản cọc hoàn trả</p>
                </div>

                {/* Compensation costing */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Phí bắt đền bù bổ sung (₫):</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={compensationCost || ''}
                    onChange={e => setCompensationCost(Number(e.target.value))}
                  />
                  <p className="text-[9.5px] text-slate-400">Tính phát sinh hoặc sòng phẳng</p>
                </div>
              </div>

              {/* Room conversion target */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Trạng thái phòng sau khi trả:</label>
                <Select value={newRoomStatus} onValueChange={(v: any) => setNewRoomStatus(v)}>
                  <SelectTrigger className="text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trống">Đặt thành trạng thái: [Trống] (Sẵn sàng thuê mới)</SelectItem>
                    <SelectItem value="đang sửa">Đặt thành trạng thái: [Đang sửa] (Cần vệ sinh, bảo trì lại)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* General Liquidation notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Ghi chú thanh lý tổng thể:</label>
                <textarea 
                  placeholder="Ví dụ: Khách đã bàn giao lại đầy đủ chìa khóa phòng, thanh toán hết chỉ số điện nước cuối cùng..." 
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-red-400 h-20"
                  value={liquidationNotes}
                  onChange={e => setLiquidationNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setIsCheckoutSheetOpen(false)}>Hủy bỏ</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 font-bold" onClick={handleSubmitCheckout}>
                  Xác nhận thanh lý phòng
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
