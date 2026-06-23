import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, DoorOpen, Users, Receipt, AlertCircle, Wrench, Bell, MessageSquare, Clipboard, ArrowRight, Lightbulb, Calendar, HelpCircle, Copy, Check } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { state } = useAppStore();
  const navigate = useNavigate();

  const [copiedInvoiceId, setCopiedInvoiceId] = useState<string | null>(null);

  const totalRooms = state.rooms.length;
  const occupiedRooms = state.rooms.filter(r => r.status === 'đang thuê').length;
  const emptyRooms = state.rooms.filter(r => r.status === 'trống').length;
  const occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(1) : 0;
  
  const thisMonthInvoices = state.invoices; // mock mapping
  const totalRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const collectedRevenue = thisMonthInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const uncollectedRevenue = totalRevenue - collectedRevenue;

  const expiringContracts = state.contracts.filter(c => c.status === 'sắp hết hạn').length;
  const pendingMaintenances = state.maintenances.filter(m => m.status === 'mới tạo' || m.status === 'đang xử lý').length;
  const criticalMaintenances = state.maintenances.filter(m => (m.status === 'mới tạo' || m.status === 'đang xử lý') && m.priority === 'khẩn cấp').length;
  const overdueInvoices = state.invoices.filter(i => i.status === 'quá hạn' || (i.status === 'chưa thu' && new Date(i.dueDate) < new Date())).length;

  const unpaidInvoicesMapped = state.invoices
    .filter(inv => inv.status === 'chưa thu' || inv.status === 'thu một phần' || inv.status === 'quá hạn')
    .map(inv => {
      const room = state.rooms.find(r => r.id === inv.roomId);
      const tenant = state.tenants.find(t => t.id === inv.tenantId) || state.tenants.find(t => t.roomId === inv.roomId && t.isRepresentative && t.status === 'đang thuê');
      const unpaidAmount = inv.totalAmount - inv.paidAmount;
      return {
        ...inv,
        roomName: room?.name || '---',
        tenantName: tenant?.fullName || 'khách hàng',
        unpaidAmount
      };
    })
    .filter(inv => inv.unpaidAmount > 0);

  const missingUtilityReadings = state.rooms
    .filter(r => r.status === 'đang thuê')
    .filter(r => !state.utilityReadings.some(u => u.roomId === r.id && u.month === '2026-06')).length;

  const handleCopyZaloMessage = (inv: any) => {
    const clientName = inv.tenantName || 'Anh/Chị';
    const monthStr = inv.month.split('-').reverse().join('/'); 
    const roomName = inv.roomName || '---';
    const totalAmountStr = inv.unpaidAmount.toLocaleString() + ' ₫';
    const dueDateStr = inv.dueDate.split('-').reverse().join('/');

    const msg = `Chào anh/chị ${clientName}, tiền phòng tháng ${monthStr} của phòng ${roomName} là ${totalAmountStr}. Anh/chị vui lòng thanh toán trước ngày ${dueDateStr}. Cảm ơn anh/chị.`;
    
    navigator.clipboard.writeText(msg);
    setCopiedInvoiceId(inv.id);
    setTimeout(() => setCopiedInvoiceId(null), 2000);
  };

  const chartData = [
    { name: 'T6', thu: 45000000, chi: 12000000 },
    { name: 'T7', thu: 48000000, chi: 10000000 },
    { name: 'T8', thu: 50000000, chi: 15000000 },
    { name: 'T9', thu: 49000000, chi: 8000000 },
    { name: 'T10', thu: totalRevenue, chi: 9000000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
        <p className="text-muted-foreground">Theo dõi tình hình kinh doanh tháng này.</p>
      </div>

      {/* Operational Task Warnings & System Alerts */}
      <div className="space-y-3">
        {/* Core Quick Action Bar for Alerts */}
        {(pendingMaintenances > 0 || expiringContracts > 0 || unpaidInvoicesMapped.length > 0 || missingUtilityReadings > 0) && (
          <div className="bg-white border rounded-2xl shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 animate-swing" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Trung tâm cảnh báo vận hành & Nhắc việc</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Nhấp vào từng hành động nhanh để rà soát hoặc copy nội dung đôn đốc gửi khách trọ.</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                className="text-xs text-indigo-600 font-bold hover:bg-slate-50 gap-1"
                onClick={() => navigate('/reminders')}
              >
                Vào trang Nhắc Việc chi tiết <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Alert 1: Unpaid invoices */}
              {unpaidInvoicesMapped.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50/50 border border-red-150 flex flex-col justify-between gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1 px-1.5 rounded bg-red-100 text-red-700 font-bold text-xs mt-0.5 shrink-0">
                      $
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Khách chưa đóng tiền phòng</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
                        Có <strong>{unpaidInvoicesMapped.length} phòng</strong> chưa nộp đủ tiền học/tiền trọ kỳ này.
                      </span>
                    </div>
                  </div>
                  {/* Embedded Zalo/SMS Copy trigger list for the top 2 unpaid rooms */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] uppercase font-bold text-slate-450 block">Nhấp Copy tin nhắn nhắc nợ:</span>
                    {unpaidInvoicesMapped.slice(0, 2).map(inv => (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => handleCopyZaloMessage(inv)}
                        className="w-full text-left p-1.5 bg-white hover:bg-slate-50 rounded border text-[9px] font-medium text-slate-700 flex items-center justify-between gap-1.5 border-slate-200 transition-colors"
                      >
                        <span className="truncate">Phòng {inv.roomName} ({inv.tenantName})</span>
                        <span className="shrink-0 flex items-center text-indigo-600 font-bold gap-0.5 bg-indigo-50 px-1 rounded">
                          {copiedInvoiceId === inv.id ? (
                            <>
                              <Check className="w-2.5 h-2.5 text-green-600" /> Done
                            </>
                          ) : (
                            <>
                              <Copy className="w-2.5 h-2.5" /> Copy
                            </>
                          )}
                        </span>
                      </button>
                    ))}
                    {unpaidInvoicesMapped.length > 2 && (
                      <span className="text-[8px] text-slate-400 italic block text-right">và {unpaidInvoicesMapped.length - 2} phòng khác...</span>
                    )}
                  </div>
                </div>
              )}

              {/* Alert 2: Missing utility chốt chỉ số */}
              {missingUtilityReadings > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/40 border border-amber-100 flex flex-col justify-between gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1.5 rounded bg-amber-100/70 text-amber-700 shrink-0 mt-0.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Chưa chốt chỉ số điện nước</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
                        Có <strong>{missingUtilityReadings} phòng</strong> đang thuê chưa được nhập chỉ số Điện Nước tháng này.
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-[10px] font-bold h-7 border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
                    onClick={() => navigate('/utilities')}
                  >
                    Ghi chỉ số ngay <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              )}

              {/* Alert 3: Critical and raw repairs */}
              {pendingMaintenances > 0 && (
                <div className="p-3 rounded-xl bg-indigo-50/45 border border-indigo-150 flex flex-col justify-between gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1.5 rounded bg-indigo-100/70 text-indigo-600 shrink-0 mt-0.5">
                      <Wrench className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Sự cố thiết bị phát sinh</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
                        Có <strong>{pendingMaintenances} yêu cầu kỹ thuật</strong> đang xếp lịch sửa chữa.
                        {criticalMaintenances > 0 && (
                          <span className="text-red-500 font-bold block mt-1">⚠️ Có {criticalMaintenances} sự cố KHẨN CẤP!</span>
                        )}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-[10px] font-bold h-7 border-indigo-300 text-indigo-700 hover:bg-indigo-100 bg-white"
                    onClick={() => navigate('/maintenance')}
                  >
                    Cử nhân viên kỹ thuật
                  </Button>
                </div>
              )}

              {/* Alert 4: Expiring Contracts */}
              {expiringContracts > 0 && (
                <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-150 flex flex-col justify-between gap-3">
                  <div className="flex gap-2.5 items-start">
                    <div className="p-1.5 rounded bg-amber-150/80 text-amber-800 shrink-0 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-700" />
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">Hợp đồng sắp hết hiệu lực</span>
                      <span className="text-[10px] text-slate-500 mt-0.5 block leading-normal">
                        Có <strong>{expiringContracts} hợp đồng thuê phòng</strong> sẽ hết hạn trong vòng 30 ngày.
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-[10px] font-bold h-7 border-amber-300 text-amber-800 hover:bg-amber-100 bg-white"
                    onClick={() => navigate('/tenants')}
                  >
                    Thương thảo với khách
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="border-l-4 border-blue-500 shadow-sm rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tổng doanh thu dự kiến</div>
          <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} <span className="text-sm font-normal text-slate-400">₫</span></div>
          <div className="text-[10px] text-green-600 mt-2 font-medium">Đã thu: {collectedRevenue.toLocaleString()} ₫</div>
        </Card>

        <Card className="border-l-4 border-red-500 shadow-sm rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Công nợ chưa thu</div>
          <div className="text-2xl font-bold text-red-600">{uncollectedRevenue.toLocaleString()} <span className="text-sm font-normal text-red-400">₫</span></div>
          <div className="text-[10px] text-slate-400 mt-2">{overdueInvoices} phiếu quá hạn</div>
        </Card>

        <Card className="border-l-4 border-green-500 shadow-sm rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Tỷ lệ lấp đầy</div>
          <div className="text-2xl font-bold">{occupancyRate}%</div>
          <div className="text-[10px] text-slate-400 mt-2">{occupiedRooms}/{totalRooms} phòng đang thuê</div>
        </Card>

        <Card className="border-l-4 border-orange-400 shadow-sm rounded-xl p-4">
          <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Bảo trì & Hết hạn</div>
          <div className="text-2xl font-bold text-orange-600">{pendingMaintenances + expiringContracts} <span className="text-sm font-normal text-slate-400 font-medium">yêu cầu</span></div>
          <div className="text-[10px] text-blue-600 mt-2 cursor-pointer">{expiringContracts} HĐ sắp hết, {pendingMaintenances} sự cố</div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border shadow-[0_1px_3px_rgba(0,0,0,0.1)] rounded-xl">
          <CardHeader>
            <CardTitle className="font-bold text-slate-800">Doanh thu & Chi phí 5 tháng gần nhất</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} ₫`, '']}/>
                <Bar dataKey="thu" name="Thu" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chi" name="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-slate-900 text-white border-none shadow-sm rounded-xl">
          <CardHeader>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tình trạng phòng</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Đang thuê</span>
                </div>
                <span className="font-bold text-lg">{occupiedRooms}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-slate-500/20 text-slate-400 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold">Phòng trống</span>
                </div>
                <span className="font-bold text-lg">{emptyRooms}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                    !
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Sắp hết hạn HĐ</span>
                    <span className="text-[10px] text-slate-400">Cần thông báo trước 15 ngày</span>
                  </div>
                </div>
                <span className="font-bold text-lg text-orange-400">{expiringContracts}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-red-500/20 text-red-500 flex items-center justify-center flex-shrink-0">
                    $
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Khách nợ tiền</span>
                  </div>
                </div>
                <span className="font-bold text-lg text-red-500">{overdueInvoices}</span>
              </div>
            </div>
            
            <div 
              onClick={() => navigate('/reminders')}
              className="mt-6 bg-indigo-600 rounded-lg p-3 cursor-pointer text-center text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" /> Gửi nhắc tiền & SMS Zalo
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
