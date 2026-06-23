import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Wrench, 
  Search, 
  Plus, 
  Flame, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign, 
  User, 
  Image as ImageIcon, 
  Paperclip, 
  FileText, 
  AlertTriangle, 
  DoorOpen, 
  UserCheck, 
  HelpCircle,
  TrendingDown
} from 'lucide-react';
import { MaintenanceRequest, MaintenancePriority, MaintenanceStatus } from '../types';

const presetAttachments = [
  { name: 'Ống nước rỉ sét', url: 'https://images.unsplash.com/photo-1585842371054-2a21e05d04cc?auto=format&fit=crop&w=400&q=80' },
  { name: 'Bóng Đèn hỏng', url: 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&w=400&q=80' },
  { name: 'Điều hòa hỏng bẩn', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Khóa cửa han gỉ kẹt', url: 'https://images.unsplash.com/photo-1507208773393-400907544907?auto=format&fit=crop&w=400&q=80' },
  { name: 'Nội thất gãy mòn', url: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&q=80' },
];

export const Maintenance = () => {
  const { state, setState } = useAppStore();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Sheet States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);

  // Form Fields
  const [roomId, setRoomId] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [type, setType] = useState<string>('điện');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('trung bình');
  const [status, setStatus] = useState<MaintenanceStatus>('mới tạo');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [handlerName, setHandlerName] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [attachment, setAttachment] = useState('');

  // Auto detect reporter of the selected room
  const handleRoomChange = (id: string) => {
    setRoomId(id);
    const tenant = state.tenants.find(t => t.roomId === id && t.isRepresentative && t.status === 'đang thuê');
    if (tenant) {
      setReporterName(tenant.fullName);
    } else {
      setReporterName('');
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'khẩn cấp':
        return (
          <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold flex items-center gap-1 w-fit">
            <Flame className="w-3 h-3 text-red-600 animate-pulse" /> KHẨN CẤP
          </Badge>
        );
      case 'cao':
        return <Badge className="bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200 font-bold">CAO</Badge>;
      case 'trung bình':
        return <Badge className="bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 font-bold">TRUNG BÌNH</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-200 border-none font-bold">THẤP</Badge>;
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'mới tạo':
        return (
          <Badge variant="outline" className="text-amber-500 border-amber-300 bg-amber-50/50 font-bold flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Mới Tạo
          </Badge>
        );
      case 'đang xử lý':
        return (
          <Badge className="bg-indigo-600 text-white font-bold flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3 text-indigo-200" /> Đang Xử Lý
          </Badge>
        );
      case 'hoàn thành':
        return (
          <Badge className="bg-emerald-100 text-emerald-850 border border-emerald-300 font-bold flex items-center gap-1 w-fit">
            <CheckCircle className="w-3 h-3 text-emerald-600" /> Hoàn Thành
          </Badge>
        );
      case 'hủy':
        return (
          <Badge className="bg-rose-50 text-rose-500 border border-rose-200 font-bold flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3 text-rose-500" /> Đã Hủy
          </Badge>
        );
      default:
        return <Badge variant="secondary">{s}</Badge>;
    }
  };

  // Open creation form
  const handleOpenAdd = () => {
    setEditingRequest(null);
    setRoomId(state.rooms[0]?.id || '');
    const firstRep = state.tenants.find(t => t.roomId === state.rooms[0]?.id && t.isRepresentative && t.status === 'đang thuê');
    setReporterName(firstRep?.fullName || 'Khách hàng');
    setType('điện');
    setDescription('');
    setPriority('trung bình');
    setStatus('mới tạo');
    setReportDate(new Date().toISOString().split('T')[0]);
    setHandlerName('');
    setCost(0);
    setNotes('');
    setAttachment('');
    setIsFormOpen(true);
  };

  // Open editing form
  const handleOpenEdit = (m: MaintenanceRequest) => {
    setEditingRequest(m);
    setRoomId(m.roomId);
    setReporterName(m.reporterName);
    setType(m.type);
    setDescription(m.description);
    setPriority(m.priority);
    setStatus(m.status);
    setReportDate(m.reportDate);
    setHandlerName(m.handlerName || '');
    setCost(m.cost);
    setNotes(m.notes || '');
    setAttachment(m.attachment || '');
    setIsFormOpen(true);
  };

  // Save changes
  const handleSave = () => {
    if (!description.trim()) {
      alert('Vui lòng cung cấp chi tiết mô tả sự cố.');
      return;
    }

    if (editingRequest) {
      // Is compiled transition to "hoàn thành" with cost checked?
      const wasCompleted = editingRequest.status === 'hoàn thành';
      const isNowCompleted = status === 'hoàn thành';

      const updatedList = state.maintenances.map(m => {
        if (m.id === editingRequest.id) {
          return {
            ...m,
            roomId,
            reporterName,
            type,
            description,
            priority,
            status,
            reportDate,
            handlerName,
            cost,
            notes,
            attachment
          };
        }
        return m;
      });

      let updatedTransactions = [...state.transactions];
      
      // Auto logging of Expense in ledger
      if (!wasCompleted && isNowCompleted && cost > 0) {
        const autoLog = window.confirm(
          `Bạn đánh dấu hoàn thành sự cố với chi phí phát sinh là ${cost.toLocaleString()} ₫. Bạn có muốn tự động ghi nhận khoản CHI SỬA CHỮA này vào Sổ Thu Chi của hệ thống không?`
        );
        if (autoLog) {
          const room = state.rooms.find(r => r.id === roomId);
          const expenseTxn = {
            id: `txn-maint-${Date.now()}`,
            date: new Date().toISOString().split('T')[0],
            type: 'chi' as const,
            category: 'sửa chữa' as const,
            amount: cost,
            buildingId: room?.buildingId,
            roomId: roomId,
            personName: handlerName || reporterName || 'Nhà thầu sửa chữa',
            notes: `Thanh toán chi phí sửa chữa sự cố #${editingRequest.id.toUpperCase()}: ${description.slice(0, 50)}...`,
            paymentMethod: 'chuyển khoản' as const
          };
          updatedTransactions.push(expenseTxn);
        }
      }

      setState(prev => ({ 
        ...prev, 
        maintenances: updatedList,
        transactions: updatedTransactions
      }));
    } else {
      // Create request
      const newM: MaintenanceRequest = {
        id: `yc-${Date.now()}`,
        roomId,
        reporterName,
        type,
        description,
        priority,
        status,
        reportDate,
        handlerName,
        cost,
        notes,
        attachment
      };

      setState(prev => ({
        ...prev,
        maintenances: [newM, ...prev.maintenances]
      }));
    }

    setIsFormOpen(false);
    alert('Đã cập nhật hệ thống yêu cầu bảo trì thành công!');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn chắc chắn muốn xóa phiếu bảo trì này khỏi danh sách?')) {
      const remaining = state.maintenances.filter(m => m.id !== id);
      setState(prev => ({ ...prev, maintenances: remaining }));
    }
  };

  // Filter conditions
  const filteredMaintenances = state.maintenances.filter(m => {
    const room = state.rooms.find(r => r.id === m.roomId);
    
    // Status filter
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;

    // Type filter
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && m.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = m.id.toLowerCase().includes(q);
      const matchRoom = room?.name.toLowerCase().includes(q);
      const matchReporter = m.reporterName.toLowerCase().includes(q);
      const matchDesc = m.description.toLowerCase().includes(q);
      const matchHandler = m.handlerName?.toLowerCase().includes(q);
      if (!matchId && !matchRoom && !matchReporter && !matchDesc && !matchHandler) return false;
    }

    return true;
  });

  // KPIs
  const unresolvedRequests = state.maintenances.filter(m => m.status === 'mới tạo' || m.status === 'đang xử lý');
  const criticalCount = unresolvedRequests.filter(m => m.priority === 'khẩn cấp').length;
  const inWorkflowCount = unresolvedRequests.filter(m => m.status === 'đang xử lý').length;

  return (
    <div className="space-y-6">
      {/* Page Title & Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Sự cố & Bảo trì phòng</h2>
          <p className="text-muted-foreground text-sm">
            Tiếp nhận báo lỗi kỹ thuật từ các phòng trọ, nâng cao trải nghiệm sống của người thuê.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleOpenAdd}>
          <Plus className="w-4 h-4 mr-2" /> Thêm sự cố mới
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Báo lỗi khẩn cấp</p>
              <h4 className="text-2xl font-black text-rose-600 tracking-tight">
                {criticalCount} sự cố
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Chưa tiếp nhận sửa</p>
              <h4 className="text-2xl font-black text-amber-600 tracking-tight">
                {unresolvedRequests.filter(m => m.status === 'mới tạo').length} sự cố
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <Wrench className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Đang khắc phục</p>
              <h4 className="text-2xl font-semibold text-indigo-750 tracking-tight">
                {inWorkflowCount} yêu cầu
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-medium">Hoàn thành tháng này</p>
              <h4 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {state.maintenances.filter(m => m.status === 'hoàn thành').length} phiếu
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical System Alert */}
      {criticalCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-650 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Cảnh báo vận hành khu nhà!</p>
            <p className="text-xs text-red-700 leading-normal">
              Có <strong>{criticalCount} yêu cầu bảo trì mức độ KHẨN CẤP</strong> chưa được khắc phục xong. Hãy ưu tiên phân công nhân sự sửa chữa để giảm thiểu tổn thất hạ tầng.
            </p>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search query box */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm mã YC, phòng, người xử lý..." 
                className="pl-8 text-sm w-full" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Trạng thái xử lý" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="mới tạo">Mới tạo (Yêu cầu mới)</SelectItem>
                <SelectItem value="đang xử lý">Đang sửa chữa</SelectItem>
                <SelectItem value="hoàn thành">Đã hoàn thành</SelectItem>
                <SelectItem value="hủy">Đã hủy bỏ</SelectItem>
              </SelectContent>
            </Select>

            {/* Incident Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Nhóm sự cố" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả nhóm lỗi</SelectItem>
                <SelectItem value="điện">Sự cố Điện</SelectItem>
                <SelectItem value="nước">Sự cố Nước</SelectItem>
                <SelectItem value="điều hòa">Sự cố Điều hòa</SelectItem>
                <SelectItem value="khóa cửa">Khóa cửa & Thẻ từ</SelectItem>
                <SelectItem value="vệ sinh">Môi trường & Vệ sinh</SelectItem>
                <SelectItem value="nội thất">Nội thất phòng trọ</SelectItem>
                <SelectItem value="khác">Sự cố khác</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority filter level */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Mức ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="thấp">Thấp</SelectItem>
                <SelectItem value="trung bình">Trung bình</SelectItem>
                <SelectItem value="cao">Cao</SelectItem>
                <SelectItem value="khẩn cấp">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        {/* List of Requests */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Mã YC / Ngày Báo</th>
                  <th className="px-6 py-4">Phòng & Người Báo</th>
                  <th className="px-6 py-4">Sự cố / Mô tả</th>
                  <th className="px-6 py-4">Mức độ</th>
                  <th className="px-6 py-4">Xử lý bởi</th>
                  <th className="px-6 py-4 text-right">Chi phí sửa (₫)</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMaintenances.map(m => {
                  const room = state.rooms.find(r => r.id === m.roomId);
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ID / Code of the request */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-600">#{m.id.split('-').pop()?.toUpperCase()}</span>
                          <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {m.reportDate}
                          </span>
                        </div>
                      </td>

                      {/* Room & Reporter details */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 flex items-center gap-1">
                            <DoorOpen className="w-3.5 h-3.5 text-blue-500" />
                            Phòng {room?.name || '---'}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            Gửi bởi: {m.reporterName}
                          </span>
                        </div>
                      </td>

                      {/* Description and category with photo preview */}
                      <td className="px-6 py-4 max-w-[280px]">
                        <div className="space-y-1.5">
                          <span className="text-xs font-bold text-slate-800 uppercase px-1.5 py-0.5 bg-slate-100 rounded">
                            {m.type}
                          </span>
                          <p className="text-xs text-slate-600 line-clamp-2 mt-1">{m.description}</p>
                          
                          {/* Attachment link indicator & thumbnail preview */}
                          {m.attachment && (
                            <div className="flex items-center gap-2 mt-2 p-1 bg-slate-50 rounded border border-slate-200/60 w-fit">
                              <img src={m.attachment} alt="Sự cố" className="w-8 h-8 object-cover rounded" referrerPolicy="no-referrer" />
                              <span className="text-[9px] text-slate-400 italic">Có ảnh minh chứng</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Level Priority */}
                      <td className="px-6 py-4">
                        {getPriorityBadge(m.priority)}
                      </td>

                      {/* Handler specialist */}
                      <td className="px-6 py-4">
                        {m.handlerName ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium text-slate-700 flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              {m.handlerName}
                            </span>
                            {m.notes && <span className="text-[10px] text-slate-400 italic line-clamp-1">"{m.notes}"</span>}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Chưa phân công</span>
                        )}
                      </td>

                      {/* Repair Cost */}
                      <td className="px-6 py-4 text-right font-bold text-slate-750">
                        {m.cost > 0 ? (
                          <span className="text-red-600 font-bold">{m.cost.toLocaleString()} ₫</span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        {getStatusBadge(m.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleOpenEdit(m)}>
                            Cập nhật
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(m.id)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMaintenances.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Không tìm thấy phiếu yêu cầu bảo trì nào khớp điều kiện lọc.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Editor & Creation Sheet Drawer */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[480px] w-full overflow-y-auto">
          <div className="space-y-6 pt-4">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold flex items-center gap-2 text-indigo-700 border-b pb-3">
                <Wrench className="w-5 h-5" />
                {editingRequest ? 'Cập Nhật / Xử Lý Sự Cố' : 'Tiếp Nhận Sự Cố Bảo Trì Mới'}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-4">
              {/* Room select */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Chọn phòng trọ xảy ra sự cố:</label>
                <Select value={roomId} onValueChange={handleRoomChange}>
                  <SelectTrigger className="text-sm font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {state.rooms.map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} - {state.buildings.find(b => b.id === r.buildingId)?.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reporter Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Họ tên người khai báo sự cố:</label>
                <Input 
                  placeholder="Họ tên người thuê phòng hoặc Nhân viên quản lý"
                  value={reporterName}
                  onChange={e => setReporterName(e.target.value)}
                />
              </div>

              {/* Type Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Nhóm loại sự cố trọ:</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="điện">Sự cố Điện (Cháy đèn, hỏng ổ cắm, nhảy aptomat...)</SelectItem>
                    <SelectItem value="nước">Sự cố Nước (Rò đường ống, bục vòi sen, kẹt phao...)</SelectItem>
                    <SelectItem value="điều hòa">Sự cố Điều hòa (Không mát, chảy nước trong phòng...)</SelectItem>
                    <SelectItem value="khóa cửa">Khóa cửa & Thẻ từ (Quên mật khẩu, hỏng chốt...)</SelectItem>
                    <SelectItem value="vệ sinh">Môi trường & Vệ sinh (Tắc cống, mùi hôi, rác thải...)</SelectItem>
                    <SelectItem value="nội thất">Nội thất phòng trọ (Hỏng bản lề tủ, gãy nan giường...)</SelectItem>
                    <SelectItem value="khác">Các sự cố phát sinh khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Mô tả chi tiết lỗi hỏng:</label>
                <textarea 
                  placeholder="Vui lòng cung cấp chính xác lỗi là gì, có kèm triệu chứng để thợ kỹ thuật chuẩn bị trước đồ đạc sửa thích hợp..." 
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-indigo-400 h-24"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Độ ưu tiên xử lý:</label>
                  <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                    <SelectTrigger className="text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thấp">Thấp (Xử lý thảnh thơi dẹp dã)</SelectItem>
                      <SelectItem value="trung bình">Trung bình (Khắc phục trong 1-2 ngày)</SelectItem>
                      <SelectItem value="cao">Cao (Yêu cầu làm ngay trong buổi)</SelectItem>
                      <SelectItem value="khẩn cấp">Khẩn cấp (Hỏa hoạn, ngập nước dột nặng...)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* status */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Trạng thái phiếu:</label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger className="text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mới tạo">Mới tạo (Yêu cầu mới)</SelectItem>
                      <SelectItem value="đang xử lý">Đang khắc phục sửa chữa</SelectItem>
                      <SelectItem value="hoàn thành">Đã bảo trì hoàn tất</SelectItem>
                      <SelectItem value="hủy">Hủy yêu cầu lý do thừa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Image attachment / link with presets */}
              <div className="space-y-2.5 p-3.5 bg-slate-50 border rounded-lg">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5" /> Ảnh đính kèm sự cố
                </label>
                
                <div className="space-y-1">
                  <Input 
                    placeholder="Dán link ảnh chụp sự cố (https://...)" 
                    className="text-xs bg-white"
                    value={attachment}
                    onChange={e => setAttachment(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] text-slate-400 font-bold">Hoặc nhanh tay gắn nhanh các preset ảnh chụp lỗi:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {presetAttachments.map((pa, idx) => (
                      <button 
                        key={idx}
                        type="button" 
                        onClick={() => setAttachment(pa.url)}
                        className={`text-[9px] px-2 py-1 rounded bg-white hover:bg-slate-100 border transition-colors font-medium text-slate-600 ${attachment === pa.url ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-slate-200'}`}
                      >
                        {pa.name}
                      </button>
                    ))}
                  </div>
                </div>

                {attachment && (
                  <div className="relative w-fit border rounded p-1 bg-white mt-1">
                    <img src={attachment} alt="Xem trước bản chụp" className="w-20 h-20 object-cover rounded" referrerPolicy="no-referrer" />
                    <button 
                      type="button" 
                      onClick={() => setAttachment('')} 
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px] hover:bg-red-650"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t pt-3"></div>

              {/* Progress Update Fields (Handler and Costs) */}
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin thi công & Chi phí</h5>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Handler Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Tên thợ sửa phụ trách:
                  </label>
                  <Input 
                    placeholder="VD: Chú Bốn thợ điện nước" 
                    value={handlerName}
                    onChange={e => setHandlerName(e.target.value)}
                  />
                </div>

                {/* Repair Cost */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Chi phí nghiệm thu (₫):
                  </label>
                  <Input 
                    type="number"
                    placeholder="0"
                    value={cost || ''}
                    onChange={e => setCost(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Ghi chú vận hành khác:</label>
                <textarea 
                  placeholder="Ghi lại tiến trình hoặc báo giá linh kiện mua hộ..." 
                  className="w-full text-xs p-2 border rounded focus:outline-indigo-400 h-16"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 flex gap-3 border-t">
                <Button variant="outline" className="flex-1" onClick={() => setIsFormOpen(false)}>Hủy bỏ</Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold" onClick={handleSave}>
                  Lập hồ sơ sửa chữa
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
