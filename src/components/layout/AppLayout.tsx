import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Building2, DoorOpen, Users, FileText, Receipt, Lightbulb, Wrench, BarChart3, Settings, Menu, AlertCircle, Package, Bell, Sparkles, Cloud, CloudOff, RefreshCw, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from '../../lib/store';
import { GlobalSearch } from './GlobalSearch';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard Tổng Quan', path: '/' },
  { icon: Sparkles, label: 'Bộ Trợ Lý AI Co-Pilot', path: '/ai-assistant' },
  { icon: Bell, label: 'Nhắc Việc & Cảnh Báo', path: '/reminders' },
  { icon: Building2, label: 'Quản Lý Khu Nhà', path: '/buildings' },
  { icon: DoorOpen, label: 'Sơ Đồ Phòng', path: '/rooms' },
  { icon: Users, label: 'Khách Thuê & Hợp Đồng', path: '/tenants' },
  { icon: Lightbulb, label: 'Chỉ Số Điện Nước', path: '/utilities' },
  { icon: Receipt, label: 'Phiếu Thu Hàng Tháng', path: '/billing' },
  { icon: AlertCircle, label: 'Quản Lý Công Nợ', path: '/debts' },
  { icon: Wrench, label: 'Yêu Cầu Bảo Trì', path: '/maintenance' },
  { icon: Package, label: 'Quản Lý Tài Sản', path: '/assets' },
  { icon: FileText, label: 'Sổ Thu Chi / Báo cáo', path: '/finance' },
  { icon: Settings, label: 'Cài Đặt Hệ Thống', path: '/settings' },
];

export const AppLayout = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { 
    isCloudSyncActive, 
    isCloudSyncing, 
    cloudSyncError, 
    setCloudSyncActive, 
    forceUploadToCloud, 
    forceDownloadFromCloud,
    clearCloudSyncError
  } = useAppStore();

  const NavContent = () => (
    <div className="flex flex-col py-2">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex items-center gap-3 px-5 py-3 font-medium text-[14px] transition-colors border-l-[3px] ${
              isActive 
                ? 'bg-blue-50 text-blue-600 border-blue-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-transparent'
            }`
          }
          onClick={() => setIsMobileOpen(false)}
        >
          <item.icon className="w-5 h-5" />
          {item.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden text-slate-800">
      {/* Top Header */}
      <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold">RM</span>
          </div>
          <div className="flex flex-col hidden sm:flex">
            <span className="font-bold text-lg leading-tight uppercase">Rental Manager</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest">Giải pháp quản lý nhà trọ</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <GlobalSearch />
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Tòa nhà: Green Home - Q.7
          </div>

          {/* Cloud Sync Status Popover Indicator */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] shadow-xs active:scale-[0.98] ${
                !isCloudSyncActive 
                  ? 'bg-slate-100 border-slate-250 text-slate-600 hover:bg-slate-200/70' 
                  : isCloudSyncing 
                    ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100/70' 
                    : cloudSyncError 
                      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100/70' 
                      : 'bg-emerald-50 border-emerald-250 text-emerald-800 hover:bg-emerald-100/80'
              }`}>
                {!isCloudSyncActive ? (
                  <>
                    <CloudOff className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Đồng bộ: Tắt</span>
                  </>
                ) : isCloudSyncing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
                    <span className="hidden md:inline">Synced: Đang nạp...</span>
                  </>
                ) : cloudSyncError ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden md:inline">Lỗi Đám mây</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10 animate-bounce" style={{ animationDuration: '3s' }} />
                    <span className="hidden md:inline">Synced: Trực tuyến</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 bg-white/95 backdrop-blur-md shadow-xl rounded-xl border border-slate-250 z-50 text-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-blue-600" />
                    Đồng Bộ Đám Mây Real-Time
                  </h4>
                  <Badge variant={isCloudSyncActive ? "default" : "outline"} className={isCloudSyncActive ? "bg-emerald-600 text-white" : ""}>
                    {isCloudSyncActive ? "Active" : "Disabled"}
                  </Badge>
                </div>

                <p className="text-slate-500 leading-relaxed font-normal">
                  Hệ thống đồng bộ dữ liệu liên tục lên Google Cloud Firestore Server. Toàn bộ các máy tính và thiết bị động (mobile) kết nối sẽ được đồng bộ dữ liệu tức thời mọi lúc, mọi nơi khi có thay đổi!
                </p>

                {cloudSyncError && (
                  <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-100 space-y-1">
                    <div className="font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Lỗi kết nối đám mây
                    </div>
                    <div className="text-[10px] font-mono leading-tight">{cloudSyncError}</div>
                    <button 
                      onClick={clearCloudSyncError}
                      className="text-[10px] underline font-bold mt-1 text-red-800 cursor-pointer block"
                    >
                      Bỏ qua cảnh báo
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-medium text-slate-700">Trạng thái kết nối:</span>
                  <span className="font-bold">
                    {!isCloudSyncActive ? (
                      <span className="text-slate-500">Offline (Hỗ trợ trình duyệt)</span>
                    ) : isCloudSyncing ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Kết nối...
                      </span>
                    ) : cloudSyncError ? (
                      <span className="text-red-600">Đồng bộ lỗi / Ngoại tuyến</span>
                    ) : (
                      <span className="text-emerald-700 flex items-center gap-1 font-extrabold animate-pulse">
                        ● Live Syncing Trực Tuyến
                      </span>
                    )}
                  </span>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setCloudSyncActive(!isCloudSyncActive)}
                    className={`w-full py-2 px-3 rounded-lg text-white font-extrabold cursor-pointer text-center text-xs transition-colors border-none ${
                      isCloudSyncActive 
                        ? 'bg-slate-700 hover:bg-slate-800' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isCloudSyncActive ? "Tạm Dừng Đồng Bộ Đám Mây" : "Kích Hoạt Đồng Bộ Đám Mây"}
                  </button>

                  {isCloudSyncActive && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t">
                      <button
                        onClick={forceUploadToCloud}
                        disabled={isCloudSyncing}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px] flex items-center justify-center gap-1 disabled:opacity-50"
                        title="Tải toàn bộ dữ liệu máy này đè lên đám mây"
                      >
                        <ArrowUp className="w-3 h-3 text-blue-600" /> Đồng bộ Lên Vân
                      </button>
                      <button
                        onClick={forceDownloadFromCloud}
                        disabled={isCloudSyncing}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer text-[10px] flex items-center justify-center gap-1 disabled:opacity-50"
                        title="Tải toàn bộ dữ liệu từ đám mây đè lên máy này"
                      >
                        <ArrowDown className="w-3 h-3 text-emerald-600" /> Đồng bộ Về Máy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
            AD
          </div>
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger render={
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="w-6 h-6" />
              </Button>
            } />
            <SheetContent side="left" className="p-0 w-64 bg-white">
              <div className="px-6 py-4 border-b border-slate-100">
                <span className="font-bold text-lg leading-tight uppercase">Rental Manager</span>
              </div>
              <NavContent />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Area layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <aside className="w-[220px] bg-white border-r border-slate-200 flex-shrink-0 hidden md:block overflow-y-auto">
          <NavContent />
        </aside>

        {/* Main Content Scrollable Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 md:p-6 pb-20">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
