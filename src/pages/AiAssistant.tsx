import React, { useState } from 'react';
import { useAppStore } from '../lib/store';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  MessageSquare, 
  ShieldAlert, 
  FileText, 
  CheckSquare, 
  UserCheck, 
  HelpCircle, 
  Copy, 
  Check, 
  Loader2, 
  Users, 
  Home, 
  RefreshCw 
} from 'lucide-react';

type AIAction = 
  | 'ai_analytics'
  | 'summarize' 
  | 'underperforming' 
  | 'suggest_rent' 
  | 'remind_payment' 
  | 'building_rules' 
  | 'rent_contract' 
  | 'debtor_analysis' 
  | 'checkout_checklist' 
  | 'landlord_report';

interface ActionMetadata {
  id: AIAction;
  title: string;
  category: 'analysis' | 'draft' | 'operational';
  description: string;
  icon: React.ComponentType<any>;
  colorClass: string;
  bgColorClass: string;
}

const AI_ACTIONS_METADATA: ActionMetadata[] = [
  {
    id: 'ai_analytics',
    title: 'Báo cáo & Tối ưu tài chính AI',
    category: 'analysis',
    description: 'Phân tích chuyên sâu tỷ lệ lấp đầy, doanh thu, chi phí, chỉ ra phòng kém hiệu quả và đề xuất tăng giá dốc/tiếp thị.',
    icon: Sparkles,
    colorClass: 'text-blue-600 border-blue-250',
    bgColorClass: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'summarize',
    title: 'Tóm tắt kinh doanh tháng này',
    category: 'analysis',
    description: 'Thống kê tổng doanh thu thực tế, phòng trống, sự cố tồn đọng và điểm vận hành nổi bật.',
    icon: TrendingUp,
    colorClass: 'text-emerald-600 border-emerald-200',
    bgColorClass: 'bg-emerald-50 hover:bg-emerald-100',
  },
  {
    id: 'underperforming',
    title: 'Phân tích hiệu suất phòng kém',
    category: 'analysis',
    description: 'Tìm các phòng có công nợ nợ đọng, trống lâu ngày dính hỏng vặt nhiều để tối ưu.',
    icon: AlertTriangle,
    colorClass: 'text-amber-600 border-amber-200',
    bgColorClass: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    id: 'suggest_rent',
    title: 'Gợi ý giá thuê tối ưu',
    category: 'analysis',
    description: 'Điều chỉnh giá thuê khoa học dựa trên tỷ lệ lấp đầy phòng thực tế và hao mòn thiết bị.',
    icon: DollarSign,
    colorClass: 'text-blue-600 border-blue-200',
    bgColorClass: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'remind_payment',
    title: 'Mẫu tin nhắn nhắc tiền nhà',
    category: 'draft',
    description: 'Soạn tin nhắn nhắc nợ 3 mức độ thúc giục nhẹ nhàng đến khẩn cấp gửi Zalo/SMS.',
    icon: MessageSquare,
    colorClass: 'text-violet-600 border-violet-200',
    bgColorClass: 'bg-violet-50 hover:bg-violet-100',
  },
  {
    id: 'building_rules',
    title: 'Biên soạn nội quy khu nhà',
    category: 'draft',
    description: 'Phác thảo các quy định an ninh cổng vân tay, PCCC sạc xe điện, nếp sống văn minh chung.',
    icon: ShieldAlert,
    colorClass: 'text-red-600 border-red-200',
    bgColorClass: 'bg-red-50 hover:bg-red-100',
  },
  {
    id: 'rent_contract',
    title: 'Soạn hợp đồng thuê mẫu',
    category: 'draft',
    description: 'Khởi tạo hợp đồng thuê phòng chuẩn chỉnh pháp lý kèm các điều khoản phạt phá vỡ cọc.',
    icon: FileText,
    colorClass: 'text-indigo-600 border-indigo-200',
    bgColorClass: 'bg-indigo-50 hover:bg-indigo-100',
  },
  {
    id: 'debtor_analysis',
    title: 'Xử lý công nợ khách nợ lâu',
    category: 'analysis',
    description: 'Đánh giá mức độ rủi ro, trừ thu vớt cọc và kịch bản đòi nợ trễ hạn hiệu quả.',
    icon: UserCheck,
    colorClass: 'text-rose-600 border-rose-200',
    bgColorClass: 'bg-rose-50 hover:bg-rose-100',
  },
  {
    id: 'checkout_checklist',
    title: 'Checklist bàn giao/trả phòng',
    category: 'operational',
    description: 'Danh sách đồ gia dụng, dọn vệ sinh, chốt chỉ số điện nước cuối, trừ cọc khi check-out.',
    icon: CheckSquare,
    colorClass: 'text-cyan-600 border-cyan-200',
    bgColorClass: 'bg-cyan-50 hover:bg-cyan-100',
  },
  {
    id: 'landlord_report',
    title: 'Báo cáo gửi chủ đầu tư',
    category: 'operational',
    description: 'Kết xuất kết quả tài chính thực thu chi, tỷ lệ khai thác gửi chủ nhà/Landlord yên lòng.',
    icon: FileText,
    colorClass: 'text-teal-600 border-teal-200',
    bgColorClass: 'bg-teal-50 hover:bg-teal-100',
  },
];

export const AiAssistant: React.FC = () => {
  const { state } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'analysis' | 'draft' | 'operational'>('all');
  const [selectedAction, setSelectedAction] = useState<AIAction>('ai_analytics');
  
  // Custom Targeting Parameters for AI Analytics
  const [targetOccupancy, setTargetOccupancy] = useState<number>(90);
  const [targetProfit, setTargetProfit] = useState<number>(65);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(['pricing', 'marketing', 'operation']);
  
  // Interactive entities context inside UI
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  
  // AI query responses
  const [loading, setLoading] = useState<boolean>(false);
  const [errorString, setErrorString] = useState<string | null>(null);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Filter actions based on tab
  const filteredActions = AI_ACTIONS_METADATA.filter(
    (action) => activeTab === 'all' || action.category === activeTab
  );

  // List tenants with debts to select for remind_payment / debtor_analysis
  const debtors = state.tenants.filter((t) => {
    const tenantInvoices = state.invoices.filter((inv) => inv.tenantId === t.id);
    return tenantInvoices.some((inv) => inv.status === 'chưa thu' || inv.status === 'quá hạn');
  });

  // Simple Markdown to HTML preview converter just for layout formatting
  const parseSimpleMarkdown = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Bold headers
      .replace(/^### (.*$)/gim, '<h4 class="text-base font-bold text-slate-800 mt-4 mb-2">$1</h4>')
      .replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-blue-800 mt-5 mb-2 border-b border-blue-100 pb-1">$1</h3>')
      .replace(/^# (.*$)/gim, '<h2 class="text-xl font-black text-slate-900 mt-6 mb-3">$1</h2>')
      // Bold words
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      // Lists
      .replace(/^\s*\-\s*(.*$)/gim, '<li class="list-disc ml-5 mb-1.5 text-slate-700">$1</li>')
      .replace(/^\s*\d+\.\s*(.*$)/gim, '<li class="list-decimal ml-5 mb-1.5 text-slate-700">$1</li>')
      // Custom blockquotes
      .replace(/^\>\s*(.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 py-1 my-3 bg-blue-50/50 text-slate-600 italic rounded-r">$1</blockquote>')
      // Custom separator
      .replace(/---/g, '<hr class="border-slate-200 my-4" />')
      // Paragraph replacements
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('<h') || line.trim().startsWith('<li') || line.trim().startsWith('<block') || line.trim().startsWith('<hr') || !line.trim()) {
          return line;
        }
        return `<p class="mb-2.5 leading-relaxed text-slate-600 text-sm">${line}</p>`;
      })
      .join('\n');
  };

  const handleRunAi = async (action: AIAction) => {
    setLoading(true);
    setErrorString(null);
    setSelectedAction(action);
    setAiResponse('');

    // Pre-inject custom entities context info into customPrompt
    let dynamicPrompt = customPrompt ? `${customPrompt}\n` : '';
    if (action === 'remind_payment') {
      if (selectedTenantId) {
        const tenant = state.tenants.find(t => t.id === selectedTenantId);
        const room = state.rooms.find(r => r.id === tenant?.roomId);
        const invoice = state.invoices.find(i => i.tenantId === selectedTenantId && (i.status === 'chưa thu' || i.status === 'quá hạn'));
        if (tenant && room) {
          dynamicPrompt += `[LIÊN KẾT HỆ THỐNG] Vui lòng soạn mẫu tin nhắn cụ thể cho khách ${tenant.fullName}, Số điện thoại: ${tenant.phone}, Phòng: ${room.name}, Số tiền chưa thanh toán: ${(invoice?.totalAmount || room.basePrice).toLocaleString()} VNĐ, Tháng hóa đơn: ${invoice?.month || 'hiện tại'}, Hạn nộp: ${invoice?.dueDate || 'Ngày 05 hàng tháng'}.`;
        }
      }
    } else if (action === 'rent_contract') {
      if (selectedTenantId) {
        const tenant = state.tenants.find(t => t.id === selectedTenantId);
        const room = state.rooms.find(r => r.id === (selectedRoomId || tenant?.roomId));
        const b = state.buildings.find(b => b.id === room?.buildingId);
        if (tenant && room) {
          dynamicPrompt += `[LIÊN KẾT HỆ THỐNG] Vui lòng soạn hợp đồng cho Khách thuê: ${tenant.fullName}, CCCD: ${tenant.idCard}, Số điện thoại: ${tenant.phone}, Địa chỉ quê quán: ${tenant.hometown || 'Chưa rõ'}. Tòa nhà: ${b?.name || 'Vận hành tự do'}, Phòng: ${room.name}, Loại phòng: ${room.type}, Đơn giá: ${room.basePrice.toLocaleString()}đ, Tiền cọc: ${room.depositRequired.toLocaleString()}đ, Ngày ở: ${tenant.startDate}.`;
        }
      } else if (selectedRoomId) {
        const room = state.rooms.find(r => r.id === selectedRoomId);
        if (room) {
          dynamicPrompt += `[LIÊN KẾT HỆ THỐNG] Vui lòng soạn hợp đồng mẫu cho Phòng: ${room.name} thuộc tòa nhà dải quản lý, diện tích ${room.area}m², giá thuê ${room.basePrice.toLocaleString()}đ/tháng.`;
        }
      }
    }

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          state,
          customPrompt: dynamicPrompt,
          targetOccupancy,
          targetProfit,
          selectedStrategies,
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error || 'Gặp lỗi trong quá trình khởi chạy AI Co-Pilot.');
      }

      setAiResponse(resJson.result);
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || 'Không thể kết nối đến máy chủ AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!aiResponse) return;
    navigator.clipboard.writeText(aiResponse);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const currentActionMeta = AI_ACTIONS_METADATA.find(a => a.id === selectedAction);

  return (
    <div className="space-y-6" id="ai-co-pilot-page">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              Bộ Trợ Lý AI Co-Pilot <span className="text-[12px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold uppercase">Mạnh nhất</span>
            </h1>
            <p className="text-sm text-slate-500">
              Trợ lý ảo phân tích tối ưu vận hành, tư vấn tài chính, soạn thảo văn bản và hợp đồng dựa trên dữ liệu thật của tòa nhà.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left pane: Action controls & selectors */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-semibold text-slate-900 text-base">Chọn nghiệp vụ trợ lý AI</h2>
              <span className="text-slate-400 font-mono text-xs">{filteredActions.length} công cụ</span>
            </div>

            {/* Quick tabs */}
            <div className="flex flex-wrap gap-1 bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/50">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 text-center py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'all' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`flex-1 text-center py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'analysis' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Phân tích
              </button>
              <button
                onClick={() => setActiveTab('draft')}
                className={`flex-1 text-center py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'draft' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Soạn thảo
              </button>
              <button
                onClick={() => setActiveTab('operational')}
                className={`flex-1 text-center py-1.5 px-2 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'operational' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Vận hành
              </button>
            </div>

            {/* Action Tools Buttons List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                const isSelected = selectedAction === action.id;
                return (
                  <button
                    key={action.id}
                    onClick={() => {
                      setSelectedAction(action.id);
                      setErrorString(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-start gap-3 relative ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/70 shadow-2xs' 
                        : 'border-slate-150 bg-slate-50/50 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-md ${action.colorClass} border shrink-0 bg-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                        {action.title}
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{action.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Business context linking (Conditional inputs based on selected action) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
            <h2 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
              <span>Liên kết dữ liệu thực tế (Tùy chọn)</span>
            </h2>

            {selectedAction === 'remind_payment' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Chọn khách đợt trễ hạn nợ:</label>
                <select 
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                  value={selectedTenantId}
                  onChange={(e) => setSelectedTenantId(e.target.value)}
                >
                  <option value="">-- Click để chọn khách nợ chậm --</option>
                  {debtors.length > 0 ? (
                    debtors.map((d) => {
                      const room = state.rooms.find(r => r.id === d.roomId);
                      const inv = state.invoices.find(i => i.tenantId === d.id && (i.status === 'chưa thu' || i.status === 'quá hạn'));
                      return (
                        <option key={d.id} value={d.id}>
                          {d.fullName} (Phòng {room?.code || room?.name || '---'} {inv ? `- Nợ ${(inv.totalAmount - inv.paidAmount).toLocaleString()}đ` : ''})
                        </option>
                      );
                    })
                  ) : (
                    state.tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.fullName} (Phòng {state.rooms.find(r => r.id === t.roomId)?.name || '---'})</option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-500">
                  AI sẽ tích hợp nợ thực tế trong phiếu thu của khách này để điền mẫu tin gửi Zalo.
                </p>
              </div>
            )}

            {selectedAction === 'rent_contract' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Chọn khách thuê dự kiến:</label>
                  <select 
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    value={selectedTenantId}
                    onChange={(e) => {
                      setSelectedTenantId(e.target.value);
                      const t = state.tenants.find(x => x.id === e.target.value);
                      if (t) setSelectedRoomId(t.roomId);
                    }}
                  >
                    <option value="">-- Chọn khách thuê làm mẫu --</option>
                    {state.tenants.map((t) => {
                      const r = state.rooms.find(room => room.id === t.roomId);
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({r ? `Phòng ${r.name}` : 'Không phòng'})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Chọn phòng trọ liên kết hợp đồng:</label>
                  <select 
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-hidden"
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                  >
                    <option value="">-- Chọn phòng trọ khác --</option>
                    {state.rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} - {r.type} ({r.basePrice.toLocaleString()}đ/tháng)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {selectedAction === 'ai_analytics' && (
              <div className="space-y-4 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Tỷ lệ lấp đầy mục tiêu:</span>
                    <span className="text-blue-600 font-extrabold">{targetOccupancy}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="100" 
                    step="5"
                    className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                    value={targetOccupancy}
                    onChange={(e) => setTargetOccupancy(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-500 block">Tiêu chuẩn hệ thống để đo lường công suất khai thác khu nhà.</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700">Mục tiêu Biên Lợi nhuận:</span>
                    <span className="text-emerald-600 font-extrabold">{targetProfit}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="30" 
                    max="90" 
                    step="5"
                    className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg appearance-none"
                    value={targetProfit}
                    onChange={(e) => setTargetProfit(Number(e.target.value))}
                  />
                  <span className="text-[10px] text-slate-500 block">Biên lợi nhuận thuần ròng bảo hộ mục tiêu sinh lời.</span>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">Chiến lược đề xuất ưu tiên:</label>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStrategies(prev => 
                          prev.includes('pricing') ? prev.filter(x => x !== 'pricing') : [...prev, 'pricing']
                        );
                      }}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        selectedStrategies.includes('pricing') 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      📈 Định giá động
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStrategies(prev => 
                          prev.includes('marketing') ? prev.filter(x => x !== 'marketing') : [...prev, 'marketing']
                        );
                      }}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        selectedStrategies.includes('marketing') 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      📢 Tiếp thị phòng
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStrategies(prev => 
                          prev.includes('operation') ? prev.filter(x => x !== 'operation') : [...prev, 'operation']
                        );
                      }}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        selectedStrategies.includes('operation') 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      ⚙️ Tối ưu chi phí
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStrategies(prev => 
                          prev.includes('renovation') ? prev.filter(x => x !== 'renovation') : [...prev, 'renovation']
                        );
                      }}
                      className={`p-2 rounded-lg border text-left font-semibold transition-all ${
                        selectedStrategies.includes('renovation') 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      🔨 Nâng cấp tiện nghi
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-instruction user input adding prompt modifier */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Ý kiến chỉ đạo / Yêu cầu viết thêm (Tùy chọn):</label>
              <textarea
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-hidden h-20 resize-none placeholder:text-slate-400"
                placeholder="Ví dụ: 'Soạn nốt ngày gia hạn là 12 tháng', 'nhắc nhở thân mật xưng hô anh/em', 'bổ sung kiểm tra rò nước thiết bị vệ sinh'..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </div>

            {/* Large primary run button */}
            <button
              onClick={() => handleRunAi(selectedAction)}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] disabled:opacity-75 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI Co-Pilot đang suy nghĩ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-yellow-300" />
                  <span>Khởi chạy Trợ lý ảo AI {currentActionMeta?.title ? `(${currentActionMeta.title})` : ''}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right pane: Result Panel & Sandbox Preview */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden flex-1">
            {/* Action Bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600"></span>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">Màn hình xem trước báo cáo AI</span>
              </div>
              <div className="flex items-center gap-2">
                {aiResponse && (
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-bold">Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép kết quả</span>
                      </>
                    )}
                  </button>
                )}
                {aiResponse && (
                  <button
                    onClick={() => handleRunAi(selectedAction)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    title="Phát sinh lại"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Làm lại</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sandbox screen output area */}
            <div className="p-6 overflow-y-auto flex-1 bg-white min-h-[460px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                  <div className="p-4 bg-blue-50 rounded-full text-blue-600 animate-spin">
                    <Loader2 className="w-10 h-10" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-extrabold text-slate-800 text-base">Đang truyền tải dữ liệu và phân tích...</h3>
                    <p className="text-xs text-slate-500 max-w-sm">
                      Mạng nơ-ron Gemini 3.5 Flash đang tra cứu hồ sơ chuỗi trọ để biên soạn nội dung phù hợp tối đa.
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 text-xs font-mono text-slate-500 w-full max-w-xs text-center">
                    <span className="animate-pulse">
                      Status: CONNECT_SUCCESS ✔
                    </span>
                  </div>
                </div>
              ) : errorString ? (
                <div className="flex flex-col items-center justify-center text-center p-10 bg-red-50/50 rounded-2xl border border-dashed border-red-200/80 my-8 space-y-3">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                  <div className="space-y-1">
                    <h3 className="font-bold text-red-800 text-sm">Gặp sự cố cấu hình</h3>
                    <p className="text-xs text-red-700 max-w-md mx-auto">
                      {errorString}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500 max-w-xs mt-2">
                    Lưu ý: Bạn có thể cài đặt <code className="bg-slate-100 px-1 py-0.5 rounded text-red-600">GEMINI_API_KEY</code> ở Menu Cài Đặt (Secrets) góc trên bên phải giao diện AI Studio.
                  </div>
                </div>
              ) : aiResponse ? (
                <div className="space-y-4">
                  {/* Visual Category Label */}
                  <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-extrabold px-3 py-1 rounded-full w-fit uppercase">
                    <Sparkles className="w-3 h-3 text-blue-600 animate-pulse" />
                    <span>Kết quả từ Trợ lý Co-Pilot AI: {currentActionMeta?.title}</span>
                  </div>
                  {/* Formatted Text Box */}
                  <div 
                    className="prose max-w-full text-slate-700 markdown-body bg-slate-50/20 p-5 rounded-2xl border border-slate-100 select-text"
                    dangerouslySetInnerHTML={{ __html: parseSimpleMarkdown(aiResponse) }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-24 px-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200 shadow-3xs">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="font-extrabold text-slate-850 text-base">Hệ thống AI chưa được kích hoạt</h3>
                    <p className="text-xs text-slate-500">
                      Hãy bấm vào một công cụ nghiệp vụ AI ở danh sách bên trái (Ví dụ: <strong>"Tóm tắt kinh doanh tháng này"</strong>) rồi nhấn nút khởi chạy để AI tự động truy xuất dữ liệu tổng sổ để viết báo cáo.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick action helper bottom */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><Home className="w-3.5 h-3.5 text-slate-400" /> Hệ thống sẵn sàng</span>
              <span className="font-bold flex items-center gap-1 text-slate-600">Model: Gemini 3.5 Flash <Sparkles className="w-3 h-3 text-blue-500" /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
