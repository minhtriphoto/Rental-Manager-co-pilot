import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DoorOpen, 
  Calendar, 
  User, 
  Receipt, 
  DollarSign, 
  Lightbulb, 
  Wrench, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Printer, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  PlusCircle, 
  Search, 
  Info,
  Layers,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { Transaction } from '../types';

import { 
  RevenueChart, 
  DebtChart, 
  StatusPieChart, 
  CashflowChart, 
  ProfitChart, 
  UtilityChart 
} from '../components/reports/ReportCharts';
import { exportToCSV, exportToPDF } from '../components/reports/ReportExporter';

export const Finance = () => {
  const { state, setTransactions } = useAppStore();
  const navigate = useNavigate();

  // Tab state
  const [activeTab, setActiveTab] = useState<'transactions' | 'reports'>('transactions');

  // ==========================================
  // TAB 1: SỔ GIAO DỊCH STATES & UTILS
  // ==========================================
  const [txnSearch, setTxnSearch] = useState('');
  const [txnTypeFilter, setTxnTypeFilter] = useState<'all' | 'thu' | 'chi'>('all');
  const [txnFilterMonth, setTxnFilterMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Sorting for transaction table
  const [txnSortKey, setTxnSortKey] = useState<'date' | 'amount' | 'category' | 'none'>('date');
  const [txnSortDirection, setTxnSortDirection] = useState<'asc' | 'desc'>('desc');
  // Pagination for transactions
  const [txnPage, setTxnPage] = useState(1);
  const txnItemsPerPage = 8;

  // Ledger form creation
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    type: 'thu',
    category: 'tiền nhà',
    amount: 0,
    paymentMethod: 'chuyển khoản',
  });

  const incomeCategories = ['tiền nhà', 'tiền cọc', 'tiền điện nước', 'phí dịch vụ', 'phụ thu', 'khác'];
  const expenseCategories = ['sửa chữa', 'vệ sinh', 'bảo trì', 'điện nước tổng', 'internet', 'người quản lý', 'mua sắm tài sản', 'thuế/phí', 'khác'];

  // Filtered transactions
  const processedTxns = useMemo(() => {
    let result = [...state.transactions];

    if (txnTypeFilter !== 'all') {
      result = result.filter(t => t.type === txnTypeFilter);
    }
    if (txnFilterMonth) {
      result = result.filter(t => t.date.startsWith(txnFilterMonth));
    }
    if (txnSearch) {
      const q = txnSearch.toLowerCase();
      result = result.filter(t => 
        (t.personName && t.personName.toLowerCase().includes(q)) || 
        t.notes.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // Sort
    if (txnSortKey !== 'none') {
      result.sort((a, b) => {
        let valA: any = a[txnSortKey];
        let valB: any = b[txnSortKey];

        if (txnSortKey === 'date') {
          valA = new Date(a.date).getTime();
          valB = new Date(b.date).getTime();
        }

        if (valA < valB) return txnSortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return txnSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [state.transactions, txnTypeFilter, txnFilterMonth, txnSearch, txnSortKey, txnSortDirection]);

  // Paginated transactions
  const paginatedTxns = useMemo(() => {
    const start = (txnPage - 1) * txnItemsPerPage;
    return processedTxns.slice(start, start + txnItemsPerPage);
  }, [processedTxns, txnPage]);

  const totalTxnPages = Math.ceil(processedTxns.length / txnItemsPerPage) || 1;

  const txnSummary = useMemo(() => {
    const income = processedTxns.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0);
    const expense = processedTxns.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);
    return { income, expense, profit: income - expense };
  }, [processedTxns]);

  const toggleTxnSort = (key: 'date' | 'amount' | 'category') => {
    if (txnSortKey === key) {
      setTxnSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setTxnSortKey(key);
      setTxnSortDirection('desc');
    }
    setTxnPage(1);
  };

  const handleCreateTransaction = () => {
    if (!form.amount || !form.date || !form.category) return;
    
    const newTxn: Transaction = {
      id: `txn-${Date.now()}`,
      date: form.date,
      type: form.type as 'thu' | 'chi',
      category: form.category as any,
      amount: Number(form.amount),
      buildingId: form.buildingId,
      roomId: form.roomId,
      personName: form.personName || 'Khách vãng lai',
      notes: form.notes || '',
      paymentMethod: form.paymentMethod as any,
    };

    setTransactions([...state.transactions, newTxn]);
    setIsFormOpen(false);
    setForm({
      date: new Date().toISOString().split('T')[0],
      type: 'thu',
      category: 'tiền nhà',
      amount: 0,
      paymentMethod: 'chuyển khoản',
    });
  };

  // ==========================================
  // TAB 2: SYSTEM 10 REPORTS STATES
  // ==========================================
  const REPORTS = [
    { id: 'revenue', name: 'Báo cáo doanh thu', desc: 'Hoàn đóng tiền trọ hàng tháng', icon: TrendingUp },
    { id: 'debt', name: 'Báo cáo công nợ', desc: 'Dư nợ, chậm thanh toán hóa đơn', icon: AlertTriangle },
    { id: 'occupancy', name: 'Báo cáo tỷ lệ lấp đầy', desc: 'Phân tích cơ cấu phủ trọ phòng', icon: Users },
    { id: 'vacant', name: 'Báo cáo phòng trống', desc: 'Các phòng trống và thiệt hại do trống', icon: DoorOpen },
    { id: 'expiring', name: 'Hợp đồng sắp hết hạn', desc: 'Hợp đồng sắp kết thúc trong 60 ngày', icon: Calendar },
    { id: 'tenants', name: 'Báo cáo khách thuê', desc: 'Thông tin nhân cư, tạm trú khách thuê', icon: User },
    { id: 'cashflow', name: 'Báo cáo thu - chi', desc: 'Biến động dòng tiền quỹ trọ tổng', icon: Receipt },
    { id: 'profit', name: 'Báo cáo lợi nhuận', desc: 'Biên lãi ròng theo khu và theo tháng', icon: DollarSign },
    { id: 'utilities', name: 'Chỉ số điện nước', desc: 'Lượng KWh điện & m³ nước tiêu hao', icon: Lightbulb },
    { id: 'repairs', name: 'Báo cáo chi phí bảo trì', desc: 'Chi sửa chữa bảo dưỡng trang thiết bị', icon: Wrench },
  ];

  const [activeReportId, setActiveReportId] = useState('revenue');

  // Filter state values
  const [rFilterMonth, setrFilterMonth] = useState<string>('all'); // '01', '02', '03' ... '12'
  const [rFilterQuarter, setrFilterQuarter] = useState<string>('all'); // 'Q1', 'Q2', 'Q3', 'Q4'
  const [rFilterYear, setrFilterYear] = useState<string>(() => new Date().getFullYear().toString());
  const [rFilterBuilding, setrFilterBuilding] = useState<string>('all');
  const [rFilterRoom, setrFilterRoom] = useState<string>('all');
  const [rFilterStatus, setrFilterStatus] = useState<string>('all');
  const [rFilterTenant, setrFilterTenant] = useState<string>('all');
  
  // Internal pagination and sorting for ACTIVE report lists
  const [reportSortColumn, setReportSortColumn] = useState<string>('');
  const [reportSortOrder, setReportSortOrder] = useState<'asc' | 'desc'>('desc');
  const [reportPageCurrent, setReportPageCurrent] = useState<number>(1);
  const reportRecordsPerPage = 5;

  // Reset pagination when report changes
  useEffect(() => {
    setReportPageCurrent(1);
    setReportSortColumn('');
  }, [activeReportId, rFilterMonth, rFilterQuarter, rFilterYear, rFilterBuilding, rFilterRoom, rFilterStatus, rFilterTenant]);

  // Rooms filtered by building for Room selector
  const visibleRooms = useMemo(() => {
    if (rFilterBuilding === 'all') return state.rooms;
    return state.rooms.filter(r => r.buildingId === rFilterBuilding);
  }, [state.rooms, rFilterBuilding]);

  // Helpers to test matches with the Filter panel
  const matchesDateFilter = (isoDate?: string) => {
    if (!isoDate) return true;
    const yearStr = isoDate.substring(0, 4);
    const monthStr = isoDate.length >= 7 ? isoDate.substring(5, 7) : '';

    if (rFilterYear !== 'all' && yearStr !== rFilterYear) return false;
    
    if (rFilterMonth !== 'all' && monthStr !== rFilterMonth) return false;

    if (rFilterQuarter !== 'all' && monthStr) {
      const mo = parseInt(monthStr, 10);
      if (rFilterQuarter === 'Q1' && (mo < 1 || mo > 3)) return false;
      if (rFilterQuarter === 'Q2' && (mo < 4 || mo > 6)) return false;
      if (rFilterQuarter === 'Q3' && (mo < 7 || mo > 9)) return false;
      if (rFilterQuarter === 'Q4' && (mo < 10 || mo > 12)) return false;
    }
    return true;
  };

  const matchesBuildingRoomTenant = (roomId?: string, tenantId?: string) => {
    if (rFilterRoom !== 'all' && roomId !== rFilterRoom) return false;
    if (rFilterBuilding !== 'all' && roomId) {
      const rm = state.rooms.find(r => r.id === roomId);
      if (!rm || rm.buildingId !== rFilterBuilding) return false;
    }
    if (rFilterTenant !== 'all') {
      if (tenantId && tenantId !== rFilterTenant) return false;
      if (!tenantId && roomId) {
        // match on representative tenant
        const representative = state.tenants.find(t => t.roomId === roomId && t.isRepresentative && t.status === 'đang thuê');
        if (!representative || representative.id !== rFilterTenant) return false;
      }
    }
    return true;
  };

  // Generate Report specific structured data
  const reportDataResult = useMemo(() => {
    switch (activeReportId) {
      case 'revenue': {
        const invoices = state.invoices.filter(i => 
          matchesDateFilter(i.month) && 
          matchesBuildingRoomTenant(i.roomId, i.tenantId) &&
          (rFilterStatus === 'all' || i.status === rFilterStatus)
        );

        const totalExpected = invoices.reduce((s, i) => s + i.totalAmount, 0);
        const totalCollected = invoices.reduce((s, i) => s + i.paidAmount, 0);
        const totalDebtAmount = totalExpected - totalCollected;
        const speedPct = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

        // Group by month for chart
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const chartData = months.map(m => {
          const mInvoices = state.invoices.filter(i => 
            i.month === `${rFilterYear !== 'all' ? rFilterYear : '2026'}-${m}` &&
            matchesBuildingRoomTenant(i.roomId)
          );
          return {
            name: `T.${m}`,
            expected: mInvoices.reduce((s, i) => s + i.totalAmount, 0),
            collected: mInvoices.reduce((s, i) => s + i.paidAmount, 0)
          };
        });

        // Grid table items
        const tableRows = invoices.map(i => {
          const room = state.rooms.find(r => r.id === i.roomId);
          const tenant = state.tenants.find(t => t.id === i.tenantId) || state.tenants.find(t => t.roomId === i.roomId && t.isRepresentative);
          return {
            id: i.id,
            roomName: room?.name || '---',
            month: i.month,
            tenantName: tenant?.fullName || 'Khách thuê',
            totalAmount: i.totalAmount,
            paidAmount: i.paidAmount,
            debtAmount: i.totalAmount - i.paidAmount,
            dueDate: i.dueDate,
            status: i.status
          };
        });

        return {
          metrics: [
            { label: 'Phải thu biên lấp', value: `${totalExpected.toLocaleString()} đ` },
            { label: 'Doanh thu đã thu', value: `${totalCollected.toLocaleString()} đ` },
            { label: 'Công nợ tồn lưu', value: `${totalDebtAmount.toLocaleString()} đ`, alert: totalDebtAmount > 0 },
            { label: 'Tỷ lệ thu tiền', value: `${speedPct.toFixed(1)}%` },
          ],
          chart: <RevenueChart data={chartData} />,
          tableHeaders: ['Phiếu', 'Phòng trọ', 'Tháng', 'Đối tượng đóng', 'Tổng thu hoạch (đ)', 'Đã thu (đ)', 'Còn nợ (đ)', 'Thời hạn đóng', 'Trạng thái'],
          tableData: tableRows,
          excelHeaders: ['Ma phieu', 'Phong tro', 'Thang', 'Khach hang', 'Tong phai thu', 'Da thu', 'Con no', 'Han nop', 'Trang thai'],
          excelRows: tableRows.map(r => [r.id, r.roomName, r.month, r.tenantName, r.totalAmount, r.paidAmount, r.debtAmount, r.dueDate, r.status]),
          title: 'BÁO CÁO DOANH THU & TIẾN ĐỘ THU TIỀN'
        };
      }

      case 'debt': {
        const invoices = state.invoices.filter(i => 
          i.status !== 'đã thu đủ' &&
          matchesDateFilter(i.month) && 
          matchesBuildingRoomTenant(i.roomId, i.tenantId) &&
          (rFilterStatus === 'all' || i.status === rFilterStatus)
        );

        const totalDebt = invoices.reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);
        const count = invoices.length;
        const avgDebt = count > 0 ? (totalDebt / count) : 0;

        // Group by month for chart
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const chartData = months.map(m => {
          const mInvoices = state.invoices.filter(i => 
            i.status !== 'đã thu đủ' &&
            i.month === `${rFilterYear !== 'all' ? rFilterYear : '2026'}-${m}` &&
            matchesBuildingRoomTenant(i.roomId)
          );
          return {
            name: `T.${m}`,
            debt: mInvoices.reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0)
          };
        });

        const tableRows = invoices.map(i => {
          const room = state.rooms.find(r => r.id === i.roomId);
          const tenant = state.tenants.find(t => t.id === i.tenantId) || state.tenants.find(t => t.roomId === i.roomId && t.isRepresentative && t.status === 'đang thuê');
          return {
            id: i.id,
            roomName: room?.name || '---',
            month: i.month,
            tenantName: tenant?.fullName || 'Khách thuê',
            phone: tenant?.phone || 'Chưa có SĐT',
            totalAmount: i.totalAmount,
            debtAmount: i.totalAmount - i.paidAmount,
            dueDate: i.dueDate,
            debtNotes: i.debtNotes || 'Chưa liên hệ'
          };
        });

        return {
          metrics: [
            { label: 'Tổng số tiền nợ đọng', value: `${totalDebt.toLocaleString()} đ`, alert: totalDebt > 0 },
            { label: 'Số hóa đơn chậm nộp', value: `${count} phiếu` },
            { label: 'Sự nợ trung bình', value: `${avgDebt.toLocaleString()} đ` },
          ],
          chart: <DebtChart data={chartData} />,
          tableHeaders: ['Phiếu nợ', 'Phòng', 'Tháng', 'Họ tên', 'SĐT liên lạc', 'Giá trị hóa đơn (đ)', 'Tiền nợ lại (đ)', 'Hạn đóng', 'Nhật ký đôn đốc'],
          tableData: tableRows,
          excelHeaders: ['Ma phieu', 'Phong', 'Thang', 'Ho ten', 'Phone', 'Gia tri phieu', 'Tien no con lai', 'Han nop', 'Lich su don nhat'],
          excelRows: tableRows.map(r => [r.id, r.roomName, r.month, r.tenantName, r.phone, r.totalAmount, r.debtAmount, r.dueDate, r.debtNotes]),
          title: 'BÁO CÁO CÔNG NỢ & NỢ ĐỌNG TÍCH LŨY'
        };
      }

      case 'occupancy': {
        const rooms = state.rooms.filter(r => 
          (rFilterBuilding === 'all' || r.buildingId === rFilterBuilding) &&
          (rFilterRoom === 'all' || r.id === rFilterRoom)
        );

        const totalRoomsVal = rooms.length;
        const rentedCount = rooms.filter(r => r.status === 'đang thuê').length;
        const depositCount = rooms.filter(r => r.status === 'đặt cọc').length;
        const mCount = rooms.filter(r => r.status === 'đang sửa').length;
        const vacantCount = rooms.filter(r => r.status === 'trống').length;

        const rate = totalRoomsVal > 0 ? (rentedCount / totalRoomsVal) * 105 : 0; // scaled simulated
        const finalRate = rate > 100 ? 100 : rate;

        const chartData = [
          { name: 'Đang Thuê', value: rentedCount, percent: totalRoomsVal > 0 ? ((rentedCount/totalRoomsVal)*100).toFixed(0) : '0' },
          { name: 'Đang Trống', value: vacantCount, percent: totalRoomsVal > 0 ? ((vacantCount/totalRoomsVal)*100).toFixed(0) : '0' },
          { name: 'Đặt Cọc', value: depositCount, percent: totalRoomsVal > 0 ? ((depositCount/totalRoomsVal)*100).toFixed(0) : '0' },
          { name: 'Bảo Trì', value: mCount, percent: totalRoomsVal > 0 ? ((mCount/totalRoomsVal)*100).toFixed(0) : '0' },
        ];

        const tableRows = rooms.map(r => {
          const b = state.buildings.find(b => b.id === r.buildingId);
          const assetsCount = state.roomAssets.filter(as => as.roomId === r.id).length;
          return {
            id: r.id,
            buildingName: b?.name || '---',
            roomName: r.name,
            area: r.area,
            type: r.type,
            basePrice: r.basePrice,
            status: r.status,
            maxOccupants: r.maxOccupants,
            assetsCount
          };
        });

        return {
          metrics: [
            { label: 'Tổng số phòng quản lý', value: `${totalRoomsVal} phòng` },
            { label: 'Số phòng đã lấp đầy', value: `${rentedCount} phòng` },
            { label: 'Số phòng đặt cọc', value: `${depositCount} phòng` },
            { label: 'Tỷ lệ lấp đầy trọ', value: `${finalRate.toFixed(1)}%` },
          ],
          chart: <StatusPieChart data={chartData} />,
          tableHeaders: ['Tòa nhà', 'Tên phòng', 'Diện tích (m²)', 'Phân loại', 'Giá cơ sở (đ)', 'Trạng trạng thái', 'Giới hạn người', 'Tài sản hiện có'],
          tableData: tableRows,
          excelHeaders: ['Khu vuc', 'Ten phong', 'Dien tich', 'Kieu', 'Gia co so', 'Trang thai', 'Nguoi o toi da', 'So tai san'],
          excelRows: tableRows.map(r => [r.buildingName, r.roomName, r.area, r.type, r.basePrice, r.status, r.maxOccupants, r.assetsCount]),
          title: 'BÁO CÁO HIỆU XUẤT SỬ DỤNG PHÒNG & LẤP ĐẦY'
        };
      }

      case 'vacant': {
        const rooms = state.rooms.filter(r => 
          r.status === 'trống' &&
          (rFilterBuilding === 'all' || r.buildingId === rFilterBuilding) &&
          (rFilterRoom === 'all' || r.id === rFilterRoom)
        );

        const totalRoomsInKhu = rFilterBuilding === 'all' ? state.rooms.length : state.rooms.filter(rm => rm.buildingId === rFilterBuilding).length;
        const totalVacantCount = rooms.length;
        const potentialIncomeLoss = rooms.reduce((sum, r) => sum + r.basePrice, 0);
        const vacantRate = totalRoomsInKhu > 0 ? (totalVacantCount / totalRoomsInKhu) * 100 : 0;

        const tableRows = rooms.map(r => {
          const b = state.buildings.find(b => b.id === r.buildingId);
          return {
            id: r.id,
            buildingName: b?.name || '---',
            floor: r.floor,
            roomName: r.name,
            area: r.area,
            type: r.type,
            basePrice: r.basePrice,
            furniture: r.furnitureDescription || 'Nội thất cơ bản',
            notes: r.notes || 'Chưa có thông tin phát sinh'
          };
        });

        return {
          metrics: [
            { label: 'Tổng số phòng đang trống', value: `${totalVacantCount} phòng`, alert: totalVacantCount > 3 },
            { label: 'Tỷ lệ phòng trống', value: `${vacantRate.toFixed(1)}%` },
            { label: 'Thất thu tiềm ẩn / Tháng', value: `${potentialIncomeLoss.toLocaleString()} đ`, alert: potentialIncomeLoss > 0 },
          ],
          chart: null,
          tableHeaders: ['Tòa nhà', 'Phòng trọ', 'Tầng', 'Diện tích (m²)', 'Kiểu phòng', 'Giá cho thuê (đ)', 'Nội thất bàn giao', 'Nhật ký/Gia cụ'],
          tableData: tableRows,
          excelHeaders: ['Khu vuc', 'Phong', 'Tang', 'Dien tich', 'Phan loai', 'Gia co ban', 'Noi that', 'Ghi chu'],
          excelRows: tableRows.map(r => [r.buildingName, r.roomName, r.floor, r.area, r.type, r.basePrice, r.furniture, r.notes]),
          title: 'BÁO CÁO PHÒNG TRỐNG VÀ THẤT THU TIỀM ẨN'
        };
      }

      case 'expiring': {
        const expiringContracts = state.contracts.filter(c => {
          const end = new Date(c.endDate);
          const now = new Date();
          const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          const isSoonExpiring = diffDays <= 60 && diffDays >= 0;
          const isFilterMatch = matchesBuildingRoomTenant(c.roomId);
          return (isSoonExpiring || c.status === 'sắp hết hạn') && isFilterMatch;
        });

        const totalExpiring = expiringContracts.length;
        const totalDepositAmount = expiringContracts.reduce((s, c) => s + c.deposit, 0);

        const tableRows = expiringContracts.map(c => {
          const room = state.rooms.find(r => r.id === c.roomId);
          const tenant = state.tenants.find(t => t.id === c.representativeId);
          const end = new Date(c.endDate);
          const diffDays = Math.ceil((end.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          const daysLeft = diffDays >= 0 ? `${diffDays} ngày` : 'Đã quá hạn';
          return {
            id: c.id,
            roomName: room?.name || '---',
            tenantName: tenant?.fullName || 'Khách thuê',
            phone: tenant?.phone || 'Chưa có sdt',
            duration: `${c.startDate} đến ${c.endDate}`,
            price: c.price,
            deposit: c.deposit,
            endDate: c.endDate,
            daysLeft
          };
        });

        return {
          metrics: [
            { label: 'Hợp đồng sắp hết hạn (<60 ngày)', value: `${totalExpiring} hợp đồng`, alert: totalExpiring > 0 },
            { label: 'Bảo lưu tiền cọc thanh lý', value: `${totalDepositAmount.toLocaleString()} đ` },
          ],
          chart: null,
          tableHeaders: ['Mã hợp đồng', 'Phòng', 'Khách đại diện', 'Số điện thoại', 'Thời hạn thuê xe', 'Giá trị HĐ (đ)', 'Tiền đặt cọc (đ)', 'Ngày hết hạn', 'Số ngày còn lại'],
          tableData: tableRows,
          excelHeaders: ['Ma contracts', 'Phong', 'Khach hang', 'Phone', 'Thoi han', 'Muc gia', 'Tien dat coc', 'Ngay het han', 'Con lai'],
          excelRows: tableRows.map(r => [r.id, r.roomName, r.tenantName, r.phone, r.duration, r.price, r.deposit, r.endDate, r.daysLeft]),
          title: 'DANH SÁCH CÁC HỢP ĐỒNG THUÊ SẮP HẾT HẠN'
        };
      }

      case 'tenants': {
        const tenants = state.tenants.filter(t => 
          matchesBuildingRoomTenant(t.roomId, t.id) &&
          (rFilterStatus === 'all' || t.status === rFilterStatus)
        );

        const totalCount = tenants.length;
        const repsCount = tenants.filter(t => t.isRepresentative).length;
        const roommatesCount = totalCount - repsCount;

        const tableRows = tenants.map(t => {
          const room = state.rooms.find(r => r.id === t.roomId);
          return {
            id: t.id,
            fullName: t.fullName,
            roomName: room?.name || '---',
            phone: t.phone,
            idCard: t.idCard,
            hometown: t.hometown || 'Chưa cập nhật',
            job: t.job || 'Tự do',
            workplace: t.workplace || 'Chưa rõ',
            startDate: t.startDate,
            status: t.status,
            notes: t.isRepresentative ? 'Đứng tên hợp đồng' : 'Thành viên cùng phòng'
          };
        });

        return {
          metrics: [
            { label: 'Tổng số nhân cư lưu trú', value: `${totalCount} người` },
            { label: 'Chủ hộ hợp đồng (Đại diện)', value: `${repsCount} người` },
            { label: 'Số thành viên ở cùng', value: `${roommatesCount} người` },
          ],
          chart: null,
          tableHeaders: ['Họ và tên khách', 'Phòng ở', 'Điện thoại', 'Số CCCD', 'Quê quán', 'Nghề nghiệp', 'Nơi làm việc', 'Ngày dọn vào', 'Trạng thái', 'Nhân dạng diện'],
          tableData: tableRows,
          excelHeaders: ['Ho va ten', 'Phong', 'Dien thoai', 'So CCCD', 'Que quan', 'Cong viec', 'Noi lam viec', 'Ngay bat dau', 'Trang thai', 'Vai tro'],
          excelRows: tableRows.map(r => [r.fullName, r.roomName, r.phone, r.idCard, r.hometown, r.job, r.workplace, r.startDate, r.status, r.notes]),
          title: 'BÁO CÁO CHI TIẾT NHÂN KHẨU HỌC & TẠM TRÚ'
        };
      }

      case 'cashflow': {
        const txns = state.transactions.filter(t => 
          matchesDateFilter(t.date) && 
           (rFilterBuilding === 'all' || t.buildingId === rFilterBuilding) &&
          (rFilterRoom === 'all' || t.roomId === rFilterRoom)
        );

        const totalThu = txns.filter(t => t.type === 'thu').reduce((sum, t) => sum + t.amount, 0);
        const totalChi = txns.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);
        const totalDu = totalThu - totalChi;
        const ratio = totalThu > 0 ? (totalChi / totalThu) * 100 : 0;

        // Monthly data for chart
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const chartData = months.map(m => {
          const mTxns = state.transactions.filter(t => 
            t.date.startsWith(`${rFilterYear !== 'all' ? rFilterYear : '2026'}-${m}`) &&
            (rFilterBuilding === 'all' || t.buildingId === rFilterBuilding)
          );
          return {
            name: `T.${m}`,
            income: mTxns.filter(t => t.type === 'thu').reduce((s, t) => s + t.amount, 0),
            expense: mTxns.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0)
          };
        });

        const tableRows = txns.map(t => {
          const building = state.buildings.find(b => b.id === t.buildingId);
          const room = state.rooms.find(r => r.id === t.roomId);
          return {
            id: t.id,
            date: t.date,
            type: t.type,
            buildingName: building?.name || '---',
            roomName: room?.name ? `Phòng ${room.name}` : 'Chi nhánh chung',
            category: t.category,
            personName: t.personName || '---',
            amount: t.amount,
            method: t.paymentMethod,
            notes: t.notes
          };
        });

        return {
          metrics: [
            { label: 'Tổng số tiền đã thu', value: `${totalThu.toLocaleString()} đ`, color: 'text-green-600' },
            { label: 'Tổng số tiền đã chi', value: `${totalChi.toLocaleString()} đ`, color: 'text-red-650' },
            { label: 'Thặng dư ngân sách', value: `${totalDu.toLocaleString()} đ`, alert: totalDu < 0 },
            { label: 'Tỷ lệ Chi / Thu', value: `${ratio.toFixed(1)}%` },
          ],
          chart: <CashflowChart data={chartData} />,
          tableHeaders: ['Ngày GD', 'Mã GD', 'Loại', 'Thuộc khu', 'Áp dụng', 'Danh mục chuyên', 'Đối tác', 'Số tiền (đ)', 'Hình thức', 'Nội dung chi tiết'],
          tableData: tableRows,
          excelHeaders: ['Ngay', 'Ma GD', 'Loai', 'Khu vuc', 'Phong', 'Danh muc', 'Nguoi thuc hien', 'Gia tri', 'Hinh thuc', 'Ghi chu'],
          excelRows: tableRows.map(r => [r.date, r.id, r.type, r.buildingName, r.roomName, r.category, r.personName, r.amount, r.method, r.notes]),
          title: 'SỔ NHẬT KÝ THEO DÕI THU & CHI TỔNG QUỸ'
        };
      }

      case 'profit': {
        // Simple Profit per building
        const buildings = state.buildings.filter(b => rFilterBuilding === 'all' || b.id === rFilterBuilding);
        const chartMonths = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        
        const chartData = chartMonths.map(m => {
          const datePrefix = `${rFilterYear !== 'all' ? rFilterYear : '2026'}-${m}`;
          const mInvoices = state.invoices.filter(i => i.month === datePrefix);
          const incInvs = mInvoices.reduce((s, i) => s + i.paidAmount, 0);

          const mTxns = state.transactions.filter(t => t.date.startsWith(datePrefix));
          const extrasThu = mTxns.filter(t => t.type === 'thu' && t.category !== 'tiền nhà').reduce((s, t) => s + t.amount, 0);
          const activeExpenses = mTxns.filter(t => t.type === 'chi').reduce((s, t) => s + t.amount, 0);

          const mProfit = (incInvs + extrasThu) - activeExpenses;
          return { name: `T.${m}`, profit: mProfit };
        });

        // Compute metrics
        const relatedInvoices = state.invoices.filter(i => matchesDateFilter(i.month) && matchesBuildingRoomTenant(i.roomId));
        const collectedRevenue = relatedInvoices.reduce((sum, i) => sum + i.paidAmount, 0);
        
        const relatedTxns = state.transactions.filter(t => matchesDateFilter(t.date) && (rFilterBuilding === 'all' || t.buildingId === rFilterBuilding));
        const operatingExpenses = relatedTxns.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);

        const netProfit = collectedRevenue - operatingExpenses;
        const profitMargin = collectedRevenue > 0 ? (netProfit / collectedRevenue) * 100 : 0;

        const tableRows = buildings.map(b => {
          const bRooms = state.rooms.filter(r => r.buildingId === b.id);
          const bRoomIds = bRooms.map(r => r.id);
          
          const bInvs = state.invoices.filter(i => matchesDateFilter(i.month) && bRoomIds.includes(i.roomId));
          const incVal = bInvs.reduce((sum, i) => sum + i.paidAmount, 0);

          const bTxns = state.transactions.filter(t => matchesDateFilter(t.date) && t.buildingId === b.id);
          const expVal = bTxns.filter(t => t.type === 'chi').reduce((sum, t) => sum + t.amount, 0);
          const profitVal = incVal - expVal;
          const ratioVal = incVal > 0 ? (profitVal / incVal) * 100 : 0;

          return {
            id: b.id,
            buildingName: b.name,
            totalRooms: bRooms.length,
            revenue: incVal,
            expenses: expVal,
            netProfit: profitVal,
            margin: `${ratioVal.toFixed(1)}%`
          };
        });

        return {
          metrics: [
            { label: 'Doanh thu thu về', value: `${collectedRevenue.toLocaleString()} đ` },
            { label: 'Chi phí khấu hao / Vận hành', value: `${operatingExpenses.toLocaleString()} đ`, color: 'text-rose-650' },
            { label: 'Lợi nhuận tinh ròng', value: `${netProfit.toLocaleString()} đ`, color: 'text-emerald-700' },
            { label: 'Tỷ suất biên lợi nhuận', value: `${profitMargin.toFixed(1)}%` },
          ],
          chart: <ProfitChart data={chartData} />,
          tableHeaders: ['Tòa nhà / Chi nhánh', 'Quy mô phòng', 'Doanh thu thu hồi (đ)', 'Chi phí giải ngân (đ)', 'Lợi nhuận ròng (đ)', 'Biên sinh lời (%)'],
          tableData: tableRows,
          excelHeaders: ['Ten building', 'Quy mo', 'Doanh thu', 'Chi phi', 'Loi nhuan', 'Bien loi nhuan'],
          excelRows: tableRows.map(r => [r.buildingName, r.totalRooms, r.revenue, r.expenses, r.netProfit, r.margin]),
          title: 'PHÂN TÍCH HIỆU QUẢ HOẠT ĐỘNG VÀ BIÊN LỢI NHUẬN'
        };
      }

      case 'utilities': {
        // Derive power and water metrics based on active invoices
        const invoices = state.invoices.filter(i => 
          matchesDateFilter(i.month) && 
          matchesBuildingRoomTenant(i.roomId)
        );

        // Electric price average = 3500, Water average = 15000/person or block
        const totalElectricPowerSim = Math.round(invoices.reduce((s, i) => s + (i.electricFee), 0) / 3500);
        const totalElectricCost = invoices.reduce((s, i) => s + (i.electricFee), 0);
        
        const totalWaterVolSim = Math.round(invoices.reduce((s, i) => s + (i.waterFee), 0) / 15000);
        const totalWaterCost = invoices.reduce((s, i) => s + (i.waterFee), 0);

        const monthsStr = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const chartData = monthsStr.map(m => {
          const mInvoices = state.invoices.filter(i => 
            i.month === `${rFilterYear !== 'all' ? rFilterYear : '2026'}-${m}` &&
            matchesBuildingRoomTenant(i.roomId)
          );
          const eFee = mInvoices.reduce((s, i) => s + i.electricFee, 0);
          const wFee = mInvoices.reduce((s, i) => s + i.waterFee, 0);
          return {
            name: `T.${m}`,
            electric: Math.round(eFee / 3500),
            water: Math.round(wFee / 15000)
          };
        });

        const tableRows = invoices.map(i => {
          const room = state.rooms.find(r => r.id === i.roomId);
          const eUsage = Math.round(i.electricFee / 3500);
          const wUsage = Math.round(i.waterFee / 15000);
          return {
            id: i.id,
            roomName: room?.name || '---',
            month: i.month,
            electricUsage: `${eUsage} kWh`,
            electricFee: i.electricFee,
            waterUsage: `${wUsage} m³`,
            waterFee: i.waterFee,
            totalFee: i.electricFee + i.waterFee
          };
        });

        return {
          metrics: [
            { label: 'Tổng điện tiêu thụ', value: `${totalElectricPowerSim.toLocaleString()} kWh` },
            { label: 'Thành tiền điện', value: `${totalElectricCost.toLocaleString()} đ` },
            { label: 'Tổng nước sử dụng', value: `${totalWaterVolSim.toLocaleString()} m³` },
            { label: 'Thành tiền nước', value: `${totalWaterCost.toLocaleString()} đ` },
          ],
          chart: <UtilityChart data={chartData} />,
          tableHeaders: ['Phòng', 'Tháng thống kê', 'Điện năng tiêu thụ', 'Tiền điện (đ)', 'Khối lượng nước', 'Tiền nước (đ)', 'Tổng chi phí dịch vụ'],
          tableData: tableRows,
          excelHeaders: ['Phong', 'Thang', 'Dien (KWh)', 'Tien dien', 'Nuoc (m3)', 'Tien nuoc', 'Tong dich vu'],
          excelRows: tableRows.map(r => [r.roomName, r.month, r.electricUsage, r.electricFee, r.waterUsage, r.waterFee, r.totalFee]),
          title: 'BÁO CÁO KÊ KHAI TIÊU THỤ ĐIỆN NƯỚC'
        };
      }

      case 'repairs': {
        const repairs = state.maintenances.filter(m => 
          (rFilterBuilding === 'all' || rFilterBuilding && state.rooms.find(r => r.id === m.roomId)?.buildingId === rFilterBuilding) &&
          (rFilterRoom === 'all' || m.roomId === rFilterRoom) &&
          (rFilterStatus === 'all' || m.status === rFilterStatus)
        );

        const totalSpent = repairs.reduce((s, m) => s + m.cost, 0);
        const incidentsCount = repairs.length;
        const resolvedCount = repairs.filter(m => m.status === 'hoàn thành').length;
        const solvedRate = incidentsCount > 0 ? (resolvedCount / incidentsCount) * 100 : 100;

        const tableRows = repairs.map(m => {
          const room = state.rooms.find(r => r.id === m.roomId);
          return {
            id: m.id,
            roomName: room?.name || '---',
            reporter: m.reporterName,
            type: m.type,
            priority: m.priority,
            reportDate: m.reportDate,
            handler: m.handlerName || 'Chưa điều phối',
            cost: m.cost,
            status: m.status
          };
        });

        return {
          metrics: [
            { label: 'Tổng chi giải ngân sửa chữa', value: `${totalSpent.toLocaleString()} đ`, color: 'text-amber-850', alert: totalSpent > 5000000 },
            { label: 'Lượt sự cố tiếp nhận', value: `${incidentsCount} vụ việc` },
            { label: 'Số trường hợp khắc phục', value: `${resolvedCount} vụ` },
            { label: 'Tỷ lệ xử lý sự cố', value: `${solvedRate.toFixed(1)}%` },
          ],
          chart: null,
          tableHeaders: ['Vị trí phòng', 'Mục sự cố', 'Phân loại', 'Mức độ', 'Khách báo tin', 'Điều thợ sửa', 'Ngày tiếp nhận', 'Bảng giá thanh toán (đ)', 'Hiện trạng'],
          tableData: tableRows,
          excelHeaders: ['Phong', 'Su co', 'Phan loai', 'Uu tien', 'Reporter', 'Handler', 'Ngay bao', 'Chi phi', 'Trang thai'],
          excelRows: tableRows.map(r => [r.roomName, r.reporter, r.type, r.priority, r.reporter, r.handler, r.reportDate, r.cost, r.status]),
          title: 'BÁO CÁO PHÂN TÍCH SỬA CHỮA & PHÁT SINH BẢO TRÌ'
        };
      }

      default:
        return null;
    }
  }, [
    activeReportId, state.invoices, state.rooms, state.tenants, state.contracts, 
    state.transactions, state.maintenances, rFilterMonth, rFilterQuarter, 
    rFilterYear, rFilterBuilding, rFilterRoom, rFilterStatus, rFilterTenant
  ]);

  // Handle columns sorting inside active report list
  const processedReportTableData = useMemo(() => {
    if (!reportDataResult || !reportDataResult.tableData) return [];
    let items = [...reportDataResult.tableData];

    if (reportSortColumn) {
      items.sort((a: any, b: any) => {
        let valA = a[reportSortColumn];
        let valB = b[reportSortColumn];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return reportSortOrder === 'asc' 
            ? valA.localeCompare(valB, 'vi') 
            : valB.localeCompare(valA, 'vi');
        }

        if (valA < valB) return reportSortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return reportSortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return items;
  }, [reportDataResult, reportSortColumn, reportSortOrder]);

  // Paginate report lists
  const paginatedReportRows = useMemo(() => {
    const start = (reportPageCurrent - 1) * reportRecordsPerPage;
    return processedReportTableData.slice(start, start + reportRecordsPerPage);
  }, [processedReportTableData, reportPageCurrent]);

  const totalReportPages = Math.ceil(processedReportTableData.length / reportRecordsPerPage) || 1;

  const triggerSortReportTable = (headerKey: string) => {
    // Map human Vietnamese headers to object properties safely
    const mappings: { [key: string]: string } = {
      'Phiếu': 'id',
      'Phòng trọ': 'roomName',
      'Tháng': 'month',
      'Đối tượng đóng': 'tenantName',
      'Tổng thu hoạch (đ)': 'totalAmount',
      'Đã thu (đ)': 'paidAmount',
      'Còn nợ (đ)': 'debtAmount',
      'Trạng thái': 'status',
      'Phiếu nợ': 'id',
      'Phòng': 'roomName',
      'Họ tên': 'tenantName',
      'Tiền nợ lại (đ)': 'debtAmount',
      'Tên phòng': 'roomName',
      'Giá cơ sở (đ)': 'basePrice',
      'Trạng trạng thái': 'status',
      'Phòng trọ ': 'roomName',
      'Giá cho thuê (đ)': 'basePrice',
      'Mã hợp đồng': 'id',
      'Khách đại diện': 'tenantName',
      'Tiền đặt cọc (đ)': 'deposit',
      'Họ và tên khách': 'fullName',
      'Phòng ở': 'roomName',
      'Mã GD': 'id',
      'Số tiền (đ)': 'amount',
      'Ngày GD': 'date',
      'Thuộc khu': 'buildingName',
      'Doanh thu thu hồi (đ)': 'revenue',
      'Chi phí giải ngân (đ)': 'expenses',
      'Lợi nhuận ròng (đ)': 'netProfit',
      'Tiền điện (đ)': 'electricFee',
      'Tiền nước (đ)': 'waterFee',
      'Vị trí phòng': 'roomName',
      'Bảng giá thanh toán (đ)': 'cost',
      'Hiện trạng': 'status'
    };

    const targetKey = mappings[headerKey];
    if (!targetKey) return;

    if (reportSortColumn === targetKey) {
      setReportSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setReportSortColumn(targetKey);
      setReportSortOrder('desc');
    }
    setReportPageCurrent(1);
  };

  const handleDownloadExcel = () => {
    if (!reportDataResult) return;
    const { excelHeaders, excelRows, title } = reportDataResult;
    exportToCSV(excelHeaders, excelRows, `${activeReportId}_report_${Date.now()}`);
  };

  const handleTriggerPrintView = () => {
    if (!reportDataResult) return;
    const { title, metrics, tableHeaders } = reportDataResult;
    
    // Construct simple clean HTML table string
    let tableHtml = `<table class="report-table"><thead><tr>`;
    tableHeaders.forEach(th => {
      tableHtml += `<th>${th}</th>`;
    });
    tableHtml += `</tr></thead><tbody>`;

    processedReportTableData.forEach((row: any) => {
      tableHtml += `<tr>`;
      // Extract properties based on report type
      if (activeReportId === 'revenue') {
        tableHtml += `
          <td>${row.id}</td>
          <td>${row.roomName}</td>
          <td>${row.month}</td>
          <td>${row.tenantName}</td>
          <td class="text-right font-bold">${row.totalAmount.toLocaleString()}</td>
          <td class="text-right text-green-600 font-bold">${row.paidAmount.toLocaleString()}</td>
          <td class="text-right text-red-600 font-bold">${row.debtAmount.toLocaleString()}</td>
          <td>${row.dueDate}</td>
          <td><span class="${row.status === 'đã thu đủ' ? 'badge-paid' : 'badge-unpaid'}">${row.status}</span></td>
        `;
      } else if (activeReportId === 'debt') {
        tableHtml += `
          <td>${row.id}</td>
          <td>${row.roomName}</td>
          <td>${row.month}</td>
          <td>${row.tenantName}</td>
          <td>${row.phone}</td>
          <td class="text-right">${row.totalAmount.toLocaleString()}</td>
          <td class="text-right text-red-650 font-bold">${row.debtAmount.toLocaleString()}</td>
          <td>${row.dueDate}</td>
          <td>${row.debtNotes}</td>
        `;
      } else if (activeReportId === 'occupancy') {
        tableHtml += `
          <td>${row.buildingName}</td>
          <td>${row.roomName}</td>
          <td class="text-center">${row.area}</td>
          <td>${row.type}</td>
          <td class="text-right font-bold">${row.basePrice.toLocaleString()}</td>
          <td>${row.status}</td>
          <td class="text-center">${row.maxOccupants}</td>
          <td class="text-center">${row.assetsCount}</td>
        `;
      } else if (activeReportId === 'vacant') {
        tableHtml += `
          <td>${row.buildingName}</td>
          <td>${row.roomName}</td>
          <td class="text-center">${row.floor}</td>
          <td class="text-center">${row.area}</td>
          <td>${row.type}</td>
          <td class="text-right text-amber-700 font-bold">${row.basePrice.toLocaleString()}</td>
          <td>${row.furniture}</td>
          <td>${row.notes}</td>
        `;
      } else if (activeReportId === 'expiring') {
        tableHtml += `
          <td>${row.id}</td>
          <td>${row.roomName}</td>
          <td>${row.tenantName}</td>
          <td>${row.phone}</td>
          <td>${row.duration}</td>
          <td class="text-right">${row.price.toLocaleString()}</td>
          <td class="text-right">${row.deposit.toLocaleString()}</td>
          <td>${row.endDate}</td>
          <td class="font-bold text-red-600">${row.daysLeft}</td>
        `;
      } else if (activeReportId === 'tenants') {
        tableHtml += `
          <td>${row.fullName}</td>
          <td>${row.roomName}</td>
          <td>${row.phone}</td>
          <td>${row.idCard}</td>
          <td>${row.hometown}</td>
          <td>${row.job}</td>
          <td>${row.workplace}</td>
          <td>${row.startDate}</td>
          <td>${row.status}</td>
          <td>${row.notes}</td>
        `;
      } else if (activeReportId === 'cashflow') {
        tableHtml += `
          <td>${row.date}</td>
          <td>${row.id}</td>
          <td><span class="${row.type === 'thu' ? 'badge-paid' : 'badge-unpaid'}">${row.type.toUpperCase()}</span></td>
          <td>${row.buildingName}</td>
          <td>${row.roomName}</td>
          <td>${row.category}</td>
          <td>${row.personName}</td>
          <td class="text-right font-bold">${row.amount.toLocaleString()}</td>
          <td>${row.method}</td>
          <td>${row.notes}</td>
        `;
      } else if (activeReportId === 'profit') {
        tableHtml += `
          <td>${row.buildingName}</td>
          <td class="text-center">${row.totalRooms}</td>
          <td class="text-right text-green-600">${row.revenue.toLocaleString()}</td>
          <td class="text-right text-red-600">${row.expenses.toLocaleString()}</td>
          <td class="text-right text-emerald-700 font-bold">${row.netProfit.toLocaleString()}</td>
          <td class="text-center font-bold">${row.margin}</td>
        `;
      } else if (activeReportId === 'utilities') {
        tableHtml += `
          <td>${row.roomName}</td>
          <td>${row.month}</td>
          <td>${row.electricUsage}</td>
          <td class="text-right">${row.electricFee.toLocaleString()}</td>
          <td>${row.waterUsage}</td>
          <td class="text-right">${row.waterFee.toLocaleString()}</td>
          <td class="text-right font-bold">${row.totalFee.toLocaleString()}</td>
        `;
      } else if (activeReportId === 'repairs') {
        tableHtml += `
          <td>${row.roomName}</td>
          <td>${row.reporter}</td>
          <td>${row.type}</td>
          <td>${row.priority}</td>
          <td>${row.reporter}</td>
          <td>${row.handler}</td>
          <td>${row.reportDate}</td>
          <td class="text-right text-rose-700 font-bold">${row.cost.toLocaleString()}</td>
          <td>${row.status}</td>
        `;
      }
      tableHtml += `</tr>`;
    });

    tableHtml += `</tbody></table>`;

    const mappedMetrics = metrics.map(m => ({ label: m.label, value: m.value }));
    exportToPDF(title, tableHtml, mappedMetrics);
  };

  return (
    <div className="space-y-6">
      
      {/* Header section with tabs selector and create ledger CTA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" /> Sổ Sách Tài Chính & Hệ Thống Báo Cáo
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-medium">
            Quản lý ghi chép doanh thu thực tế, hóa đơn đôn đốc, công nợ lũy kế và theo dõi 10 biểu mẫu phân tích tổng quan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
            <TabsList className="bg-slate-100 p-1.5 rounded-xl border border-slate-200">
              <TabsTrigger value="transactions" className="rounded-lg text-xs font-bold px-4 py-1.5">
                Nhật Ký Giao Dịch
              </TabsTrigger>
              <TabsTrigger value="reports" className="rounded-lg text-xs font-bold px-4 py-1.5">
                Thống Kê Báo Cáo (10)
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeTab === 'transactions' && (
            <Button onClick={() => setIsFormOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold h-9 px-4 rounded-xl shadow-sm cursor-pointer shrink-0">
              <PlusCircle className="w-4 h-4 mr-2" /> Ghi giao dịch phát sinh
            </Button>
          )}
        </div>
      </div>

      {/* ==========================================
          TAB CONTENT 1: TRANSACTION JOURNAL
          ========================================== */}
      {activeTab === 'transactions' && (
        <div className="space-y-5">
          {/* Quick metric widgets matching the ledger filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Card className="bg-gradient-to-br from-indigo-550 to-indigo-650 text-white border-none shadow-sm relative overflow-hidden ring-4 ring-indigo-50">
              <span className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <CardContent className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-wider">Tổng Thu Cho Phép (để lọc)</p>
                  <h3 className="text-2xl font-black mt-2">{txnSummary.income.toLocaleString()} ₫</h3>
                  <div className="mt-3 text-[10px] text-indigo-150 flex items-center gap-1 font-medium">
                    <ArrowUpRight className="w-3 h-3 text-indigo-200" /> Tất cả dòng thu trong chu kỳ lọc
                  </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-5 h-5 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white border-none shadow-sm relative overflow-hidden ring-4 ring-rose-50">
              <span className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <CardContent className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-rose-100 text-[10px] font-black uppercase tracking-wider">Tổng Giải Ngân Chi (để lọc)</p>
                  <h3 className="text-2xl font-black mt-2">{txnSummary.expense.toLocaleString()} ₫</h3>
                  <div className="mt-3 text-[10px] text-rose-150 flex items-center gap-1 font-medium">
                    <ArrowDownRight className="w-3 h-3 text-rose-200" /> Các khoản hóa đơn & phí kỹ sư
                  </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-5 h-5 text-white" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-sm relative overflow-hidden ring-4 ring-emerald-50">
              <span className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full" />
              <CardContent className="p-5 flex justify-between items-start">
                <div>
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-wider">Quỹ Dư Thặng Dư (để lọc)</p>
                  <h3 className="text-2xl font-black mt-2">{txnSummary.profit.toLocaleString()} ₫</h3>
                  <div className="mt-3 text-[10px] text-emerald-150 flex items-center gap-1 font-medium">
                    <Wallet className="w-3 h-3 text-emerald-250" /> {txnSummary.profit >= 0 ? 'Dòng vốn dương an toàn' : 'Dòng vốn âm cảnh báo'}
                  </div>
                </div>
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtering and Paginated List Table */}
          <Card className="border-slate-200/90 shadow-xs">
            <CardHeader className="p-4 bg-slate-50 border-b flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chọn kỳ thống kê</span>
                  <Input type="month" value={txnFilterMonth} onChange={e => { setTxnFilterMonth(e.target.value); setTxnPage(1); }} className="w-[150px] h-9 text-xs" />
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phân loại</span>
                  <select 
                    value={txnTypeFilter} 
                    onChange={e => { setTxnTypeFilter(e.target.value as any); setTxnPage(1); }}
                    className="h-9 px-3 text-xs border rounded-lg focus:ring-1 focus:ring-indigo-500 bg-white border-slate-200 text-slate-700 min-w-[120px]"
                  >
                    <option value="all">Tất cả giao dịch</option>
                    <option value="thu">Chỉ các khoản Thu</option>
                    <option value="chi">Chỉ các khoản Chi</option>
                  </select>
                </div>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input 
                  placeholder="Tìm theo nội dung, tên khách..." 
                  className="pl-8 text-xs h-9" 
                  value={txnSearch} 
                  onChange={e => { setTxnSearch(e.target.value); setTxnPage(1); }} 
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left min-w-[800px]">
                  <thead className="bg-slate-100/80 text-slate-550 uppercase text-[10px] font-bold border-b">
                    <tr>
                      <th className="px-4 py-3 cursor-pointer hover:bg-slate-150 transition-colors" onClick={() => toggleTxnSort('date')}>
                        Ngày thực hiện <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-400" />
                      </th>
                      <th className="px-4 py-3">Loại quỹ</th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-slate-150 transition-colors" onClick={() => toggleTxnSort('category')}>
                        Danh mục <ArrowUpDown className="w-3 h-3 inline ml-1 text-slate-400" />
                      </th>
                      <th className="px-4 py-3 cursor-pointer hover:bg-slate-150 transition-colors flex items-center justify-between" onClick={() => toggleTxnSort('amount')}>
                        <span>Số tiền giao dịch (₫)</span> <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </th>
                      <th className="px-4 py-3">Bên liên quan (Đối tượng)</th>
                      <th className="px-4 py-3">Ghi chú & Nhật trình</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTxns.map(txn => {
                      const isThu = txn.type === 'thu';
                      const room = state.rooms.find(r => r.id === txn.roomId);
                      return (
                        <tr key={txn.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors text-slate-700">
                          <td className="px-4 py-3 font-semibold whitespace-nowrap">{txn.date}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={isThu ? 'bg-green-100 text-green-700 hover:bg-green-100 font-bold border-green-200 rounded' : 'bg-rose-100 text-rose-700 hover:bg-rose-100 font-bold border-rose-200 rounded'}>
                              {isThu ? 'KHOẢN THU' : 'KHOẢN CHI'}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 capitalize font-medium">{txn.category}</td>
                          <td className={`px-4 py-3 font-extrabold text-sm whitespace-nowrap ${isThu ? 'text-green-600' : 'text-rose-600'}`}>
                            {isThu ? '+' : '-'}{txn.amount.toLocaleString()} đ
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            <div>{txn.personName}</div>
                            {room && <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1 rounded">Phòng {room.name}</span>}
                          </td>
                          <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={txn.notes}>{txn.notes || '---'}</td>
                        </tr>
                      );
                    })}
                    {paginatedTxns.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                          <Info className="w-6 h-6 mx-auto text-slate-350 mb-2" />
                          Không tìm thấy bất kỳ giao dịch phát sinh nào khớp với bộ lọc đã chọn.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination bar */}
              {processedTxns.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3.5 border-t bg-slate-50/70 select-none">
                  <span className="text-slate-450 text-[11px] font-semibold">
                    Hiển thị <span className="text-slate-700">{(txnPage - 1) * txnItemsPerPage + 1} - {Math.min(txnPage * txnItemsPerPage, processedTxns.length)}</span> trong tổng số <span className="text-slate-700">{processedTxns.length}</span> giao dịch
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setTxnPage(p => Math.max(p - 1, 1))}
                      disabled={txnPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: totalTxnPages }).map((_, idx) => (
                      <Button
                        key={idx}
                        variant={txnPage === idx + 1 ? 'default' : 'outline'}
                        size="sm"
                        className={`h-7 w-7 rounded-lg text-xs font-bold ${txnPage === idx + 1 ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                        onClick={() => setTxnPage(idx + 1)}
                      >
                        {idx + 1}
                      </Button>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 w-7 p-0 rounded-lg"
                      onClick={() => setTxnPage(p => Math.min(p + 1, totalTxnPages))}
                      disabled={txnPage === totalTxnPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==========================================
          TAB CONTENT 2: SYSTEM 10 FULL REPORTS ENGINE
          ========================================== */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {/* COMMON REPORT FILTERS BLOCK */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs uppercase font-extrabold text-slate-400 tracking-widest flex items-center gap-1">
              Thanh bộ lọc hợp lưu toàn 10 loại báo cáo
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
              
              {/* Year */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Năm biểu:</label>
                <select 
                  value={rFilterYear} 
                  onChange={e => setrFilterYear(e.target.value)}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                >
                  <option value="all">Tất cả năm</option>
                  <option value="2026">Năm 2026</option>
                  <option value="2025">Năm 2025</option>
                  <option value="2024">Năm 2024</option>
                </select>
              </div>

              {/* Quarter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Quý niên hóa:</label>
                <select 
                  value={rFilterQuarter} 
                  onChange={e => { setrFilterQuarter(e.target.value); setrFilterMonth('all'); }}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                >
                  <option value="all">Tất cả Quý</option>
                  <option value="Q1">Quý 1 (T1-T3)</option>
                  <option value="Q2">Quý 2 (T4-T6)</option>
                  <option value="Q3">Quý 3 (T7-T9)</option>
                  <option value="Q4">Quý 4 (T10-T12)</option>
                </select>
              </div>

              {/* Month */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Tháng chu kỳ:</label>
                <select 
                  value={rFilterMonth} 
                  disabled={rFilterQuarter !== 'all'}
                  onChange={e => setrFilterMonth(e.target.value)}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800 disabled:opacity-50"
                >
                  <option value="all">Tất cả Tháng</option>
                  {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => (
                    <option key={m} value={m}>Tháng {parseInt(m)}</option>
                  ))}
                </select>
              </div>

              {/* Building */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Khu nhà trọ:</label>
                <select 
                  value={rFilterBuilding} 
                  onChange={e => { setrFilterBuilding(e.target.value); setrFilterRoom('all'); }}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                >
                  <option value="all">Tất cả Khu</option>
                  {state.buildings.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Room */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Phòng cụ thể:</label>
                <select 
                  value={rFilterRoom} 
                  onChange={e => setrFilterRoom(e.target.value)}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                >
                  <option value="all">Tất cả phòng</option>
                  {visibleRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({state.buildings.find(b => b.id === r.buildingId)?.name || '---'})</option>
                  ))}
                </select>
              </div>

              {/* Tenant */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Bên đứng HĐ:</label>
                <select 
                  value={rFilterTenant} 
                  onChange={e => setrFilterTenant(e.target.value)}
                  className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                >
                  <option value="all">Tất cả khách</option>
                  {state.tenants.filter(t => t.isRepresentative).map(t => (
                    <option key={t.id} value={t.id}>{t.fullName} ({t.phone})</option>
                  ))}
                </select>
              </div>

              {/* Dynamic Status adaptation */}
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Trạng thái lọc:</label>
                {['revenue', 'debt'].includes(activeReportId) ? (
                  <select value={rFilterStatus} onChange={e => setrFilterStatus(e.target.value)} className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800">
                    <option value="all">Tất cả phiếu</option>
                    <option value="đã thu đủ">Đã thu đủ</option>
                    <option value="chưa thu">Chưa đóng</option>
                    <option value="thu một phần">Đóng một phần</option>
                    <option value="quá hạn">Bị Quá Hạn</option>
                  </select>
                ) : ['occupancy', 'vacant'].includes(activeReportId) ? (
                  <select value={rFilterStatus} onChange={e => setrFilterStatus(e.target.value)} className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800">
                    <option value="all">Tất cả phòng</option>
                    <option value="trống">Trống</option>
                    <option value="đang thuê">Đang thuê</option>
                    <option value="đặt cọc">Đặt cọc</option>
                    <option value="đang sửa">Đang bảo dưỡng và sửa</option>
                  </select>
                ) : activeReportId === 'tenants' ? (
                  <select value={rFilterStatus} onChange={e => setrFilterStatus(e.target.value)} className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800">
                    <option value="all">Mọi trạng thái</option>
                    <option value="đang thuê">Đang ở thực tế</option>
                    <option value="đã rời đi">Đã chuyển đi</option>
                    <option value="theo dõi">Danh sách đen</option>
                  </select>
                ) : activeReportId === 'repairs' ? (
                  <select value={rFilterStatus} onChange={e => setrFilterStatus(e.target.value)} className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800">
                    <option value="all">Tất cả sự cố</option>
                    <option value="mới tạo">Mới báo cáo</option>
                    <option value="đang xử lý">Đang sửa chữa</option>
                    <option value="hoàn thành">Đã xử lý xong</option>
                    <option value="hủy">Đã hủy bỏ</option>
                  </select>
                ) : (
                  <div className="h-9 px-2 text-xs border rounded-lg bg-slate-50 border-slate-200 flex items-center text-slate-400 font-medium select-none">Not Applicable</div>
                )}
              </div>

            </div>
          </div>

          {/* MAIN GRID: 10-REPORTS SWITCHBOARD (Left) & INTERACTIVE INSPECT PANEL (Right) */}
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left selector menu of 10 reports */}
            <div className="w-full lg:w-[280px] shrink-0 space-y-4 select-none">
              
              {/* Premium AI Analytics Banner */}
              <div className="bg-gradient-to-br from-blue-900 to-indigo-800 rounded-2xl p-4 text-white shadow-xs border border-blue-700/50 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 text-yellow-300">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <h5 className="text-[11px] font-black uppercase tracking-wider text-blue-100">Trợ Lý Phân Tích AI</h5>
                </div>
                <p className="text-[11px] text-blue-200 font-medium leading-relaxed">
                  Đánh giá thông minh tỷ lệ lấp đầy, doanh thu & chi phí thực tế. Chỉ ra phòng kém hiệu quả và đề xuất tăng giá dốc/tiếp thị!
                </p>
                <button 
                  onClick={() => navigate('/ai-assistant')}
                  className="w-full h-8.5 bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-extrabold text-[11px] rounded-lg border-none cursor-pointer flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  Khởi chạy AI Analytics <ArrowUpRight className="w-3.5 h-3.5 text-slate-900" />
                </button>
              </div>

              <div className="space-y-2">
                <h5 className="text-[10px] uppercase font-extrabold text-slate-450 px-2 tracking-widest">Danh mục 10 báo cáo</h5>
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-1 gap-1">
                {REPORTS.map((r) => {
                  const isActive = activeReportId === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setActiveReportId(r.id); }}
                      className={`text-left p-2.5 rounded-xl border flex items-center gap-3 transition-all cursor-pointer group ${
                        isActive 
                          ? 'bg-indigo-650 border-indigo-700 text-white shadow-sm font-bold scale-[1.01]' 
                          : 'bg-white border-slate-200/80 hover:bg-slate-50 text-slate-600 hover:text-slate-900 group'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors'
                      }`}>
                        <r.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold leading-none block truncate">{r.name}</span>
                        <span className={`text-[9px] mt-0.5 block truncate leading-none ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>{r.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
             </div>
            </div>

            {/* Right inspection report details layout */}
            <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0 flex flex-col justify-between">
              
              {reportDataResult && (
                <div className="space-y-6">
                  {/* Dynamic Report Content Title & Downloaders Row */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-150">
                    <div>
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 rounded text-[9px] font-extrabold uppercase tracking-widest mb-1.5">Mẫu trích xuất chuyên sâu</Badge>
                      <h3 className="text-lg font-black text-slate-900">{reportDataResult.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs font-bold border-slate-300 hover:bg-slate-50 shadow-xs cursor-pointer"
                        onClick={handleDownloadExcel}
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Xuất Excel (.csv)
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-8 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                        onClick={handleTriggerPrintView}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1.5 text-emerald-450" /> In / PDF
                      </Button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {reportDataResult.metrics.map((m: any, index: number) => (
                      <div key={index} className={`p-4 border rounded-xl bg-slate-50/50 flex flex-col justify-between ${m.alert ? 'border-rose-300 bg-rose-50/30' : 'border-slate-150'}`}>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sans">{m.label}</span>
                        <span className={`text-base font-extrabold mt-1 leading-none ${m.color || (m.alert ? 'text-red-650' : 'text-slate-800')}`}>{m.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Operational Recharts Chart Container (If available) */}
                  {reportDataResult.chart && (
                    <div className="border border-slate-200 p-4 rounded-xl bg-slate-50/20">
                      <h4 className="text-[11px] uppercase font-black text-slate-400 mb-3 tracking-widest font-sans">Biểu đồ biểu diễn trực quan</h4>
                      {reportDataResult.chart}
                    </div>
                  )}

                  {/* Table Segment detailing dataset */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-lg border border-slate-150 select-none">
                      <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-wider flex items-center gap-1">
                        Dòng dữ liệu kiểm kê ({processedReportTableData.length} kết quả)
                      </h4>
                      <span className="text-[9px] text-slate-450 font-bold">Hãy click vào tiêu đề cột để sắp xếp</span>
                    </div>

                    <div className="overflow-x-auto border rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-550 uppercase text-[9px] font-extrabold border-b select-none">
                          <tr>
                            {reportDataResult.tableHeaders.map((th: string, i: number) => (
                              <th 
                                key={i} 
                                className="px-3 py-2.5 cursor-pointer hover:bg-slate-200 transition-colors"
                                onClick={() => triggerSortReportTable(th)}
                              >
                                <span className="flex items-center gap-1">
                                  {th} <ArrowUpDown className="w-2.5 h-2.5 text-slate-400" />
                                </span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedReportRows.map((row: any, rIdx: number) => (
                            <tr key={row.id || rIdx} className="border-b last:border-0 hover:bg-slate-50/40 transition-colors text-slate-650 font-medium">
                              {/* RENDER CUSTOMIZED REPORT FIELDS IN TABLE ROW ENVELOPE */}

                              {activeReportId === 'revenue' && (
                                <>
                                  <td className="px-3 py-2.5 font-bold font-mono">{row.id}</td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-900">{row.roomName}</td>
                                  <td className="px-3 py-2.5">{row.month}</td>
                                  <td className="px-3 py-2.5 font-bold">{row.tenantName}</td>
                                  <td className="px-3 py-2.5 font-extrabold text-slate-800 text-right">{row.totalAmount.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-extrabold text-green-600 text-right">{row.paidAmount.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-extrabold text-red-600 text-right">{row.debtAmount.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">{row.dueDate}</td>
                                  <td className="px-3 py-2.5">
                                    <Badge className={
                                      row.status === 'đã thu đủ' ? 'bg-green-100 text-green-700 hover:bg-green-100 font-bold border-green-200 rounded' :
                                      row.status === 'chưa thu' ? 'bg-red-105 text-red-700 hover:bg-red-105 font-bold border-red-200 rounded' : 'bg-amber-100 text-amber-700 hover:bg-amber-100 font-bold rounded'
                                    }>
                                      {row.status}
                                    </Badge>
                                  </td>
                                </>
                              )}

                              {activeReportId === 'debt' && (
                                <>
                                  <td className="px-3 py-2.5 font-bold font-mono">{row.id}</td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-900">{row.roomName}</td>
                                  <td className="px-3 py-2.5">{row.month}</td>
                                  <td className="px-3 py-2.5 font-bold">{row.tenantName}</td>
                                  <td className="px-3 py-2.5">{row.phone}</td>
                                  <td className="px-3 py-2.5 font-bold text-right">{row.totalAmount.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-extrabold text-red-600 text-right">{row.debtAmount.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 text-center whitespace-nowrap">{row.dueDate}</td>
                                  <td className="px-3 py-2.5 italic text-[11px] text-slate-450">{row.debtNotes}</td>
                                </>
                              )}

                              {activeReportId === 'occupancy' && (
                                <>
                                  <td className="px-3 py-2.5">{row.buildingName}</td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-900">{row.roomName}</td>
                                  <td className="px-3 py-2.5 text-center font-bold">{row.area}</td>
                                  <td className="px-3 py-2.5 capitalize">{row.type}</td>
                                  <td className="px-3 py-2.5 font-bold text-slate-800 text-right">{row.basePrice.toLocaleString()}</td>
                                  <td className="px-3 py-2.5">
                                    <Badge className={row.status === 'đang thuê' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-slate-200 text-slate-700'}>{row.status}</Badge>
                                  </td>
                                  <td className="px-3 py-2.5 text-center font-semibold">{row.maxOccupants}</td>
                                  <td className="px-3 py-2.5 text-center font-bold text-slate-500">{row.assetsCount} món</td>
                                </>
                              )}

                              {activeReportId === 'vacant' && (
                                <>
                                  <td className="px-3 py-2.5">{row.buildingName}</td>
                                  <td className="px-3 py-2.5 font-semibold text-indigo-700">{row.roomName}</td>
                                  <td className="px-3 py-2.5 text-center font-bold">Tầng {row.floor}</td>
                                  <td className="px-3 py-2.5 text-center font-bold">{row.area}</td>
                                  <td className="px-3 py-2.5 capitalize">{row.type}</td>
                                  <td className="px-3 py-2.5 font-extrabold text-slate-950 text-right">{row.basePrice.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 text-slate-500 italic max-w-[120px] truncate">{row.furniture}</td>
                                  <td className="px-3 py-2.5 text-slate-450 text-[11px]">{row.notes}</td>
                                </>
                              )}

                              {activeReportId === 'expiring' && (
                                <>
                                  <td className="px-3 py-2.5 font-bold font-mono">{row.id}</td>
                                  <td className="px-3 py-2.5 font-semibold">{row.roomName}</td>
                                  <td className="px-3 py-2.5 font-bold text-slate-900">{row.tenantName}</td>
                                  <td className="px-3 py-2.5">{row.phone}</td>
                                  <td className="px-3 py-2.5 text-slate-500">{row.duration}</td>
                                  <td className="px-3 py-2.5 font-bold text-right">{row.price.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-bold text-right">{row.deposit.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-bold whitespace-nowrap">{row.endDate}</td>
                                  <td className="px-3 py-2.5 text-rose-650 font-black whitespace-nowrap">{row.daysLeft}</td>
                                </>
                              )}

                              {activeReportId === 'tenants' && (
                                <>
                                  <td className="px-3 py-2.5 text-slate-900 font-extrabold">{row.fullName}</td>
                                  <td className="px-3 py-2.5 font-semibold text-indigo-700">{row.roomName}</td>
                                  <td className="px-3 py-2.5 font-bold">{row.phone}</td>
                                  <td className="px-3 py-2.5 font-mono">{row.idCard}</td>
                                  <td className="px-3 py-2.5">{row.hometown}</td>
                                  <td className="px-3 py-2.5">{row.job}</td>
                                  <td className="px-3 py-2.5 max-w-[100px] truncate">{row.workplace}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">{row.startDate}</td>
                                  <td className="px-3 py-2.5 capitalize"><Badge variant="outline">{row.status}</Badge></td>
                                  <td className="px-3 py-2.5 text-slate-400 italic text-[11px] leading-normal">{row.notes}</td>
                                </>
                              )}

                              {activeReportId === 'cashflow' && (
                                <>
                                  <td className="px-3 py-2.5 font-bold whitespace-nowrap">{row.date}</td>
                                  <td className="px-3 py-2.5 font-mono">{row.id.substring(0, 10)}</td>
                                  <td className="px-3 py-2.5">
                                    <Badge className={row.type === 'thu' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                      {row.type.toUpperCase()}
                                    </Badge>
                                  </td>
                                  <td className="px-3 py-2.5">{row.buildingName}</td>
                                  <td className="px-3 py-2.5 font-bold">{row.roomName}</td>
                                  <td className="px-3 py-2.5 capitalize">{row.category}</td>
                                  <td className="px-3 py-2.5 font-semibold text-slate-800">{row.personName}</td>
                                  <td className={`px-3 py-2.5 font-black text-right ${row.type === 'thu' ? 'text-green-600' : 'text-red-650'}`}>{row.amount.toLocaleString()} đ</td>
                                  <td className="px-3 py-2.5 capitalize">{row.method}</td>
                                  <td className="px-3 py-2.5 text-slate-450 italic text-[11px] max-w-[120px] truncate" title={row.notes}>{row.notes}</td>
                                </>
                              )}

                              {activeReportId === 'profit' && (
                                <>
                                  <td className="px-3 py-2.5 text-slate-900 font-extrabold">{row.buildingName}</td>
                                  <td className="px-3 py-2.5 text-center font-bold text-slate-500">{row.totalRooms} phòng</td>
                                  <td className="px-3 py-2.5 font-extrabold text-green-600 text-right">{row.revenue.toLocaleString()} đ</td>
                                  <td className="px-3 py-2.5 font-extrabold text-red-600 text-right">{row.expenses.toLocaleString()} đ</td>
                                  <td className="px-3 py-2.5 font-black text-emerald-700 text-right text-sm">{row.netProfit.toLocaleString()} đ</td>
                                  <td className="px-3 py-2.5 text-center text-slate-900 font-black">{row.margin}</td>
                                </>
                              )}

                              {activeReportId === 'utilities' && (
                                <>
                                  <td className="px-3 py-2.5 font-semibold text-slate-900">{row.roomName}</td>
                                  <td className="px-3 py-2.5">{row.month}</td>
                                  <td className="px-3 py-2.5 font-bold text-blue-600">{row.electricUsage}</td>
                                  <td className="px-3 py-2.5 font-bold text-right">{row.electricFee.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-bold text-emerald-600">{row.waterUsage}</td>
                                  <td className="px-3 py-2.5 font-bold text-right">{row.waterFee.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 font-black text-right text-slate-900">{row.totalFee.toLocaleString()}</td>
                                </>
                              )}

                              {activeReportId === 'repairs' && (
                                <>
                                  <td className="px-3 py-2.5 font-bold text-slate-900">{row.roomName}</td>
                                  <td className="px-3 py-2.5 font-semibold">{row.reporter}</td>
                                  <td className="px-3 py-2.5 capitalize">{row.type}</td>
                                  <td className="px-3 py-2.5 capitalize font-bold leading-none">{row.priority}</td>
                                  <td className="px-3 py-2.5">{row.reporter}</td>
                                  <td className="px-3 py-2.5 font-semibold">{row.handler}</td>
                                  <td className="px-3 py-2.5 whitespace-nowrap">{row.reportDate}</td>
                                  <td className="px-3 py-2.5 text-right text-rose-600 font-extrabold">{row.cost.toLocaleString()}</td>
                                  <td className="px-3 py-2.5 capitalize">
                                    <Badge variant="outline" className={row.status === 'hoàn thành' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}>{row.status}</Badge>
                                  </td>
                                </>
                              )}

                            </tr>
                          ))}
                          {processedReportTableData.length === 0 && (
                            <tr>
                              <td colSpan={reportDataResult.tableHeaders.length} className="px-4 py-8 text-center text-slate-450 border-none font-medium">
                                Không có bất kỳ dữ liệu sự việc nào cho lập mẫu kỳ này.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Report pagination */}
                    {processedReportTableData.length > 0 && (
                      <div className="flex items-center justify-between px-3 py-2 border rounded-xl bg-slate-50 border-slate-150 select-none">
                        <span className="text-[11px] text-slate-450 font-bold">
                          Trang <span className="text-slate-700">{reportPageCurrent} / {totalReportPages}</span> ({processedReportTableData.length} phần tử)
                        </span>
                        
                        <div className="flex gap-1.5">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 font-bold text-[10px]"
                            onClick={() => setReportPageCurrent(p => Math.max(p - 1, 1))}
                            disabled={reportPageCurrent === 1}
                          >
                            Trước
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 px-2 font-bold text-[10px]"
                            onClick={() => setReportPageCurrent(p => Math.min(p + 1, totalReportPages))}
                            disabled={reportPageCurrent === totalReportPages}
                          >
                            Sau
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          LATENT BOTTOM SHEET: LOG TRANSACTION
          ========================================== */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[400px] w-full overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" /> Nhập Nhật Ký Quỹ Thu / Chi
            </SheetTitle>
          </SheetHeader>
          
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-150 rounded-xl">
               <button 
                 className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${form.type === 'thu' ? 'bg-white shadow text-green-600' : 'text-slate-500 hover:text-slate-700'}`}
                 onClick={() => setForm({...form, type: 'thu', category: 'tiền nhà'})}
               >
                 THU NHẬP
               </button>
               <button 
                 className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${form.type === 'chi' ? 'bg-white shadow text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
                 onClick={() => setForm({...form, type: 'chi', category: 'sửa chữa'})}
               >
                 GIẢI NGÂN CHI
               </button>
            </div>

            <div className="space-y-1">
               <label className="font-bold text-slate-600">Số lượng tiền giao dịch (VNĐ):</label>
               <Input type="number" className="text-base font-extrabold text-indigo-650 h-10" value={form.amount || ''} onChange={e => setForm({...form, amount: Number(e.target.value)})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-1">
                 <label className="font-bold text-slate-600">Ngày ghi sổ:</label>
                 <Input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="h-9 text-xs" />
               </div>
               <div className="space-y-1">
                 <label className="font-bold text-slate-600">Danh mục:</label>
                 <select 
                   value={form.category} 
                   onChange={(e) => setForm({...form, category: e.target.value as any})}
                   className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
                 >
                   {form.type === 'thu' ? (
                     incomeCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)
                   ) : (
                     expenseCategories.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)
                   )}
                 </select>
               </div>
            </div>

            <div className="space-y-1">
               <label className="font-bold text-slate-600">Khu nhà liên đới (Hợp quy):</label>
               <select 
                 value={form.buildingId || 'none'} 
                 onChange={e => setForm({...form, buildingId: e.target.value === 'none' ? undefined : e.target.value})}
                 className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
               >
                 <option value="none">-- Không liên kết khu --</option>
                 {state.buildings.map(b => (
                   <option key={b.id} value={b.id}>{b.name}</option>
                 ))}
               </select>
            </div>

            <div className="space-y-1">
               <label className="font-bold text-slate-600">Tên khách / Đối tác dính líu:</label>
               <Input placeholder="Ví dụ: Nguyễn Văn A, Điện Lực VN..." value={form.personName || ''} onChange={e => setForm({...form, personName: e.target.value})} className="h-9" />
            </div>

            <div className="space-y-1">
               <label className="font-bold text-slate-600">Sử dụng phương thức trả:</label>
               <select 
                 value={form.paymentMethod} 
                 onChange={e => setForm({...form, paymentMethod: e.target.value as any})}
                 className="w-full h-9 border rounded-lg bg-white px-2 text-xs border-slate-200 text-slate-800"
               >
                 <option value="tiền mặt">Tiền mặt</option>
                 <option value="chuyển khoản">Chuyển khoản</option>
                 <option value="ví điện tử">Ví điện tử</option>
               </select>
            </div>

            <div className="space-y-1">
               <label className="font-bold text-slate-600">Miêu tả / Ghi chú phát sinh:</label>
               <Input placeholder="Chi tiết lý do giao dịch..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} className="h-9" />
            </div>

            <div className="pt-4 border-t flex justify-end gap-2.5">
              <Button variant="outline" onClick={() => setIsFormOpen(false)} className="h-9 text-xs">Hủy bỏ</Button>
              <Button onClick={handleCreateTransaction} className="bg-indigo-650 hover:bg-indigo-700 text-white h-9 text-xs font-bold">Lưu giao dịch</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
};
