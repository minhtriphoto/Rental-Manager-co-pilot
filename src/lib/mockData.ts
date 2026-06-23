import { Building, Room, Tenant, Contract, Invoice, MaintenanceRequest } from '../types';

export const mockBuildings: Building[] = [
  { id: 'b1', name: 'Khu A - Yên Hòa', address: '123 Yên Hòa, Cầu Giấy', floors: 3, totalRooms: 15, manager: 'Nguyễn Văn A', notes: 'Gần chợ', status: 'active' },
  { id: 'b2', name: 'Khu B - Mỹ Đình', address: '45 Mỹ Đình, Nam Từ Liêm', floors: 3, totalRooms: 15, manager: 'Nguyễn Văn B', notes: 'Mới xây 2023', status: 'active' },
];

export const mockRooms: Room[] = Array.from({ length: 30 }).map((_, i) => {
  const buildingId = i < 15 ? 'b1' : 'b2';
  const floorCounter = (i % 15);
  const floor = Math.floor(floorCounter / 5) + 1;
  const roomNum = floorCounter % 5 + 1;
  const isOccupied = i < 20; // 20 occupied, 10 empty
  const isMaintenance = i === 25; // 1 maintenance
  const isExpiring = i === 2; // 1 expiring soon

  let status: any = 'trống';
  if (isOccupied) status = 'đang thuê';
  if (isExpiring) status = 'đang thuê'; // We'll highlight expiring contracts in UI based on contract, but status is 'đang thuê'
  if (isMaintenance) status = 'đang sửa';

  return {
    id: `r${i + 1}`,
    buildingId,
    floor,
    code: `${floor}0${roomNum}`,
    name: `Phòng ${floor}0${roomNum}`,
    area: 25 + (i % 3) * 5,
    type: i % 4 === 0 ? 'studio' : 'phòng đơn',
    basePrice: 3000000 + (i % 3) * 500000,
    depositRequired: 3000000 + (i % 3) * 500000,
    maxOccupants: 2 + (i % 2),
    status,
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop'],
    furnitureDescription: 'Giường, tủ, điều hòa, nóng lạnh',
    assets: ['Điều hòa Daikin 9000BTU', 'Nóng lạnh Ariston 20L', 'Giường 1m6', 'Tủ quần áo 2 cánh', 'Tủ lạnh 120L'],
    notes: '',
  };
});

export const mockTenants: Tenant[] = mockRooms.filter(r => r.status === 'đang thuê').flatMap((room, i) => {
  const representative = {
    id: `t${i}_1`,
    roomId: room.id,
    fullName: `Khách thuê ${room.code} A`,
    phone: '090123456' + (i % 10),
    email: `khach${i}@gmail.com`,
    idCard: '0010901234' + i,
    dob: '1995-01-01',
    hometown: 'Hà Nội',
    permanentAddress: '123 Phố Huế, Hai Bà Trưng, Hà Nội',
    job: 'Nhân viên văn phòng',
    workplace: 'Cầu Giấy',
    emergencyContactName: 'Người thân',
    emergencyContactPhone: '0911234567',
    startDate: '2023-01-01',
    status: 'đang thuê' as const,
    isRepresentative: true,
    notes: 'Khách VIP, thanh toán đúng hạn',
  };

  const roommate = {
    id: `t${i}_2`,
    roomId: room.id,
    fullName: `Người ở cùng ${room.code} B`,
    phone: '090987654' + (i % 10),
    email: `roommate${i}@gmail.com`,
    idCard: '0020901234' + i,
    dob: '1998-05-10',
    hometown: 'Nam Định',
    permanentAddress: '456 Lê Hồng Phong, Nam Định',
    job: 'Sinh viên',
    workplace: 'ĐH Thương Mại',
    emergencyContactName: 'Người thân B',
    emergencyContactPhone: '0944556677',
    startDate: '2023-01-01',
    status: 'đang thuê' as const,
    isRepresentative: false,
    notes: '',
  };

  return i % 2 === 0 ? [representative, roommate] : [representative];
});

export const mockContracts: Contract[] = mockTenants.filter(t => t.isRepresentative).map((tenant, i) => {
  const isExpiring = i === 2;
  return {
    id: `c${i + 1}`,
    roomId: tenant.roomId,
    representativeId: tenant.id,
    startDate: '2023-01-01',
    endDate: isExpiring ? new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '2024-12-31',
    paymentCycle: 'tháng',
    price: 3500000,
    deposit: 3500000,
    collectionDay: 5,
    fixedServices: [
      { name: 'Wifi', price: 100000 },
      { name: 'Vệ sinh', price: 50000 },
    ],
    status: isExpiring ? 'sắp hết hạn' : 'còn hiệu lực',
  };
});

export const mockInvoices: Invoice[] = mockContracts.map((c, i) => {
  const isDebt = i % 5 === 0;
  return {
    id: `inv${i + 1}`,
    month: '2023-10',
    roomId: c.roomId,
    tenantId: c.representativeId,
    roomRent: c.price,
    electricFee: 200000,
    waterFee: 100000,
    internetFee: 100000,
    cleaningFee: 50000,
    parkingFee: 0,
    otherFees: 0,
    oldDebt: isDebt ? 1000000 : 0,
    discount: 0,
    surcharge: 0,
    totalAmount: c.price + 200000 + 100000 + 100000 + 50000 + (isDebt ? 1000000 : 0),
    paidAmount: isDebt ? 0 : c.price + 200000 + 100000 + 100000 + 50000,
    dueDate: '2023-10-05',
    paymentMethod: isDebt ? undefined : 'chuyển khoản',
    status: isDebt ? 'chưa thu' : 'đã thu đủ',
  };
});

export const mockMaintenances: MaintenanceRequest[] = [
  {
    id: 'm1',
    roomId: 'r1',
    reporterName: 'Khách thuê 101 A',
    type: 'điện',
    description: 'Bóng đèn nhà vệ sinh bị cháy',
    priority: 'thấp',
    status: 'mới tạo',
    reportDate: '2023-10-01',
    cost: 0,
  },
  {
    id: 'm2',
    roomId: 'r2',
    reporterName: 'Khách thuê 102 A',
    type: 'nước',
    description: 'Vòi nước bồn rửa mặt bị rỉ',
    priority: 'trung bình',
    status: 'đang xử lý',
    reportDate: '2023-09-28',
    cost: 50000,
  }
];

export const mockTransactions = [
  {
    id: 'txn1',
    date: '2023-10-01',
    type: 'thu',
    category: 'tiền nhà',
    amount: 5500000,
    buildingId: 'b1',
    roomId: 'r1',
    personName: 'Khách thuê 101 A',
    notes: 'Thu tiền nhà T10',
    paymentMethod: 'chuyển khoản',
  },
  {
    id: 'txn2',
    date: '2023-10-02',
    type: 'chi',
    category: 'vệ sinh',
    amount: 500000,
    buildingId: 'b1',
    personName: 'Cô lao công',
    notes: 'Dọn dẹp hành lang T10',
    paymentMethod: 'tiền mặt',
  },
  {
    id: 'txn3',
    date: '2023-10-05',
    type: 'chi',
    category: 'sửa chữa',
    amount: 150000,
    buildingId: 'b1',
    roomId: 'r1',
    notes: 'Thay bóng đèn',
    paymentMethod: 'tiền mặt',
  }
] as any[];

