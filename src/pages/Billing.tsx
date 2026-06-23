import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, CheckCircle2, MessageSquareWarning, FileText, CalendarRange, User, Zap, Droplets, Wifi, Sparkles, Car, HelpCircle, AlertCircle, MinusCircle, Plus, Receipt } from 'lucide-react';
import { Invoice } from '../types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const Billing = () => {
  const { state, setInvoices } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [targetMonth, setTargetMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const sendReminder = (invoice: Invoice, room: any, tenant: any) => {
    if (!room || !tenant) return;
    const msg = `Chào anh/chị ${tenant.fullName}, tiền phòng tháng ${invoice.month} của phòng ${room.name} là ${invoice.totalAmount.toLocaleString()} ₫. Anh/chị vui lòng thanh toán trước ngày ${invoice.dueDate}. Cảm ơn anh/chị.`;
    navigator.clipboard.writeText(msg).then(() => {
      alert(`Đã copy mẫu tin nhắn nhắc nợ:\n\n${msg}\n\n(Bạn có thể dán vào Zalo/SMS)`);
    });
  };

  const generateInvoices = () => {
    const newInvoices: Invoice[] = [];
    const activeContracts = state.contracts.filter(c => c.status === 'còn hiệu lực' || c.status === 'sắp hết hạn');

    activeContracts.forEach(contract => {
      // Check if invoice already exists for this room and month
      const exists = state.invoices.some(i => i.roomId === contract.roomId && i.month === targetMonth);
      if (exists) return;

      const dueDate = new Date();
      dueDate.setDate(contract.collectionDay);
      // Determine fees based on fixed services in contract
      let internetFee = 0;
      let cleaningFee = 0;
      contract.fixedServices.forEach(s => {
        if (s.name.toLowerCase().includes('wifi') || s.name.toLowerCase().includes('internet')) internetFee = s.price;
        if (s.name.toLowerCase().includes('vệ sinh')) cleaningFee = s.price;
      });

      const totalAmount = contract.price + internetFee + cleaningFee; // Assume basic 0 for variable meters initially

      newInvoices.push({
        id: `inv-${Date.now()}-${contract.roomId}`,
        month: targetMonth,
        roomId: contract.roomId,
        tenantId: contract.representativeId,
        roomRent: contract.price,
        electricFee: 0,
        waterFee: 0,
        internetFee,
        cleaningFee,
        parkingFee: 0,
        otherFees: 0,
        oldDebt: 0,
        discount: 0,
        surcharge: 0,
        totalAmount,
        paidAmount: 0,
        dueDate: dueDate.toISOString().split('T')[0],
        status: 'chưa thu'
      });
    });

    if (newInvoices.length > 0) {
      setInvoices([...newInvoices, ...state.invoices]);
      alert(`Đã tạo ${newInvoices.length} phiếu thu cho tháng ${targetMonth}.`);
    } else {
      alert(`Không có phòng nào cần tạo phiếu, hoặc phiếu đã được tạo trước đó.`);
    }
    setIsGenerateDialogOpen(false);
  };

  const filteredInvoices = state.invoices.filter(i => {
    const room = state.rooms.find(r => r.id === i.roomId);
    if (search && room && !room.name.toLowerCase().includes(search.toLowerCase()) && !i.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Thu tiền nhà</h2>
          <p className="text-muted-foreground">Quản lý các khoản thu và công nợ hàng tháng.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Xuất Excel</Button>
          <Button onClick={() => setIsGenerateDialogOpen(true)}>
            <PlusCircle className="w-4 h-4 mr-2" /> Tạo phiếu thu hàng loạt
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo phòng, mã phiếu..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã Phiếu</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Kỳ thu</th>
                  <th className="px-4 py-3 font-medium text-right">Tổng thu</th>
                  <th className="px-4 py-3 font-medium text-right">Đã thu</th>
                  <th className="px-4 py-3 font-medium text-right">Còn nợ</th>
                  <th className="px-4 py-3 font-medium">Hạn chót</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => {
                  const room = state.rooms.find(r => r.id === invoice.roomId);
                  const debt = invoice.totalAmount - invoice.paidAmount;
                  
                  return (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedInvoice(invoice)}>
                      <td className="px-4 py-3 font-medium text-blue-600 hover:underline">{invoice.id.toUpperCase().slice(0,8)}...</td>
                      <td className="px-4 py-3 font-bold">{room?.name || '---'}</td>
                      <td className="px-4 py-3">{invoice.month}</td>
                      <td className="px-4 py-3 text-right font-medium">{invoice.totalAmount.toLocaleString()} ₫</td>
                      <td className="px-4 py-3 text-right text-green-600">{invoice.paidAmount.toLocaleString()} ₫</td>
                      <td className="px-4 py-3 text-right text-destructive font-bold">{debt > 0 ? `${debt.toLocaleString()} ₫` : '0 ₫'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{invoice.dueDate}</td>
                      <td className="px-4 py-3">
                        {invoice.status === 'đã thu đủ' ? (
                          <Badge className="bg-green-500">Đã thu đủ</Badge>
                        ) : invoice.status === 'chưa thu' ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">Chưa thu</Badge>
                        ) : invoice.status === 'quá hạn' ? (
                          <Badge className="bg-destructive">Quá hạn</Badge>
                        ) : (
                          <Badge className="bg-blue-500">Thu 1 phần</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {invoice.status !== 'đã thu đủ' && (
                          <>
                            <Button size="icon" variant="outline" className="w-8 h-8 mr-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50" onClick={(e) => { e.stopPropagation(); sendReminder(invoice, room, state.tenants.find(t => t.id === invoice.tenantId)); }} title="Gửi nhắc nợ Zalo/SMS">
                              <MessageSquareWarning className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="secondary" className="mr-2" onClick={(e) => e.stopPropagation()}>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Thu
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo phiếu thu hàng loạt</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Hệ thống sẽ tự động tạo phiếu thu nháp cho tất cả các phòng đang có hợp đồng hiệu lực. Phiếu thu sẽ bao gồm tiền phòng và các dịch vụ cố định theo hợp đồng.
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="month" className="text-right text-sm font-medium">Tháng thu:</label>
              <Input id="month" type="month" className="col-span-3" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>Hủy</Button>
            <Button onClick={generateInvoices}>Tạo phiếu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <SheetContent className="sm:max-w-[500px] w-full overflow-y-auto">
          {selectedInvoice && (
            <>
              <SheetHeader className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <SheetTitle className="text-xl font-bold flex items-center gap-2">
                      Phiếu thu phòng {state.rooms.find(r => r.id === selectedInvoice.roomId)?.name}
                    </SheetTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      Kỳ: {selectedInvoice.month} • Mã: {selectedInvoice.id.toUpperCase().slice(0,8)}...
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-slate-50 border rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-sm text-slate-500 font-medium font-medium">Tổng phải thu</span>
                    <span className="text-2xl font-bold text-blue-600">{selectedInvoice.totalAmount.toLocaleString()} ₫</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    {selectedInvoice.status === 'đã thu đủ' ? (
                      <Badge className="bg-green-500 flex items-center gap-1 mb-1"><CheckCircle2 className="w-3 h-3" /> Đã thu đủ</Badge>
                    ) : selectedInvoice.status === 'chưa thu' ? (
                      <Badge variant="outline" className="border-orange-500 text-orange-500 mb-1">Chưa thu</Badge>
                    ) : selectedInvoice.status === 'quá hạn' ? (
                      <Badge className="bg-destructive mb-1">Quá hạn</Badge>
                    ) : (
                      <Badge className="bg-blue-500 mb-1">Thu 1 phần</Badge>
                    )}
                    <span className="text-sm font-medium text-slate-700">Đã thu: {selectedInvoice.paidAmount.toLocaleString()} ₫</span>
                    <span className="text-sm font-bold text-red-600">Còn nợ: {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()} ₫</span>
                  </div>
                </div>

                <div className="space-y-3 p-4 bg-white border rounded-xl">
                  <h4 className="font-bold text-sm uppercase text-slate-500 tracking-wider mb-2">Chi tiết khoản thu</h4>
                  
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="flex items-center gap-2 text-slate-600"><FileText className="w-4 h-4 text-slate-400" /> Tiền thuê phòng</span>
                    <span className="font-medium">{selectedInvoice.roomRent.toLocaleString()} ₫</span>
                  </div>
                  {selectedInvoice.electricFee > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Zap className="w-4 h-4 text-emerald-400" /> Tiền điện</span>
                      <span className="font-medium">{selectedInvoice.electricFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.waterFee > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Droplets className="w-4 h-4 text-blue-400" /> Tiền nước</span>
                      <span className="font-medium">{selectedInvoice.waterFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.internetFee > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Wifi className="w-4 h-4 text-indigo-400" /> Phí Internet</span>
                      <span className="font-medium">{selectedInvoice.internetFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.cleaningFee > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Sparkles className="w-4 h-4 text-teal-400" /> Phí vệ sinh</span>
                      <span className="font-medium">{selectedInvoice.cleaningFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.parkingFee > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Car className="w-4 h-4 text-slate-400" /> Phí gửi xe</span>
                      <span className="font-medium">{selectedInvoice.parkingFee.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.otherFees > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><HelpCircle className="w-4 h-4 text-slate-400" /> Phí dịch vụ khác</span>
                      <span className="font-medium">{selectedInvoice.otherFees.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.oldDebt > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-red-500"><AlertCircle className="w-4 h-4" /> Nợ cũ kỳ trước</span>
                      <span className="font-medium text-red-600">{selectedInvoice.oldDebt.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.surcharge > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-slate-600"><Plus className="w-4 h-4 text-amber-500" /> Phụ thu</span>
                      <span className="font-medium text-amber-600">{selectedInvoice.surcharge.toLocaleString()} ₫</span>
                    </div>
                  )}
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between items-center text-sm py-1">
                      <span className="flex items-center gap-2 text-green-600"><MinusCircle className="w-4 h-4" /> Giảm trừ</span>
                      <span className="font-medium text-green-600">-{selectedInvoice.discount.toLocaleString()} ₫</span>
                    </div>
                  )}
                  <div className="pt-3 mt-3 border-t flex justify-between items-center">
                    <span className="font-bold">Tổng cộng</span>
                    <span className="font-bold text-lg">{selectedInvoice.totalAmount.toLocaleString()} ₫</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 flex items-center gap-1"><User className="w-3.5 h-3.5" /> Người thanh toán</span>
                    <span className="font-medium">{state.tenants.find(t => t.id === selectedInvoice.tenantId)?.fullName || '---'}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-slate-500 flex items-center gap-1"><CalendarRange className="w-3.5 h-3.5" /> Hạn chót</span>
                    <span className="font-medium">{selectedInvoice.dueDate}</span>
                  </div>
                  {selectedInvoice.paymentDate && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Ngày thanh toán</span>
                      <span className="font-medium">{selectedInvoice.paymentDate}</span>
                    </div>
                  )}
                  {selectedInvoice.paymentMethod && (
                    <div className="flex flex-col gap-1">
                      <span className="text-slate-500 flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Phương thức</span>
                      <span className="font-medium capitalize">{selectedInvoice.paymentMethod}</span>
                    </div>
                  )}
                </div>

                {selectedInvoice.status !== 'đã thu đủ' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-4 mt-6">
                    <div className="w-24 h-24 bg-white p-1 rounded-lg border border-slate-200 shrink-0 select-none">
                      <img 
                        src={`https://img.vietqr.io/image/vietcombank-0123456789123-compact2.png?amount=${selectedInvoice.totalAmount - selectedInvoice.paidAmount}&addInfo=Thanh toan tien phong ${state.rooms.find(r => r.id === selectedInvoice.roomId)?.name} thang ${selectedInvoice.month.replace('/','-')}&accountName=NGUYEN VAN A`} 
                        alt="QR Thanh toán" 
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">Thanh toán qua mã QR</h4>
                      <p className="text-xs text-emerald-700 leading-tight mb-2">
                        Quét mã VietQR bằng ứng dụng ngân hàng để thanh toán nhanh chính xác số tiền {(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()} ₫.
                      </p>
                      <Button variant="outline" size="sm" className="bg-white hover:bg-emerald-50 border-emerald-200 text-emerald-700 h-7 text-xs" onClick={() => {
                        window.open(`https://img.vietqr.io/image/vietcombank-0123456789123-compact2.png?amount=${selectedInvoice.totalAmount - selectedInvoice.paidAmount}&addInfo=Thanh toan tien phong ${state.rooms.find(r => r.id === selectedInvoice.roomId)?.name} thang ${selectedInvoice.month.replace('/','-')}&accountName=NGUYEN VAN A`, '_blank');
                      }}>
                        Phóng to mã QR
                      </Button>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex gap-3">
                  <Button variant="outline" className="flex-1">Sửa phiếu</Button>
                  {selectedInvoice.status !== 'đã thu đủ' && (
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">Xác nhận thu tiền</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};
