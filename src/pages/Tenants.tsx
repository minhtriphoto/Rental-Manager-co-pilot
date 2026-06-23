import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Plus, User, Phone, MapPin, Briefcase, Calendar, CreditCard, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tenant } from '../types';

export const Tenants = () => {
  const { state, setState } = useAppStore();
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [editedTenantData, setEditedTenantData] = useState<any>(null);

  const startEditTenant = (tenant: Tenant) => {
    setEditedTenantData({ ...tenant });
    setIsEditingTenant(true);
  };

  const handleTenantDataChange = (key: string, value: any) => {
    setEditedTenantData(prev => ({ ...prev, [key]: value }));
  };

  const saveTenantEdit = () => {
    if (!editedTenantData) return;
    setState(prev => ({
      ...prev,
      tenants: prev.tenants.map(t => t.id === editedTenantData.id ? editedTenantData : t)
    }));
    setSelectedTenant(editedTenantData);
    setIsEditingTenant(false);
    alert('Cập nhật thông tin khách thuê thành công!');
  };

  const cancelEditTenant = () => {
    setIsEditingTenant(false);
    setEditedTenantData(null);
  };

  const filteredTenants = state.tenants.filter(t => {
    const s = search.toLowerCase();
    return t.fullName.toLowerCase().includes(s) || 
           t.phone.includes(s) || 
           t.idCard.includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Người thuê</h2>
          <p className="text-muted-foreground">Quản lý danh sách khách đang thuê và đã rời đi.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Thêm khách mới
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm theo tên, SĐT, CCCD..." 
              className="pl-8" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Họ tên</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Số điện thoại</th>
                  <th className="px-4 py-3 font-medium">CCCD</th>
                  <th className="px-4 py-3 font-medium">Vai trò</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(tenant => {
                  const room = state.rooms.find(r => r.id === tenant.roomId);
                  return (
                    <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer" onClick={() => setSelectedTenant(tenant)}>
                      <td className="px-4 py-3 font-medium">
                        <div className="font-semibold text-blue-600 hover:underline">{tenant.fullName}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{room?.name || '---'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tenant.phone}</td>
                      <td className="px-4 py-3 text-muted-foreground">{tenant.idCard}</td>
                      <td className="px-4 py-3">
                        {tenant.isRepresentative ? <Badge variant="outline" className="border-blue-500 text-blue-600 font-semibold bg-blue-50">Đại diện</Badge> : <span className="text-muted-foreground text-sm">Thành viên</span>}
                      </td>
                      <td className="px-4 py-3">
                        {tenant.status === 'đang thuê' ? (
                          <Badge className="bg-blue-500">Đang thuê</Badge>
                        ) : (
                          <Badge variant="secondary">{tenant.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedTenant(tenant); }}>Chi tiết</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredTenants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">Không tìm thấy khách thuê nào.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={!!selectedTenant} onOpenChange={(open) => { if (!open) { setSelectedTenant(null); setIsEditingTenant(false); } }}>
        <SheetContent className="sm:max-w-[450px] w-full overflow-y-auto">
          {selectedTenant && (
            <>
              <SheetHeader className="mb-6">
                <SheetTitle className="text-2xl font-bold flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span>{isEditingTenant ? 'Sửa thông tin khách' : selectedTenant.fullName}</span>
                    <span className="text-sm font-normal text-muted-foreground flex items-center gap-2 mt-1">
                      {state.rooms.find(r => r.id === selectedTenant.roomId)?.name}
                      {selectedTenant.isRepresentative ? <Badge variant="outline" className="text-blue-600 border-blue-600 py-0 h-5">大 diện</Badge> : null}
                    </span>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {isEditingTenant ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Họ và tên</label>
                      <Input value={editedTenantData.fullName} onChange={(e) => handleTenantDataChange('fullName', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Số điện thoại</label>
                      <Input value={editedTenantData.phone} onChange={(e) => handleTenantDataChange('phone', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Số CCCD / CMND</label>
                      <Input value={editedTenantData.idCard} onChange={(e) => handleTenantDataChange('idCard', e.target.value)} className="font-mono" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Quê quán</label>
                      <Input value={editedTenantData.hometown} onChange={(e) => handleTenantDataChange('hometown', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Địa chỉ thường trú</label>
                      <Input value={editedTenantData.permanentAddress} onChange={(e) => handleTenantDataChange('permanentAddress', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Nghề nghiệp</label>
                      <Input value={editedTenantData.job} onChange={(e) => handleTenantDataChange('job', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Nơi làm việc</label>
                      <Input value={editedTenantData.workplace} onChange={(e) => handleTenantDataChange('workplace', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold">Ghi chú riêng</label>
                      <Input value={editedTenantData.notes} onChange={(e) => handleTenantDataChange('notes', e.target.value)} />
                    </div>
                    
                    <div className="pt-4 border-t flex justify-end gap-2">
                      <Button variant="outline" onClick={cancelEditTenant}>Hủy</Button>
                      <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={saveTenantEdit}>Lưu thay đổi</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-4">
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{selectedTenant.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{selectedTenant.idCard || 'Chưa có số CCCD'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="font-medium">Sinh ngày: {selectedTenant.dob || '---'}</span>
                          <span className="text-muted-foreground text-xs mt-0.5">Ngày thuê: {selectedTenant.startDate || '---'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{selectedTenant.permanentAddress || selectedTenant.hometown || 'Chưa cung cấp địa chỉ'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium">{selectedTenant.job || 'Chưa cung cấp nghề nghiệp'}</span>
                          <span className="text-muted-foreground text-xs mt-0.5">{selectedTenant.workplace}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-100">
                      <h4 className="font-bold flex items-center gap-2 text-sm mb-2">
                        <ShieldAlert className="w-4 h-4" />
                        Liên hệ khẩn cấp
                      </h4>
                      <div className="text-sm">
                        <span className="font-medium">{selectedTenant.emergencyContactName}</span>
                        {selectedTenant.emergencyContactPhone && <span className="ml-2 font-bold">{selectedTenant.emergencyContactPhone}</span>}
                      </div>
                    </div>

                    {selectedTenant.notes && (
                      <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                        <h4 className="font-bold text-sm mb-1">Ghi chú</h4>
                        <p className="text-sm">{selectedTenant.notes}</p>
                      </div>
                    )}

                    <div className="pt-4 border-t flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setSelectedTenant(null)}>Đóng</Button>
                      <Button onClick={() => startEditTenant(selectedTenant)} className="bg-indigo-600 hover:bg-indigo-700">Chỉnh sửa</Button>
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
