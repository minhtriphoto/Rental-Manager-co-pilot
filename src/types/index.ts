export type Building = {
  id: string;
  name: string;
  address: string;
  floors: number;
  totalRooms: number;
  manager: string;
  notes: string;
  status: 'active' | 'inactive';
};

export type RoomStatus = 'trống' | 'đang thuê' | 'đặt cọc' | 'đang sửa' | 'ngừng cho thuê';
export type RoomType = 'phòng đơn' | 'phòng đôi' | 'studio' | 'căn hộ mini' | 'căn hộ dịch vụ';

export type Room = {
  id: string;
  buildingId: string;
  floor: number;
  code: string;
  name: string;
  area: number;
  type: RoomType;
  basePrice: number;
  depositRequired: number;
  maxOccupants: number;
  status: RoomStatus;
  images?: string[];
  furnitureDescription: string;
  assets?: string[];
  notes: string;
};

export type TenantStatus = 'đang thuê' | 'đã rời đi' | 'theo dõi';

export type Tenant = {
  id: string;
  roomId: string;
  fullName: string;
  phone: string;
  email: string;
  idCard: string;
  dob: string;
  hometown: string;
  permanentAddress: string;
  idCardFrontContent?: string;
  idCardBackContent?: string;
  portraitContent?: string;
  job: string;
  workplace: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  startDate: string;
  status: TenantStatus;
  isRepresentative: boolean;
  notes: string;
};

export type Contract = {
  id: string;
  roomId: string;
  representativeId: string;
  startDate: string;
  endDate: string;
  paymentCycle: 'tháng' | 'quý' | 'năm';
  price: number;
  deposit: number;
  collectionDay: number;
  fixedServices: { name: string; price: number }[];
  status: 'còn hiệu lực' | 'sắp hết hạn' | 'đã kết thúc' | 'đã thanh lý';
};

export type InvoiceStatus = 'chưa thu' | 'thu một phần' | 'đã thu đủ' | 'quá hạn';

export type UtilityReading = {
  id: string;
  roomId: string;
  month: string; // YYYY-MM
  // Electricity
  electricOld: number;
  electricNew: number;
  electricUsage: number;
  electricPrice: number;
  electricTotal: number;
  electricImageToVerify?: string;
  // Water
  waterCalcMethod: 'đồng hồ' | 'người';
  waterOld: number;
  waterNew: number;
  waterUsage: number; // if calc by người, this could be number of persons
  waterPrice: number;
  waterTotal: number;
  waterImageToVerify?: string;
};

export type Invoice = {
  id: string;
  month: string; // YYYY-MM
  roomId: string;
  tenantId: string;
  roomRent: number;
  electricFee: number;
  waterFee: number;
  internetFee: number;
  cleaningFee: number;
  parkingFee: number;
  otherFees: number;
  oldDebt: number;
  discount: number;
  surcharge: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  paymentDate?: string;
  paymentMethod?: 'tiền mặt' | 'chuyển khoản' | 'ví điện tử';
  status: InvoiceStatus;
  reminderHistory?: { date: string; method: string; content: string }[];
  debtNotes?: string;
};

export type MaintenanceStatus = 'mới tạo' | 'đang xử lý' | 'hoàn thành' | 'hủy';
export type MaintenancePriority = 'thấp' | 'trung bình' | 'cao' | 'khẩn cấp';

export type MaintenanceRequest = {
  id: string;
  roomId: string;
  reporterName: string;
  type: 'điện' | 'nước' | 'điều hòa' | 'khóa cửa' | 'vệ sinh' | 'nội thất' | 'khác' | string;
  description: string;
  attachment?: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reportDate: string;
  handlerName?: string;
  cost: number;
  notes?: string;
};

export type TransactionType = 'thu' | 'chi';
export type IncomeCategory = 'tiền nhà' | 'tiền cọc' | 'tiền điện nước' | 'phí dịch vụ' | 'phụ thu' | 'khác';
export type ExpenseCategory = 'sửa chữa' | 'vệ sinh' | 'bảo trì' | 'điện nước tổng' | 'internet' | 'người quản lý' | 'mua sắm tài sản' | 'thuế/phí' | 'khác';

export type Transaction = {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  buildingId?: string;
  roomId?: string;
  personName?: string;
  notes: string;
  invoiceImage?: string;
  paymentMethod: 'tiền mặt' | 'chuyển khoản' | 'ví điện tử';
};

export type RoomAsset = {
  id: string;
  roomId: string;
  name: string;
  quantity: number;
  initialStatus: string;
  image?: string;
  estimatedValue: number;
  handoverDate: string; // YYYY-MM-DD
  notes: string;
};

export type CheckoutChecklist = {
  id: string;
  roomId: string;
  contractId: string;
  tenantId: string;
  checkoutDate: string;
  isAssetsComplete: boolean;
  isDamaged: boolean;
  damageDetails?: string;
  deductDepositAmount: number;
  compensationCost: number;
  liquidationNotes: string;
  status: 'pending' | 'completed';
};
