import React, { useState, useEffect } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Bell, 
  AlertTriangle, 
  MessageSquare, 
  Clipboard, 
  Calendar, 
  DollarSign, 
  Lightbulb, 
  Check, 
  Copy, 
  Plus, 
  X, 
  DoorOpen, 
  User, 
  Clock, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  Wrench, 
  Info,
  Layers,
  ArrowRight,
  PackageCheck,
  Send,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CustomReminder {
  id: string;
  title: string;
  category: 'thu_tien' | 'hop_dong' | 'dien_nuoc' | 'bao_tri' | 'tai_san' | 'khac';
  dueDate: string;
  notes: string;
  completed: boolean;
}

export const Reminders = () => {
  const { state, setState } = useAppStore();
  const navigate = useNavigate();

  // Selected invoice for SMS generator
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [smsTemplate, setSmsTemplate] = useState(
    'Chào anh/chị [Tên khách], tiền phòng tháng [Tháng] của phòng [Mã phòng] là [Tổng tiền]. Anh/chị vui lòng thanh toán trước ngày [Ngày đến hạn]. Cảm ơn anh/chị.'
  );
  const [generatedSms, setGeneratedSms] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Custom Checklist Reminder State
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>(() => {
    const saved = localStorage.getItem('custom_operational_reminders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default presets
    return [
      {
        id: 'rem-1',
        title: 'Bảo trì máy bơm nước khu trung tâm',
        category: 'bao_tri',
        dueDate: '2026-06-20',
        notes: 'Kiểm tra tiếng ồn hơi re re, bơm hơi yếu định kỳ nửa năm.',
        completed: false
      },
      {
        id: 'rem-2',
        title: 'Kiểm tra tài sản định kỳ sau dọn đi phòng 104',
        category: 'tai_san',
        dueDate: '2026-06-18',
        notes: 'Dành riêng cho khách chuẩn bị thanh lý hợp đồng.',
        completed: false
      },
      {
        id: 'rem-3',
        title: 'Bảo dưỡng định kỳ cục nóng điều hòa tầng 3',
        category: 'bao_tri',
        dueDate: '2026-06-25',
        notes: 'Kêu gọi anh Tùng thợ điều hòa qua xịt rửa lưới lọc định kỳ.',
        completed: false
      },
      {
        id: 'rem-4',
        title: 'Nạp gas / vệ sinh thiết bị phòng cháy chữa cháy',
        category: 'khac',
        dueDate: '2026-06-30',
        notes: 'Liên hệ công ty PCCC quận kiểm định bình cứu hỏa hành lang.',
        completed: true
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('custom_operational_reminders', JSON.stringify(customReminders));
  }, [customReminders]);

  // Form states for new manual reminder
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<any>('khac');
  const [newDueDate, setNewDueDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');

  // 1. Rent Collection Reminder (Nhắc thu tiền nhà gần kề)
  // Get active contracts and their collection Day of month
  const today = new Date();
  const currentDayNum = today.getDate();
  const rentCollectionReminders = state.contracts
    .filter(c => c.status === 'còn hiệu lực' || c.status === 'sắp hết hạn')
    .map(c => {
      const room = state.rooms.find(r => r.id === c.roomId);
      const repTenant = state.tenants.find(t => t.id === c.representativeId);
      const diffDays = c.collectionDay - currentDayNum;
      
      let statusText = '';
      let statusColor = 'text-slate-500 bg-slate-50';
      if (diffDays === 0) {
        statusText = 'Hôm nay đến hạn đóng tiền';
        statusColor = 'text-red-600 bg-red-50 border-red-200';
      } else if (diffDays > 0 && diffDays <= 5) {
        statusText = `Sắp đến hạn đóng tiền (${diffDays} ngày nữa)`;
        statusColor = 'text-amber-600 bg-amber-50 border-amber-200';
      } else if (diffDays < 0) {
        statusText = `Đã trôi qua ngày đóng tiền (${Math.abs(diffDays)} ngày trước)`;
        statusColor = 'text-slate-400 bg-slate-50';
      } else {
        statusText = `Thu tiền vào ngày ${c.collectionDay} hàng tháng`;
        statusColor = 'text-slate-500 bg-slate-100';
      }

      return {
        id: c.id,
        room,
        tenant: repTenant,
        contract: c,
        statusText,
        statusColor,
        collectionDay: c.collectionDay
      };
    })
    .sort((a, b) => a.collectionDay - b.collectionDay);

  // 2. Expiring Contracts Reminder (Nhắc hợp đồng sắp hết hạn)
  const expiringContractReminders = state.contracts
    .filter(c => {
      if (c.status === 'sắp hết hạn') return true;
      // Also calculate from dates logic
      const endDate = new Date(c.endDate);
      const timeDiff = endDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return daysDiff > 0 && daysDiff <= 30; // within 30 days
    })
    .map(c => {
      const room = state.rooms.find(r => r.id === c.roomId);
      const repTenant = state.tenants.find(t => t.id === c.representativeId);
      const endDate = new Date(c.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return {
        id: c.id,
        room,
        tenant: repTenant,
        contract: c,
        daysLeft
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  // 3. Tenants Unpaid (Nhắc khách chưa thanh toán)
  const unpaidInvoiceReminders = state.invoices
    .filter(inv => inv.status === 'chưa thu' || inv.status === 'thu một phần' || inv.status === 'quá hạn')
    .map(inv => {
      const room = state.rooms.find(r => r.id === inv.roomId);
      const tenant = state.tenants.find(t => t.id === inv.tenantId) || state.tenants.find(t => t.roomId === inv.roomId && t.isRepresentative && t.status === 'đang thuê');
      const unpaidAmount = inv.totalAmount - inv.paidAmount;
      return {
        ...inv,
        room,
        tenant,
        unpaidAmount
      };
    })
    .filter(inv => inv.unpaidAmount > 0);

  // 4. Missing Utility Readings (Nhắc nhập chỉ số điện nước)
  // List occupied rooms which DO NOT have an electricity and water reading for the current month '2026-06'
  const currentMonth = '2026-06';
  const missingUtilityReminders = state.rooms
    .filter(r => r.status === 'đang thuê')
    .filter(r => {
      const reading = state.utilityReadings.find(u => u.roomId === r.id && u.month === currentMonth);
      return !reading; // reading doesn't exist
    })
    .map(r => {
      const tenant = state.tenants.find(t => t.roomId === r.id && t.isRepresentative && t.status === 'đang thuê');
      return {
        room: r,
        tenant
      };
    });

  // 5. Periodic Maintenance Reminder (Nhắc bảo trì định kỳ)
  // Select maintenance requests with high urgency or pending state, plus custom preset items
  const activeMaintenances = state.maintenances.filter(m => m.status === 'mới tạo' || m.status === 'đang xử lý');

  // 6. Long Vacant Rooms (Nhắc phòng trống lâu ngày)
  // To make it highly interactive, let's look at vacant rooms and map a simulated "vacant since" logic based on room name
  const vacantRoomReminders = state.rooms
    .filter(r => r.status === 'trống')
    .map(r => {
      // Deterministic number of vacant days to stay consistent
      const codeNumber = parseInt(r.name.replace(/\D/g, '')) || 5;
      const vacantDays = (codeNumber * 7) % 45 + 10; // e.g. 10 to 55 days
      const lossCost = Math.round((r.basePrice / 30) * vacantDays);
      return {
        room: r,
        vacantDays,
        lossCost
      };
    })
    .sort((a, b) => b.vacantDays - a.vacantDays);

  // 7. Asset Auditing (Nhắc kiểm tra tài sản)
  // Create virtual audit reminders: Rooms that haven't been visited or have active renters but have asset values
  const assetCheckReminders = state.rooms
    .filter(r => r.status === 'đang thuê')
    .map(r => {
      const tenant = state.tenants.find(t => t.roomId === r.id && t.isRepresentative);
      const codeNumber = parseInt(r.name.replace(/\D/g, '')) || 3;
      const monthsSinceCheck = (codeNumber * 3) % 9 + 1; // 1 to 9 months ago
      const statusLabel = monthsSinceCheck >= 6 ? 'Cần kiểm tra định kỳ (đã quá 6 tháng)' : 'Tài sản ổn định';
      const severity = monthsSinceCheck >= 6 ? 'high' : 'normal';
      return {
        room: r,
        tenant,
        monthsSinceCheck,
        statusLabel,
        severity
      };
    })
    .sort((a, b) => b.monthsSinceCheck - a.monthsSinceCheck);

  // SMS Generator function when selecting invoice
  const triggerSmsGenerate = (inv: any) => {
    setSelectedInvoice(inv);
    
    // Replace placeholders with live details
    let msg = smsTemplate;
    const clientName = inv.tenant?.fullName || 'khách hàng';
    const monthStr = inv.month.split('-').reverse().join('/'); // "2026-06" -> "06/2026"
    const roomName = inv.room?.name || '---';
    const totalAmountStr = inv.unpaidAmount.toLocaleString() + ' ₫';
    const dueDateStr = inv.dueDate.split('-').reverse().join('/'); // YYYY-MM-DD -> DD/MM/YYYY

    msg = msg.replace('[Tên khách]', clientName);
    msg = msg.replace('[Tháng]', monthStr);
    msg = msg.replace('[Mã phòng]', roomName);
    msg = msg.replace('[Tổng tiền]', totalAmountStr);
    msg = msg.replace('[Ngày đến hạn]', dueDateStr);

    setGeneratedSms(msg);
  };

  // Re-generate SMS whenever template changes
  useEffect(() => {
    if (selectedInvoice) {
      let msg = smsTemplate;
      const clientName = selectedInvoice.tenant?.fullName || 'khách hàng';
      const monthStr = selectedInvoice.month.split('-').reverse().join('/');
      const roomName = selectedInvoice.room?.name || '---';
      const totalAmountStr = selectedInvoice.unpaidAmount.toLocaleString() + ' ₫';
      const dueDateStr = selectedInvoice.dueDate.split('-').reverse().join('/');

      msg = msg.replace('[Tên khách]', clientName);
      msg = msg.replace('[Tháng]', monthStr);
      msg = msg.replace('[Mã phòng]', roomName);
      msg = msg.replace('[Tổng tiền]', totalAmountStr);
      msg = msg.replace('[Ngày đến hạn]', dueDateStr);

      setGeneratedSms(msg);
    }
  }, [smsTemplate, selectedInvoice]);

  const handleCopyClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Custom Checklist addition handler
  const handleAddCustomReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newReminder: CustomReminder = {
      id: `custom-rem-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      dueDate: newDueDate,
      notes: newNotes,
      completed: false
    };

    setCustomReminders([newReminder, ...customReminders]);
    setIsAddOpen(false);
    setNewTitle('');
    setNewNotes('');
    alert('Thêm việc nhắc nhở thành công!');
  };

  const toggleCustomReminder = (id: string) => {
    setCustomReminders(prev => 
      prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
    );
  };

  const deleteCustomReminder = (id: string) => {
    setCustomReminders(prev => prev.filter(r => r.id !== id));
  };

  // Aggregated operation notifications count
  const criticalAlertsCount = 
    (rentCollectionReminders.filter(r => r.collectionDay === currentDayNum).length) +
    expiringContractReminders.length +
    unpaidInvoiceReminders.length +
    missingUtilityReminders.length +
    activeMaintenances.filter(m => m.priority === 'khẩn cấp').length +
    vacantRoomReminders.filter(v => v.vacantDays > 30).length;

  return (
    <div className="space-y-6">
      {/* Header and overview banners */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Nhắc việc & Cảnh báo</h2>
            <Badge className="bg-red-500 text-white font-bold ml-1">{criticalAlertsCount} Cảnh báo</Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Tổng hợp thông minh toàn bộ cảnh báo phát sinh từ dữ liệu phòng trọ, công nợ, hợp đồng và bảo trì.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Tạo việc nhắc nhở thủ công
        </Button>
      </div>

      {/* Grid summarizing the 7 types of reminders */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Card 1: Rent collection */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1. Thu tiền trọ</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-slate-800">{rentCollectionReminders.length}</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Chu kỳ đóng tiền</p>
        </div>

        {/* Card 2: Expiring contract */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">2. Hết hạn HĐ</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-amber-600">{expiringContractReminders.length}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Cần gia hạn gấp</p>
        </div>

        {/* Card 3: Unpaid */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">3. Khách nợ tiền</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-red-600">{unpaidInvoiceReminders.length}</span>
            <DollarSign className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Chưa thu đủ tiền</p>
        </div>

        {/* Card 4: Utility reading */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">4. Ghi Chỉ số</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-yellow-600">{missingUtilityReminders.length}</span>
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Phòng chưa chốt số</p>
        </div>

        {/* Card 5: Maintenance */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">5. Bảo trì định kỳ</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-purple-600">{activeMaintenances.length}</span>
            <Wrench className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Sự cố đang xử lý</p>
        </div>

        {/* Card 6: Vacant room */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">6. Phòng trống lâu</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-pink-600">{vacantRoomReminders.length}</span>
            <DoorOpen className="w-4 h-4 text-pink-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Thất thoát doanh thu</p>
        </div>

        {/* Card 7: Asset checking */}
        <div className="bg-white border rounded-xl p-3 shadow-sm hover:border-slate-350 transition-colors">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">7. Kiểm tra tài sản</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-lg font-black text-indigo-600">
              {assetCheckReminders.filter(a => a.severity === 'high').length}
            </span>
            <PackageCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">Căn hộ đến hạn khám</p>
        </div>
      </div>

      {/* Main operational tabs */}
      <Tabs defaultValue="unpaid" className="w-full bg-transparent">
        <TabsList className="bg-slate-200/60 p-1 rounded-xl mb-4 w-full flex flex-wrap h-auto gap-1">
          <TabsTrigger value="unpaid" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <DollarSign className="w-3.5 h-3.5 text-red-500" /> Khách chưa thanh toán ({unpaidInvoiceReminders.length})
          </TabsTrigger>
          <TabsTrigger value="rent" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <Calendar className="w-3.5 h-3.5 text-blue-500" /> Thu tiền trọ ({rentCollectionReminders.length})
          </TabsTrigger>
          <TabsTrigger value="contract" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Sắp hết hạn HĐ ({expiringContractReminders.length})
          </TabsTrigger>
          <TabsTrigger value="utility" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <Lightbulb className="w-3.5 h-3.5 text-yellow-500" /> Chưa chốt số ({missingUtilityReminders.length})
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <Wrench className="w-3.5 h-3.5 text-purple-500" /> Sửa chữa & Bảo trì ({activeMaintenances.length})
          </TabsTrigger>
          <TabsTrigger value="vacant" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <DoorOpen className="w-3.5 h-3.5 text-pink-500" /> Phòng trống ({vacantRoomReminders.length})
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-1.5 text-xs py-2 px-3 grow font-bold text-slate-650">
            <PackageCheck className="w-3.5 h-3.5 text-indigo-500" /> Định kỳ tài sản
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Tenant unpaid + Copy Message (Zalo/SMS generator) */}
        <TabsContent value="unpaid">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-red-500" /> Danh sách nợ tiền phòng trọ
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">
                    Cảnh báo các hóa đơn quá hạn chưa thu, cho phép tạo nội dung tin nhắn đôn đốc thanh toán nhanh qua Zalo / SMS.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng trọ</th>
                      <th className="px-6 py-3">Khách thuê đại diện</th>
                      <th className="px-6 py-3">Hạn thanh toán</th>
                      <th className="px-6 py-3">Hóa đơn tháng</th>
                      <th className="px-6 py-3 text-right">Tổng tiền</th>
                      <th className="px-6 py-3 text-right">Đã trả</th>
                      <th className="px-6 py-3 text-right">Còn nợ lại</th>
                      <th className="px-6 py-3 text-right">Soạn tin nhắc nhở</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {unpaidInvoiceReminders.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          Phòng {inv.room?.name || '---'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{inv.tenant?.fullName || 'Trống / Không tên'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{inv.tenant?.phone || '---'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded font-bold border ${inv.status === 'quá hạn' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                            {inv.dueDate}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">Tháng {inv.month.split('-').reverse().join('/')}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-600">{inv.totalAmount.toLocaleString()} ₫</td>
                        <td className="px-6 py-4 text-right font-medium text-green-600">{inv.paidAmount.toLocaleString()} ₫</td>
                        <td className="px-6 py-4 text-right font-black text-rose-600">
                          {inv.unpaidAmount.toLocaleString()} ₫
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <Button 
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold border border-indigo-200 text-xs"
                            size="sm"
                            onClick={() => triggerSmsGenerate(inv)}
                          >
                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                            Nhắc nợ Zalo/SMS
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {unpaidInvoiceReminders.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Tuyệt vời! Hiện không có công nợ phòng nào quá hạn chưa thanh toán.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Rent Collection (Lịch nhắc thu tiền trọ) */}
        <TabsContent value="rent">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" /> Kế hoạch thu tiền nhà hàng tháng
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Hiển thị kỳ ngày thu tiền nhà đã thỏa thuận trong hợp đồng để chủ nhà theo dõi hành trình luồng tiền.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng trọ</th>
                      <th className="px-6 py-3">Khách đại diện</th>
                      <th className="px-6 py-3">HĐ thanh toán theo</th>
                      <th className="px-6 py-3">Ngày thu tiền hàng tháng</th>
                      <th className="px-6 py-3">Số tiền trọ cố định</th>
                      <th className="px-6 py-3">Trạng thái kỳ này (T6)</th>
                      <th className="px-6 py-3 text-right">Lập nhanh hóa đơn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rentCollectionReminders.map(item => {
                      // Check if bills exist for this month '2026-06'
                      const billExists = state.invoices.some(i => i.roomId === item.room?.id && i.month === '2026-06');
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-slate-900">Phòng {item.room?.name || '---'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800">{item.tenant?.fullName || '---'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.tenant?.phone || '---'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium">Bình quân theo {item.contract.paymentCycle}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${item.statusColor}`}>
                              Ngày {item.collectionDay} hàng tháng
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{item.contract.price.toLocaleString()} ₫</td>
                          <td className="px-6 py-4">
                            {billExists ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">Already invoiced</Badge>
                            ) : (
                              <Badge className="bg-amber-50 text-amber-700 border border-amber-200 bg-amber-50/20">Chưa lập phiếu thu</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button 
                              size="sm" 
                              variant={billExists ? "ghost" : "outline"}
                              className="text-xs h-8 border-slate-350"
                              onClick={() => navigate('/billing')}
                            >
                              Lập / Xem phiếu <ArrowRight className="w-3 h-3 ml-1" />
                            </Button>
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

        {/* Tab 3: Contract Expiration */}
        <TabsContent value="contract">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" /> Cảnh báo hợp đồng phòng trọ sắp hết hạn
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Danh sách các hợp đồng thuê sẽ chấm dứt hiệu lực trong vòng 30 ngày tới. Vui lòng liên hệ đại diện để gia hạn hoặc tổ chức bàn giao trả phòng dọn đi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng</th>
                      <th className="px-6 py-3">Người đại diện</th>
                      <th className="px-6 py-3">Ngày bắt đầu</th>
                      <th className="px-6 py-3">Ngày hết hạn</th>
                      <th className="px-6 py-3">Đặt cọc của khách</th>
                      <th className="px-6 py-3">Thời gian còn lại</th>
                      <th className="px-6 py-3 text-right">Gia hạn / Khám trả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiringContractReminders.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">Phòng {item.room?.name || '---'}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{item.tenant?.fullName || 'Chưa xác định'}</td>
                        <td className="px-6 py-4 text-xs">{item.contract.startDate}</td>
                        <td className="px-6 py-4 text-xs font-bold text-red-650">{item.contract.endDate}</td>
                        <td className="px-6 py-4 text-slate-650 font-semibold">{item.contract.deposit.toLocaleString()} ₫</td>
                        <td className="px-6 py-4">
                          <span className="text-red-600 font-bold text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-200">
                            Còn {item.daysLeft} ngày nữa
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs h-8"
                            onClick={() => navigate('/tenants')}
                          >
                            Lập phụ lục Hợp đồng
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {expiringContractReminders.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Hiện không ghi nhận hợp đồng thuê trọ nào sắp sửa hết hạn trong 30 ngày tới.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Missing Utility Readings */}
        <TabsContent value="utility">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" /> Nhắc nhở chốt chỉ số Điện - Nước phòng đang thuê ({currentMonth})
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Các phòng trọ sau đang hoạt động thuê nhưng chưa có lưu dữ liệu chỉ số điện nước mới nhất cho kỳ tháng {currentMonth}. Cần nhập trực tiếp để tạo hóa đơn chính xác.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng trọ</th>
                      <th className="px-6 py-3">Diện tích</th>
                      <th className="px-6 py-3">Đại diện thuê phòng</th>
                      <th className="px-6 py-3">Kế hoạch chỉ số điện nước</th>
                      <th className="px-6 py-3 text-right">Chốt chỉ số nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {missingUtilityReminders.map(item => (
                      <tr key={item.room.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">Phòng {item.room.name}</td>
                        <td className="px-6 py-4 text-xs">{item.room.area} m²</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{item.tenant?.fullName || 'Chưa cập nhật'}</span>
                            <span className="text-[10px] text-slate-400">{item.tenant?.phone || '---'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-amber-600 font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                            Chưa nhập chỉ số tháng {currentMonth}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs border-indigo-200 text-indigo-700 bg-indigo-50/40 hover:bg-indigo-50"
                            onClick={() => navigate('/utilities')}
                          >
                            Ghi chỉ số ngay <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {missingUtilityReminders.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Tất cả các phòng đang thuê đều đã được chốt chỉ số Điện nước thành công tháng này!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: Maintenance & Incidents */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-purple-500" /> Hệ thống cảnh báo sửa chữa, xử lý sự cố thiết bị dột mòn
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Sản phẩm các sự cố đang gặp hỏng hóc hạ tầng trọ, cần theo đuổi tiến trình sửa đảm bảo cam kết chất lượng sinh hoạt của khách thuê.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Mã phiếu</th>
                      <th className="px-6 py-3">Nhóm sự cố</th>
                      <th className="px-6 py-4">Chi tiết lỗi báo hoại</th>
                      <th className="px-6 py-3">Ngày báo hỏng</th>
                      <th className="px-6 py-3">Độ ưu tiên</th>
                      <th className="px-6 py-3 text-right">Giải quyết sự cố</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeMaintenances.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">#{m.id.split('-').pop()?.toUpperCase()}</td>
                        <td className="px-6 py-4 font-semibold"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-xs text-slate-800 uppercase">{m.type}</span></td>
                        <td className="px-6 py-4 text-xs text-slate-600 max-w-[280px] line-clamp-2">{m.description}</td>
                        <td className="px-6 py-4 text-xs whitespace-nowrap">{m.reportDate}</td>
                        <td className="px-6 py-4 uppercase text-[10px] font-bold text-slate-750">
                          {m.priority === 'khẩn cấp' ? (
                            <span className="text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">Khẩn cấp</span>
                          ) : (
                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">{m.priority}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/maintenance')}>
                            Cập nhật sửa chữa
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {activeMaintenances.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Hạ tầng vận hành ổn định. Không có báo hỏng chưa xử lý ở thời điểm hiện tại.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 6: Long Vacant Rooms */}
        <TabsContent value="vacant">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-pink-500" /> Cảnh báo rủi ro phòng trống quá hạn lâu ngày
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Các phòng trống kéo dài làm suy giảm doanh thu thực của khu nhà trọ. Chủ đầu tư nên cân nhắc điều chỉnh chính sách ưu tiên quảng bá tuyển sinh viên hoặc chỉnh sửa giảm giá thuê phòng.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng trống</th>
                      <th className="px-6 py-3">Loại phòng trọ</th>
                      <th className="px-6 py-3">Giá đề xuất/Tháng</th>
                      <th className="px-6 py-3">Số ngày trống lũy kế</th>
                      <th className="px-6 py-3">Thất thoát ước tính</th>
                      <th className="px-6 py-3 text-right">Tuyển khách thuê ngay</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vacantRoomReminders.map(item => (
                      <tr key={item.room.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-950">Phòng {item.room.name}</td>
                        <td className="px-6 py-4 text-xs font-medium uppercase text-slate-500">{item.room.type}</td>
                        <td className="px-6 py-4 font-semibold text-slate-700">{item.room.basePrice.toLocaleString()} ₫</td>
                        <td className="px-6 py-4 font-medium">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.vacantDays >= 30 ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-650'}`}>
                            {item.vacantDays} ngày trống
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-rose-500">-{item.lossCost.toLocaleString()} ₫</td>
                        <td className="px-6 py-4 text-right">
                          <Button 
                            size="sm" 
                            className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs"
                            onClick={() => navigate('/rooms')}
                          >
                            Đã cọc / Cho thuê
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {vacantRoomReminders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-medium">
                          Không có phòng trống kéo dài! Hiệu suất khai thác đạt 100%.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 7: Asset checking */}
        <TabsContent value="assets">
          <Card>
            <CardHeader className="bg-slate-50 border-b pb-4">
              <CardTitle className="text-gray-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-500" /> Nhắc hẹn nghiệm thu / Kiểm tài sản bàn giao định kỳ
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Lịch trình kiểm tra tình trạng hao mòn tự nhiên đối với đồ đạc nội thất lớn như điều hòa, tủ lạnh, bếp từ, vòi nóng lạnh khi cho thuê lâu năm.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[800px]">
                  <thead className="bg-slate-100/60 uppercase text-[10px] font-bold text-slate-500 border-b">
                    <tr>
                      <th className="px-6 py-3">Phòng thuê</th>
                      <th className="px-6 py-3">Người đang thuê</th>
                      <th className="px-6 py-3">Số tháng chưa rà soát thiết bị</th>
                      <th className="px-6 py-3">Kiến nghị thao tác</th>
                      <th className="px-6 py-3 text-right">Quản trị tài sản</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assetCheckReminders.map(item => (
                      <tr key={item.room.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-bold text-slate-900">Phòng {item.room.name}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{item.tenant?.fullName || 'Chưa cập nhật'}</td>
                        <td className="px-6 py-4 text-xs font-semibold">{item.monthsSinceCheck} tháng liên tiếp</td>
                        <td className="px-6 py-4">
                          {item.severity === 'high' ? (
                            <span className="text-xs text-red-650 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded font-bold animate-pulse">
                              {item.statusLabel}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600 bg-slate-150 px-2 py-0.5 rounded">
                              {item.statusLabel}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" className="text-xs" onClick={() => navigate('/assets')}>
                            Kiểm kê <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manual Checklist Operations Panel */}
      <h3 className="text-lg font-black text-slate-900 pt-4 flex items-center gap-1.5">
        <Clipboard className="w-4.5 h-4.5 text-indigo-500" /> Sổ tay nhắc việc & Nghiệp vụ phụ trợ
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Manual operation checklist cards */}
        <Card className="md:col-span-2">
          <CardHeader className="bg-slate-50 pb-3 border-b">
            <CardTitle className="text-sm font-bold text-indigo-850 flex items-center justify-between">
              Doanh tác quản lý vận hành khu trọ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {customReminders.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">Không có công việc nhắc nhở thủ công nào hiện hành.</p>
            ) : (
              customReminders.map(rem => (
                <div 
                  key={rem.id} 
                  className={`p-3 rounded-lg border flex items-start gap-3 justify-between transition-all ${rem.completed ? 'bg-slate-50/50 border-slate-200 opacity-60' : 'bg-white border-indigo-150 shadow-sm'}`}
                >
                  <div className="flex items-start gap-2.5">
                    <input 
                      type="checkbox" 
                      checked={rem.completed} 
                      onChange={() => toggleCustomReminder(rem.id)} 
                      className="mt-1 accent-indigo-600 w-4 h-4 cursor-pointer"
                    />
                    <div>
                      <h4 className={`text-xs font-bold text-slate-900 ${rem.completed ? 'line-through text-slate-400' : ''}`}>
                        {rem.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold uppercase bg-slate-100 text-slate-500 px-1 py-0.5 rounded">
                          {rem.category.replace('_', ' ')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-medium">Hạn chốt: {rem.dueDate}</span>
                      </div>
                      {rem.notes && (
                        <p className={`text-[10px] text-slate-500 mt-1 italic ${rem.completed ? 'line-through text-slate-400' : ''}`}>
                          "{rem.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => deleteCustomReminder(rem.id)}
                    className="text-slate-400 hover:text-red-500 p-1 rounded-full hover:bg-slate-100"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Tips or operations summary */}
        <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-indigo-200 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-300" /> Cẩm nang vận hành thông minh
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-4">
            <div className="space-y-1.5 leading-relaxed text-slate-300">
              <p className="font-semibold text-white">Chốt số kỳ thu tháng này:</p>
              <p>Mỗi tháng cần chốt chỉ số Điện nước trước ngày 28 để gộp tạo phiếu tổng hóa đơn gửi khách thanh toán trước ngày 5 tháng sau.</p>
            </div>
            
            <div className="space-y-1.5 leading-relaxed text-slate-300 pt-3 border-t border-slate-800">
              <p className="font-semibold text-white">Xử lý Zalo đôn đốc nợ:</p>
              <p>Hệ thống hỗ trợ sinh thông tin tự động theo mẫu, hãy tận dụng copy gửi nhắn trực tiếp chỉ trong 3 giây để khách thuê dễ hiểu, minh bạch chi phí đóng cự ly.</p>
            </div>

            <div className="space-y-1.5 leading-relaxed text-slate-300 pt-3 border-t border-slate-800">
              <p className="font-semibold text-white">Chăm sóc tài sản trọ:</p>
              <p>Những hợp đồng thuê đã ký kết trên 6 tháng nên có một kỳ khảo rà tài sản đột xuất để phát hiện sớm các sự cố rò rỉ nước ngầm, dột sàn nhà vệ sinh.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Copy Zalo Message Dialog */}
      <Dialog open={selectedInvoice !== null} onOpenChange={(open) => { if (!open) setSelectedInvoice(null); }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-bold flex items-center gap-1.5">
              <MessageSquare className="w-5 h-5 text-indigo-600 animate-bounce" />
              Soạn tin nhắn nhắc nợ Zalo & SMS
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Tin nhắn tự động chèn thông tin tiền phòng, tháng thanh toán, tiền nợ tương thích của khách mời để gửi nhanh thu quỹ an toàn.
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4 pt-1">
              {/* Template customization */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600">Mẫu tin nhắn nhắc tiền (Tùy chỉnh nếu cần):</label>
                <textarea 
                  value={smsTemplate}
                  onChange={e => setSmsTemplate(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-lg focus:outline-indigo-500 bg-slate-55 h-20"
                />
                <div className="text-[10px] text-slate-400 mt-1 flex flex-wrap gap-1 leading-normal">
                  <span>Chữa placeholders tự động:</span>
                  <strong className="text-slate-700 bg-slate-100 rounded px-1 cursor-pointer" onClick={() => setSmsTemplate(prev => prev + ' [Tên khách]')}>[Tên khách]</strong>,
                  <strong className="text-slate-700 bg-slate-100 rounded px-1 cursor-pointer" onClick={() => setSmsTemplate(prev => prev + ' [Tháng]')}>[Tháng]</strong>,
                  <strong className="text-slate-700 bg-slate-100 rounded px-1 cursor-pointer" onClick={() => setSmsTemplate(prev => prev + ' [Mã phòng]')}>[Mã phòng]</strong>,
                  <strong className="text-slate-700 bg-slate-100 rounded px-1 cursor-pointer" onClick={() => setSmsTemplate(prev => prev + ' [Tổng tiền]')}>[Tổng tiền]</strong>,
                  <strong className="text-slate-700 bg-slate-100 rounded px-1 cursor-pointer" onClick={() => setSmsTemplate(prev => prev + ' [Ngày đến hạn]')}>[Ngày đến hạn]</strong>
                </div>
              </div>

              {/* Preview of the customized generated SMS */}
              <div className="bg-slate-50 p-4 border border-indigo-100 rounded-xl space-y-2">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <span className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1">
                    <Send className="w-3.5 h-3.5" /> Xem trước tin nhắn gửi đi
                  </span>
                  <Badge variant="outline" className="text-[10px] bg-white text-indigo-600 font-semibold border-indigo-200">
                    Phòng {selectedInvoice.room?.name}
                  </Badge>
                </div>
                <p className="text-xs text-slate-800 font-normal leading-relaxed whitespace-pre-wrap">{generatedSms}</p>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>
                  Đóng lại
                </Button>
                {selectedInvoice.tenant?.phone && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 font-bold size-sm flex items-center gap-1.5 text-white"
                    onClick={() => {
                      let phoneNumber = selectedInvoice.tenant?.phone.replace(/[^0-9]/g, '');
                      if (phoneNumber.startsWith('0')) {
                        phoneNumber = '84' + phoneNumber.substring(1);
                      }
                      window.open(`https://zalo.me/${phoneNumber}`, '_blank');
                    }}
                  >
                    <Send className="w-4 h-4" /> Gửi Zalo ({selectedInvoice.tenant.phone})
                  </Button>
                )}
                <Button 
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold size-sm flex items-center gap-1.5"
                  onClick={() => handleCopyClipboard(generatedSms, selectedInvoice.id)}
                >
                  {copiedId === selectedInvoice.id ? (
                    <>
                      <Check className="w-4 h-4 text-white" /> Đã sao chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Sao chép tin nhắn
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual ADD alert popup form */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-slate-900 font-extrabold flex items-center gap-1">
              <Plus className="w-5 h-5 text-indigo-600" /> Tạo việc nhắc nhở thủ công mới
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddCustomReminder} className="space-y-4 pt-1">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Lời nhắc / Tiêu đề công tác:</label>
              <Input 
                required
                placeholder="VD: Gọi điện kiểm định máy bơm dột hành lang cũ"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Nhóm đề xuất:</label>
                <select 
                  value={newCategory} 
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full text-xs p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white h-10 border-slate-200 text-slate-800"
                >
                  <option value="thu_tien">Thu tiền trọ</option>
                  <option value="hop_dong">Xem kỳ hợp đồng</option>
                  <option value="dien_nuoc">Chốt số Điện nước</option>
                  <option value="bao_tri">Sự cố sửa chữa</option>
                  <option value="tai_san">Thanh lý tài sản</option>
                  <option value="khac">Phát sinh khác</option>
                </select>
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Hạn hoàn tất dâng:</label>
                <Input 
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Ghi chú phụ trợ:</label>
              <textarea 
                placeholder="Nội dung nhắc nhở chi tiết phụ thợ thiết bị..."
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                className="w-full text-xs p-2 border rounded focus:outline-indigo-550 h-16"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>Hủy</Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold">Lập ghi nhớ</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
