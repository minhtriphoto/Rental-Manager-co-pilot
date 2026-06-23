import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  Search, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Send, 
  Plus, 
  MessageSquare, 
  User, 
  DoorOpen, 
  Building2, 
  History, 
  Calendar, 
  CreditCard,
  Notebook
} from 'lucide-react';
import { Invoice } from '../types';

export const Debts = () => {
  const { state, setInvoices, setTransactions } = useAppStore();

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('all'); // YYYY-MM or 'all'
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'overdue'>('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Interactive Operations States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentSheetOpen, setIsPaymentSheetOpen] = useState(false);
  const [isReminderSheetOpen, setIsReminderSheetOpen] = useState(false);
  const [isNotesSheetOpen, setIsNotesSheetOpen] = useState(false);

  // Form Fields
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'tiền mặt' | 'chuyển khoản' | 'ví điện tử'>('chuyển khoản');
  const [payNote, setPayNote] = useState('');

  const [reminderMethod, setReminderMethod] = useState('Zalo');
  const [reminderContent, setReminderContent] = useState('');

  const [debtNoteText, setDebtNoteText] = useState('');

  // Helper date parsing & calculation
  const getOverdueDays = (dueDate: string): number => {
    const due = new Date(dueDate);
    const today = new Date();
    // Reset times to compare dates accurately
    due.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (today > due) {
      const diffTime = Math.abs(today.getTime() - due.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  // Process data with filters
  const filteredDebts = state.invoices.filter(invoice => {
    const room = state.rooms.find(r => r.id === invoice.roomId);
    const tenant = state.tenants.find(t => t.id === invoice.tenantId);
    const building = room ? state.buildings.find(b => b.id === room.buildingId) : null;

    const remainingDebt = invoice.totalAmount - invoice.paidAmount;

    // Filter by outstanding debt by default or specific statuses
    if (statusFilter === 'unpaid' && remainingDebt <= 0) return false;
    if (statusFilter === 'overdue') {
      const days = getOverdueDays(invoice.dueDate);
      if (days <= 0 || remainingDebt <= 0) return false;
    }

    // Filter by Month
    if (monthFilter !== 'all' && invoice.month !== monthFilter) return false;

    // Filter by Building
    if (buildingFilter !== 'all' && room?.buildingId !== buildingFilter) return false;

    // Filter by Room
    if (roomFilter !== 'all' && invoice.roomId !== roomFilter) return false;

    // Filter by Search Query (Room name or Customer Name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const roomMatch = room?.name.toLowerCase().includes(query) || false;
      const tenantMatch = tenant?.fullName.toLowerCase().includes(query) || false;
      if (!roomMatch && !tenantMatch) return false;
    }

    return true;
  });

  // KPI calculations (Overall across current filtered set)
  const totalDueSum = filteredDebts.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaidSum = filteredDebts.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalDebtSum = totalDueSum - totalPaidSum;
  const overdueCount = filteredDebts.filter(inv => getOverdueDays(inv.dueDate) > 0 && (inv.totalAmount - inv.paidAmount > 0)).length;

  // Handlers
  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const remaining = invoice.totalAmount - invoice.paidAmount;
    setPayAmount(remaining);
    setPayNote(`Thanh toán tiền phòng tháng ${invoice.month}`);
    setIsPaymentSheetOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedInvoice) return;
    if (payAmount <= 0) {
      alert('Vui lòng nhập số tiền thanh toán hợp lệ');
      return;
    }

    const currentRemaining = selectedInvoice.totalAmount - selectedInvoice.paidAmount;
    if (payAmount > currentRemaining) {
      alert(`Số tiền nhập (${payAmount.toLocaleString()} ₫) vượt quá số nợ còn lại (${currentRemaining.toLocaleString()} ₫).`);
      return;
    }

    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        const newPaid = inv.paidAmount + payAmount;
        let newStatus: typeof inv.status = inv.status;
        if (newPaid >= inv.totalAmount) {
          newStatus = 'đã thu đủ';
        } else {
          newStatus = 'thu một phần';
        }

        return {
          ...inv,
          paidAmount: newPaid,
          status: newStatus,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: payMethod
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);

    // Also insert a Transaction to Sổ Thu Chi!
    const room = state.rooms.find(r => r.id === selectedInvoice.roomId);
    const tenant = state.tenants.find(t => t.id === selectedInvoice.tenantId);
    
    const newTransaction = {
      id: `txn-debt-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'thu' as const,
      category: 'tiền nhà' as const,
      amount: payAmount,
      buildingId: room?.buildingId,
      roomId: selectedInvoice.roomId,
      personName: tenant?.fullName || 'Khách thuê',
      notes: payNote || `Ghi nhận thu tiền phòng tháng ${selectedInvoice.month} (Thu một phần/Hết)`,
      paymentMethod: payMethod
    };

    setTransactions([...state.transactions, newTransaction]);
    setIsPaymentSheetOpen(false);
    setSelectedInvoice(null);
    alert('Đã cập nhật công nợ và lưu vào sổ thu chi thành công!');
  };

  const handleOpenReminder = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    const room = state.rooms.find(r => r.id === invoice.roomId);
    const tenant = state.tenants.find(t => t.id === invoice.tenantId);
    const remaining = invoice.totalAmount - invoice.paidAmount;

    setReminderContent(
      `[Rental Manager] Nhắc nhợ đóng tiền phòng: Kính gửi anh/chị ${tenant?.fullName || 'khách thuê'}, vui lòng hoàn thành thanh toán tiền phòng tháng ${invoice.month} của Phòng ${room?.name || '---'}. Số tiền còn lại là ${remaining.toLocaleString()} ₫. Hạn chót đóng tiền: ${invoice.dueDate}. Xin cảm ơn!`
    );
    setIsReminderSheetOpen(true);
  };

  const handleSubmitReminder = () => {
    if (!selectedInvoice) return;
    
    const newLog = {
      date: new Date().toLocaleString(),
      method: reminderMethod,
      content: reminderContent
    };

    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        const history = inv.reminderHistory || [];
        return {
          ...inv,
          reminderHistory: [newLog, ...history]
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setIsReminderSheetOpen(false);
    setSelectedInvoice(null);
    alert('Đã lưu lịch sử nhắc nợ thành công!');
  };

  const handleOpenNotes = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setDebtNoteText(invoice.debtNotes || '');
    setIsNotesSheetOpen(true);
  };

  const handleSaveNotes = () => {
    if (!selectedInvoice) return;

    const updatedInvoices = state.invoices.map(inv => {
      if (inv.id === selectedInvoice.id) {
        return {
          ...inv,
          debtNotes: debtNoteText
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);
    setIsNotesSheetOpen(false);
    setSelectedInvoice(null);
    alert('Đã cập nhật ghi chú xử lý công nợ!');
  };

  // Get distinct months for the month filter dropdown
  const distinctMonths = Array.from(new Set(state.invoices.map(inv => inv.month))).sort().reverse();

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sổ Công Nợ Chủ Nhà</h2>
        <p className="text-muted-foreground text-sm">
          Theo dõi sát sao nợ phòng, nợ dịch vụ, quản lý lịch sử thông báo, và ghi nhận thanh toán linh hoạt.
        </p>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng nợ chưa thu</p>
              <h4 className="text-2xl font-black text-rose-600 font-sans tracking-tight">
                {totalDebtSum.toLocaleString()} ₫
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Số phiếu quá hạn</p>
              <h4 className="text-2xl font-black text-amber-600 font-sans tracking-tight">
                {overdueCount} phiếu
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium font-medium">Đã thu trong bộ lọc</p>
              <h4 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {totalPaidSum.toLocaleString()} ₫
              </h4>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng hóa đơn</p>
              <h4 className="text-2xl font-semibold text-slate-800 tracking-tight">
                {filteredDebts.length} kỳ thu
              </h4>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Table Card */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base font-bold flex items-center gap-2">Bộ Lọc Sổ Nợ</CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm phòng, tên khách..." 
                className="pl-8 text-sm" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* General Filter status */}
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả hóa đơn</SelectItem>
                <SelectItem value="unpaid">Còn khoản nợ (Chưa thu đủ)</SelectItem>
                <SelectItem value="overdue">Công nợ quá hạn</SelectItem>
              </SelectContent>
            </Select>

            {/* Month filter */}
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các tháng</SelectItem>
                {distinctMonths.map(mon => (
                  <SelectItem key={mon} value={mon}>Tháng {mon}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Building filter */}
            <Select value={buildingFilter} onValueChange={setBuildingFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả khu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả các khu nhà</SelectItem>
                {state.buildings.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Room filter */}
            <Select value={roomFilter} onValueChange={setRoomFilter}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Tất cả phòng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng trọ</SelectItem>
                {state.rooms.map(r => (
                  <SelectItem key={r.id} value={r.id}>Phòng {r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[1000px]">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Phòng & Khu nhà</th>
                  <th className="px-6 py-4">Khách thuê</th>
                  <th className="px-6 py-4">Kỳ hạn thu</th>
                  <th className="px-6 py-4 text-right">Tổng Tiền (₫)</th>
                  <th className="px-6 py-4 text-right">Đã Thu (₫)</th>
                  <th className="px-6 py-4 text-right">Còn Nợ (₫)</th>
                  <th className="px-6 py-4 text-center">Quá Hạn</th>
                  <th className="px-6 py-4">Nhắc Nợ & Ghi Chú</th>
                  <th className="px-6 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDebts.map(invoice => {
                  const room = state.rooms.find(r => r.id === invoice.roomId);
                  const building = room ? state.buildings.find(b => b.id === room.buildingId) : null;
                  const tenant = state.tenants.find(t => t.id === invoice.tenantId);
                  
                  const remainingDebt = invoice.totalAmount - invoice.paidAmount;
                  const overdueDays = getOverdueDays(invoice.dueDate);
                  const isPaidTotal = remainingDebt <= 0;

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Room and Building info */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1.5">
                            <DoorOpen className="w-3.5 h-3.5 text-blue-500" />
                            Phòng {room?.name || '---'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {building?.name || 'Vãng lai'}
                          </span>
                        </div>
                      </td>

                      {/* Tenant Name */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {tenant?.fullName || 'Không rõ'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans tracking-wide">
                            SĐT: {tenant?.phone || '---'}
                          </span>
                        </div>
                      </td>

                      {/* Period info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-600 text-xs font-semibold">Tháng {invoice.month}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-normal">Hạn {invoice.dueDate}</span>
                        </div>
                      </td>

                      {/* Total Amount */}
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                        {invoice.totalAmount.toLocaleString()}
                      </td>

                      {/* Paid Amount */}
                      <td className="px-6 py-4 text-right font-medium text-blue-600">
                        {invoice.paidAmount.toLocaleString()}
                      </td>

                      {/* Debt Amount */}
                      <td className="px-6 py-4 text-right">
                        {isPaidTotal ? (
                          <span className="text-slate-400 font-medium">0</span>
                        ) : (
                          <span className="font-extrabold text-red-600">
                            {remainingDebt.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* Overdue Count */}
                      <td className="px-6 py-4 text-center">
                        {isPaidTotal ? (
                          <Badge className="bg-slate-100 text-slate-500 hover:bg-slate-100 border-none">Đã hoàn thành</Badge>
                        ) : overdueDays > 0 ? (
                          <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 text-[10px] font-bold">
                            {overdueDays} ngày
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50 text-[10px]">
                            Trong hạn
                          </Badge>
                        )}
                      </td>

                      {/* Reminder and remarks notes log */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5 max-w-[200px]">
                          {/* Processing note */}
                          {invoice.debtNotes ? (
                            <div className="text-xs text-slate-600 bg-amber-50 hover:bg-amber-100/80 p-1.5 rounded border border-amber-100/50 flex gap-1 cursor-pointer" onClick={() => handleOpenNotes(invoice)}>
                              <Notebook className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-2 leading-tight">{invoice.debtNotes}</span>
                            </div>
                          ) : (
                            <Button 
                              variant="ghost" 
                              onClick={() => handleOpenNotes(invoice)}
                              className="h-6 px-1.5 text-[10px] text-slate-400 hover:text-slate-800"
                            >
                              + Thêm ghi chú xử lý
                            </Button>
                          )}

                          {/* Reminder History info */}
                          {invoice.reminderHistory && invoice.reminderHistory.length > 0 ? (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
                              <History className="w-3 h-3 shrink-0" />
                              <span>Đã nhắc {invoice.reminderHistory.length} lần (lần cuối {invoice.reminderHistory[0].date.split(' ')[0]})</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">Chưa nhắc nợ</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => handleOpenReminder(invoice)}
                            disabled={isPaidTotal}
                          >
                            <Send className="w-3 h-3 mr-1" /> Nhắc nợ
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => handleOpenPayment(invoice)}
                            disabled={isPaidTotal}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Thu nợ
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredDebts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                      Không có chỉ số công nợ nào hợp lệ với bộ lọc đã chọn.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment sheet modal */}
      <Sheet open={isPaymentSheetOpen} onOpenChange={setIsPaymentSheetOpen}>
        <SheetContent className="sm:max-w-[420px] w-full overflow-y-auto">
          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 border-b pb-3">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  Ghi Nhận Thu Tiền / Trả Nợ
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Phòng thu: <strong>{state.rooms.find(r => r.id === selectedInvoice.roomId)?.name}</strong></span>
                    <span>Kỳ hạn: <strong>{selectedInvoice.month}</strong></span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Khách thuê: <strong>{state.tenants.find(t => t.id === selectedInvoice.tenantId)?.fullName}</strong></span>
                    <span>Hạn chót: <strong className="text-red-500">{selectedInvoice.dueDate}</strong></span>
                  </div>
                  <div className="border-t border-slate-200 my-1"></div>
                  <div className="flex justify-between font-bold text-sm text-slate-800">
                    <span>Cần thu tất cả:</span>
                    <span className="text-blue-600">{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()} ₫</span>
                  </div>
                </div>

                {/* Pay amount input */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Số tiền khách trả đợt này:</label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      className="text-lg font-bold pl-3 text-emerald-700" 
                      value={payAmount || ''} 
                      onChange={e => setPayAmount(Number(e.target.value))} 
                    />
                    <span className="absolute right-3 top-3 text-[11px] font-bold text-slate-400">VNĐ</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    * Bạn có thể ghi nhập thanh toán một phần. Hệ thống sẽ tự động bù trừ công nợ của phòng.
                  </p>
                </div>

                {/* Pay method */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Phương thức thanh toán:</label>
                  <Select value={payMethod} onValueChange={(v: any) => setPayMethod(v)}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chuyển khoản">Chuyển khoản ngân hàng</SelectItem>
                      <SelectItem value="tiền mặt">Tiền mặt direct</SelectItem>
                      <SelectItem value="ví điện tử">Ví điện tử (ZaloPay, MoMo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Ghi chú */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Nội dung ghi chú giao dịch:</label>
                  <Input 
                    placeholder="VD: Nguyễn Văn A thanh toán một phần tiển phòng" 
                    value={payNote}
                    onChange={e => setPayNote(e.target.value)}
                  />
                </div>

                <div className="pt-4 flex gap-3 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsPaymentSheetOpen(false)}>Hủy</Button>
                  <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSavePayment}>
                    Xác nhận thu nợ
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reminder log sheet */}
      <Sheet open={isReminderSheetOpen} onOpenChange={setIsReminderSheetOpen}>
        <SheetContent className="sm:max-w-[450px] w-full overflow-y-auto">
          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 border-b pb-3">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  Gửi Thông Báo / Log Nhắc Nợ
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Hình thức nhắc nợ:</label>
                  <Select value={reminderMethod} onValueChange={setReminderMethod}>
                    <SelectTrigger className="text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Zalo">Ứng dụng Zalo / SMS</SelectItem>
                      <SelectItem value="Gọi điện">Gọi điện thoại trực tiếp</SelectItem>
                      <SelectItem value="Gặp phòng">Đàm thoại trực tiếp tại phòng</SelectItem>
                      <SelectItem value="Email">Hệ thống Gmail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Nội dung thông báo mẫu:</label>
                  <textarea 
                    className="w-full text-xs font-sans h-36 p-3 bg-slate-50 border rounded-lg focus:outline-blue-400"
                    value={reminderContent}
                    onChange={e => setReminderContent(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    * Bạn có thể sao chép tin nhắn này để gửi cho khách đóng phòng qua Zalo/Chuyện trò. Hệ thống sẽ tự động lưu lại thời gian bạn bấm thông báo này.
                  </p>
                </div>

                {selectedInvoice.reminderHistory && selectedInvoice.reminderHistory.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Lịch sử nhắc đóng nợ gần đây:
                    </h5>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedInvoice.reminderHistory.map((rem, idx) => (
                        <div key={idx} className="p-2 border rounded-lg bg-orange-50/40 text-[11px] leading-relaxed">
                          <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1">
                            <span>Phương thức: {rem.method}</span>
                            <span>{rem.date}</span>
                          </div>
                          <p className="text-slate-600">{rem.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex gap-3 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsReminderSheetOpen(false)}>Hủy</Button>
                  <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-medium" onClick={handleSubmitReminder}>
                    Lưu lịch sử nhắc
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Note recording sheet */}
      <Sheet open={isNotesSheetOpen} onOpenChange={setIsNotesSheetOpen}>
        <SheetContent className="sm:max-w-[420px] w-full overflow-y-auto">
          {selectedInvoice && (
            <div className="space-y-6 pt-4">
              <SheetHeader>
                <SheetTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 border-b pb-3">
                  <Notebook className="w-5 h-5 text-amber-500" />
                  Ghi Chú Xử Lý Công Nợ
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Chi tiết lộ trình cam kết trả nợ:</label>
                  <textarea 
                    className="w-full text-xs font-sans h-36 p-3 bg-amber-50/20 border border-amber-200 rounded-lg focus:outline-amber-400"
                    placeholder="Ví dụ: Khách hẹn xin khất đóng nợ còn lại trước thứ 5 tuần sau. Có dấu hiệu khó trả hoặc cần hỗ trợ thêm thế nào..."
                    value={debtNoteText}
                    onChange={e => setDebtNoteText(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400">
                    * Ghi chú này sẽ được treo làm cảnh báo trạng thái ngay phía ngoài bảng theo dõi để bạn dễ kiểm soát.
                  </p>
                </div>

                <div className="pt-4 flex gap-3 border-t">
                  <Button variant="outline" className="flex-1" onClick={() => setIsNotesSheetOpen(false)}>Hủy</Button>
                  <Button className="flex-1 bg-amber-600 hover:bg-amber-750 text-white" onClick={handleSaveNotes}>
                    Cập nhật ghi chú
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
