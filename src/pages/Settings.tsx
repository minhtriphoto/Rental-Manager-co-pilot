import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, CreditCard, Bell, Users, FileText, Settings as ConfigIcon, Save, Zap, Droplets, Wifi, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  // Form states mock
  const [landlordData, setLandlordData] = useState({
    name: 'Nguyễn Văn A',
    company: 'Công ty TNHH Rental Manager',
    phone: '0901234567',
    email: 'contact@rentalmanager.vn',
    address: '123 Đường Điện Biên Phủ, Quận Bình Thạnh, TP.HCM'
  });

  const [bankData, setBankData] = useState({
    bankName: 'Vietcombank',
    accountName: 'NGUYEN VAN A',
    accountNumber: '0123456789123',
    branch: 'Chi nhánh Tân Bình'
  });

  const [utilityRates, setUtilityRates] = useState({
    electric: '3500',
    water: '20000', // by person
    waterCalcMode: 'người', 
    internet: '100000',
    garbage: '50000',
    management: '150000'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    zaloOAAccessToken: '********-****-****-****-************',
    smsBrandname: 'RENTAL_MGR',
    autoRemindDays: '3'
  });

  const handleSave = () => {
    alert('Cập nhật cài đặt thành công!');
  };

  const getBankCode = (name: string) => {
    const map: Record<string, string> = {
      'Vietcombank': 'vietcombank',
      'Techcombank': 'techcombank',
      'MBBank': 'mbbank',
      'VPBank': 'vpbank',
      'VietinBank': 'vietinbank',
      'BIDV': 'bidv',
      'ACB': 'acb'
    };
    return map[name] || 'vietcombank';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h2>
          <p className="text-muted-foreground">Cấu hình thông tin nhà trọ, định mức dịch vụ và kết nối bên thứ ba.</p>
        </div>
        <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
          <Save className="w-4 h-4 mr-2" />
          Lưu thay đổi
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 w-full bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm">
             <Building2 className="w-4 h-4 mr-2" /> Thông tin chung
          </TabsTrigger>
          <TabsTrigger value="utilities" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm">
             <Zap className="w-4 h-4 mr-2" /> Định mức giá
          </TabsTrigger>
          <TabsTrigger value="bank" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm">
             <CreditCard className="w-4 h-4 mr-2" /> Thanh toán
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm">
             <Bell className="w-4 h-4 mr-2" /> Thông báo
          </TabsTrigger>
          <TabsTrigger value="permissions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow text-sm hidden lg:flex">
             <ShieldCheck className="w-4 h-4 mr-2" /> Phân quyền
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* General Tab */}
          <TabsContent value="general" className="m-0 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" /> 
                  Thông tin chủ nhà / Đơn vị quản lý
                </CardTitle>
                <CardDescription>Thông tin này sẽ được hiển thị trên hợp đồng và hóa đơn.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tên chủ nhà / Người đại diện</label>
                    <Input 
                      value={landlordData.name} 
                      onChange={(e) => setLandlordData({...landlordData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tên công ty / Thương hiệu (Nếu có)</label>
                    <Input 
                      value={landlordData.company} 
                      onChange={(e) => setLandlordData({...landlordData, company: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Số điện thoại liên hệ</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        className="pl-9"
                        value={landlordData.phone} 
                        onChange={(e) => setLandlordData({...landlordData, phone: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email liên hệ</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email"
                        className="pl-9"
                        value={landlordData.email} 
                        onChange={(e) => setLandlordData({...landlordData, email: e.target.value})} 
                      />
                    </div>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Địa chỉ trụ sở / Văn phòng</label>
                    <Input 
                      value={landlordData.address} 
                      onChange={(e) => setLandlordData({...landlordData, address: e.target.value})} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Utilities Tab */}
          <TabsContent value="utilities" className="m-0 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" /> 
                  Định mức dịch vụ mặc định
                </CardTitle>
                <CardDescription>Bảng giá này sẽ được áp dụng mặc định khi tạo phòng hoặc chi nhánh mới.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Electricity */}
                  <div className="space-y-2 p-4 bg-amber-50/50 rounded-xl border border-amber-100/50">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <Zap className="w-4 h-4 text-amber-500" /> Điện (VNĐ / kWh)
                    </label>
                    <Input 
                      type="number"
                      value={utilityRates.electric} 
                      onChange={(e) => setUtilityRates({...utilityRates, electric: e.target.value})} 
                      className="font-mono bg-white"
                    />
                  </div>

                  {/* Water */}
                  <div className="space-y-2 p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <Droplets className="w-4 h-4 text-blue-500" /> Nước (VNĐ)
                    </label>
                    <div className="flex gap-2">
                      <Input 
                        type="number"
                        value={utilityRates.water} 
                        onChange={(e) => setUtilityRates({...utilityRates, water: e.target.value})} 
                        className="font-mono bg-white flex-1"
                      />
                      <Select value={utilityRates.waterCalcMode} onValueChange={(val) => setUtilityRates({...utilityRates, waterCalcMode: val})}>
                        <SelectTrigger className="w-[140px] bg-white">
                          <SelectValue placeholder="Đơn vị tính" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="người">VNĐ / Người</SelectItem>
                          <SelectItem value="khối">VNĐ / Khối m³</SelectItem>
                          <SelectItem value="phòng">VNĐ / Phòng</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Internet */}
                  <div className="space-y-2 p-4 bg-purple-50/50 rounded-xl border border-purple-100/50">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <Wifi className="w-4 h-4 text-purple-500" /> Internet / WiFi (VNĐ / Phòng / Tháng)
                    </label>
                    <Input 
                      type="number"
                      value={utilityRates.internet} 
                      onChange={(e) => setUtilityRates({...utilityRates, internet: e.target.value})} 
                      className="font-mono bg-white"
                    />
                  </div>

                  {/* Garbage */}
                  <div className="space-y-2 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <ConfigIcon className="w-4 h-4 text-emerald-500" /> Rác thải (VNĐ / Tháng)
                    </label>
                    <Input 
                      type="number"
                      value={utilityRates.garbage} 
                      onChange={(e) => setUtilityRates({...utilityRates, garbage: e.target.value})} 
                      className="font-mono bg-white"
                    />
                  </div>
                  
                  {/* Management Fee */}
                  <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <label className="text-sm font-bold flex items-center gap-2 text-slate-800">
                      <Users className="w-4 h-4 text-slate-500" /> Phí dịch vụ quản lý (VNĐ / Phòng / Tháng)
                    </label>
                    <Input 
                      type="number"
                      value={utilityRates.management} 
                      onChange={(e) => setUtilityRates({...utilityRates, management: e.target.value})} 
                      className="font-mono bg-white"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment/Bank Tab */}
          <TabsContent value="bank" className="m-0 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" /> 
                  Tài khoản nhận thanh toán
                </CardTitle>
                <CardDescription>Thông tin tài khoản ngân hàng được in trên hóa đơn và mã QR thanh toán.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Ngân hàng</label>
                    <Select value={bankData.bankName} onValueChange={(val) => setBankData({...bankData, bankName: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn ngân hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Vietcombank">Vietcombank</SelectItem>
                        <SelectItem value="Techcombank">Techcombank</SelectItem>
                        <SelectItem value="MBBank">MBBank (Ngân hàng Quân Đội)</SelectItem>
                        <SelectItem value="VPBank">VPBank</SelectItem>
                        <SelectItem value="VietinBank">VietinBank</SelectItem>
                        <SelectItem value="BIDV">BIDV</SelectItem>
                        <SelectItem value="ACB">ACB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Chi nhánh (Tùy chọn)</label>
                    <Input 
                      value={bankData.branch} 
                      onChange={(e) => setBankData({...bankData, branch: e.target.value})} 
                      placeholder="VD: Chi nhánh TP.HCM"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Số tài khoản</label>
                    <Input 
                      className="font-mono text-lg font-bold"
                      value={bankData.accountNumber} 
                      onChange={(e) => setBankData({...bankData, accountNumber: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Tên chủ tài khoản</label>
                    <Input 
                      className="uppercase font-bold"
                      value={bankData.accountName} 
                      onChange={(e) => setBankData({...bankData, accountName: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="mt-8 p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row items-center gap-6">
                  <div className="w-40 h-40 bg-white p-2 border border-slate-200 rounded-lg shrink-0 flex items-center justify-center relative overflow-hidden">
                     {bankData.accountNumber ? (
                       <img 
                          src={`https://img.vietqr.io/image/${getBankCode(bankData.bankName)}-${bankData.accountNumber}-compact2.png?accountName=${encodeURIComponent(bankData.accountName)}`} 
                          alt="VietQR Sample"
                          className="w-full h-full object-contain"
                       />
                     ) : (
                       <div className="text-center text-slate-400 text-xs">Chưa có STK</div>
                     )}
                     <div className="absolute inset-0 border-4 border-emerald-500 rounded-lg shadow-[inset_0_0_15px_rgba(0,0,0,0.1)] pointer-events-none"></div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="font-bold text-lg text-slate-800">QR Code Hóa Đơn Tự Động</h4>
                    <p className="text-sm text-slate-600 mt-1 mb-3">
                      Hệ thống tự động tạo mã QR VietQR theo chuẩn Napas cho từng hóa đơn, giúp khách thuê thanh toán nhanh chóng chỉ với 1 lần quét.
                    </p>
                    <Button variant="outline" className="bg-white" onClick={() => {
                        if (bankData.accountNumber) {
                           window.open(`https://img.vietqr.io/image/${getBankCode(bankData.bankName)}-${bankData.accountNumber}-compact2.png?accountName=${encodeURIComponent(bankData.accountName)}`, '_blank');
                        }
                    }}>
                      Tải mã QR mẫu
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="m-0 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" /> 
                  Thông báo & Cảnh báo
                </CardTitle>
                <CardDescription>Thiết lập kết nối nhắn tin Zalo OA và SMS Brandname để nhắc nợ tự động.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded bg-[#0068FF] text-white flex items-center justify-center font-bold text-xs">
                        Zalo
                      </div>
                      <h3 className="font-bold text-slate-800">Tích hợp Zalo ZNS / OA</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 tracking-tight">Access Token</label>
                      <Input 
                        type="password"
                        value={notificationSettings.zaloOAAccessToken} 
                        onChange={(e) => setNotificationSettings({...notificationSettings, zaloOAAccessToken: e.target.value})} 
                      />
                      <p className="text-xs text-slate-500 mt-1">Sử dụng để gửi thông báo hóa đơn, nhắc nợ qua Zalo Official Account.</p>
                    </div>
                    <Button variant="outline" className="w-full text-[#0068FF] border-[#0068FF]/30 hover:bg-[#0068FF]/10">
                      Kiểm tra kết nối Zalo
                    </Button>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <div className="w-8 h-8 rounded bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                        SMS
                      </div>
                      <h3 className="font-bold text-slate-800">SMS Brandname</h3>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 tracking-tight">Tên Brandname</label>
                      <Input 
                        value={notificationSettings.smsBrandname} 
                        onChange={(e) => setNotificationSettings({...notificationSettings, smsBrandname: e.target.value})} 
                      />
                      <p className="text-xs text-slate-500 mt-1">Đăng ký tại các nhà mạng (Viettel, Mobifone, Vinaphone).</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <h3 className="font-bold text-slate-800 mb-4">Quy trình nhắc nợ</h3>
                  <div className="flex items-center gap-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                     <Bell className="w-8 h-8 text-orange-500 shrink-0" />
                     <div>
                       <p className="text-sm text-slate-700">Tự động gửi thông báo nhắc nợ trước ngày hết hạn thanh toán:</p>
                       <div className="flex items-center gap-3 mt-2">
                          <Input 
                            type="number" 
                            className="w-20 font-bold bg-white" 
                            value={notificationSettings.autoRemindDays}
                            onChange={(e) => setNotificationSettings({...notificationSettings, autoRemindDays: e.target.value})}
                          />
                          <span className="font-semibold text-slate-600">ngày</span>
                       </div>
                     </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="permissions" className="m-0 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50/50 border-b border-slate-100 flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Phân quyền quản trị
                  </CardTitle>
                  <CardDescription className="mt-1">Quản lý danh sách nhân sự, quản lý tòa nhà và quyền truy cập phần mềm.</CardDescription>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700">Tạo tài khoản</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Nhân viên</th>
                        <th className="px-6 py-4 font-semibold">Vai trò</th>
                        <th className="px-6 py-4 font-semibold">Quyền hạn / Khu vực</th>
                        <th className="px-6 py-4 font-semibold">Trạng thái</th>
                        <th className="px-6 py-4 font-semibold">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">Nguyễn Văn A</div>
                          <div className="text-xs text-slate-500">nguyen.a@rentalmanager.vn</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                            Quản trị viên
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">Tất cả khu nhà</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Hoạt động
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="text-indigo-600 font-medium">Chỉnh sửa</Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">Trần Thị B</div>
                          <div className="text-xs text-slate-500">tran.b@rentalmanager.vn</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            Quản lý khu
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">Tòa nhà A, Tòa nhà B</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            Hoạt động
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="text-indigo-600 font-medium">Chỉnh sửa</Button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">Lê Văn C</div>
                          <div className="text-xs text-slate-500">le.c@rentalmanager.vn</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            Kế toán
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">Tất cả hóa đơn & tài chính</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            Tạm khóa
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Button variant="ghost" size="sm" className="text-indigo-600 font-medium">Chỉnh sửa</Button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
