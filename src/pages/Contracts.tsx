import React from 'react';
import { useAppStore } from '../lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, FileSignature, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Contracts = () => {
  const { state } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Hợp đồng thuê</h2>
          <p className="text-muted-foreground">Quản lý các hợp đồng hiện tại và lịch sử hợp đồng.</p>
        </div>
        <Button>
          <FileSignature className="w-4 h-4 mr-2" /> Tạo hợp đồng mới
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm hợp đồng, phòng..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Mã HĐ</th>
                  <th className="px-4 py-3 font-medium">Phòng</th>
                  <th className="px-4 py-3 font-medium">Người đại diện</th>
                  <th className="px-4 py-3 font-medium">Thời hạn</th>
                  <th className="px-4 py-3 font-medium">Giá thuê</th>
                  <th className="px-4 py-3 font-medium">Tiền cọc</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium text-right">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {state.contracts.map(contract => {
                  const room = state.rooms.find(r => r.id === contract.roomId);
                  const rep = state.tenants.find(t => t.id === contract.representativeId);
                  
                  const daysLeft = differenceInDays(new Date(contract.endDate), new Date());
                  const isExpiring = contract.status === 'sắp hết hạn' || (daysLeft > 0 && daysLeft <= 30);
                  
                  return (
                    <tr key={contract.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{contract.id.toUpperCase()}</td>
                      <td className="px-4 py-3">{room?.name || '---'}</td>
                      <td className="px-4 py-3">{rep?.fullName || '---'}</td>
                      <td className="px-4 py-3">
                        <div className="text-xs">
                          Từ {format(new Date(contract.startDate), 'dd/MM/yyyy')} <br/>
                          Đến <span className={isExpiring ? 'font-bold text-destructive' : ''}>{format(new Date(contract.endDate), 'dd/MM/yyyy')}</span>
                        </div>
                        {isExpiring && (
                          <div className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" /> Còn {daysLeft} ngày
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{contract.price.toLocaleString()} ₫</td>
                      <td className="px-4 py-3">{contract.deposit.toLocaleString()} ₫</td>
                      <td className="px-4 py-3">
                        {isExpiring ? (
                          <Badge className="bg-yellow-500">Sắp hết hạn</Badge>
                        ) : contract.status === 'còn hiệu lực' ? (
                          <Badge className="bg-green-500">Còn hiệu lực</Badge>
                        ) : (
                          <Badge variant="secondary">{contract.status}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm">Sửa</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
