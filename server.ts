import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON parsing
app.use(express.json({ limit: '10mb' }));

// Helper to safely obtain GoogleGenAI client (lazy initialization)
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Cảnh báo: GEMINI_API_KEY chưa được đặt trong Settings > Secrets. Vui lòng cập nhật biến môi trường này.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Assistant endpoint supporting the 9 requested features & custom AI Analytics
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { action, state, customPrompt, targetOccupancy, targetProfit, selectedStrategies } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Thiếu tham số action.' });
    }

    // Lazy load the Gemini client. If it fails due to missing API key, return a pretty error message
    let ai;
    try {
      ai = getGeminiClient();
    } catch (keyErr: any) {
      return res.status(500).json({
        error: keyErr.message || 'Thiếu GEMINI_API_KEY',
        isKeyMissing: true,
      });
    }

    // Compact the received state into a readable context representation for the model to minimize token size
    const buildingsSummary = state?.buildings?.map((b: any) => `- Tòa: ${b.name}, Quản lý: ${b.manager}, Tổng số phòng: ${b.totalRooms}, Trạng thái: ${b.status}`).join('\n') || 'Chưa có thông tin tòa nhà.';
    
    const roomsSummary = state?.rooms?.map((r: any) => {
      const bName = state?.buildings?.find((b: any) => b.id === r.buildingId)?.name || 'Khu chung';
      return `- Phòng ${r.name} (${r.type}, Tầng ${r.floor}): Diện tích ${r.area}m², Giá gốc ${r.basePrice.toLocaleString()}đ, Trạng thái: ${r.status}. Thiết bị: ${r.furnitureDescription || 'Cơ bản'}`;
    }).join('\n') || 'Chưa có thông tin phòng.';

    const liveTenants = state?.tenants?.filter((t: any) => t.status === 'đang thuê') || [];
    const tenantsSummary = liveTenants.map((t: any) => {
      const rName = state?.rooms?.find((r: any) => r.id === t.roomId)?.name || 'Chưa xếp phòng';
      return `- Khách: ${t.fullName} (${t.job || 'Tự do'} - ${t.workplace || 'Chưa có nơi làm việc'} - CCCD: ${t.idCard} - Quê: ${t.hometown || 'Chưa rõ'}), Phòng: ${rName}, Đại diện HĐ: ${t.isRepresentative ? 'Có' : 'Không'}, Điện thoại: ${t.phone}`;
    }).join('\n') || 'Chưa có thông tin khách đang thuê.';

    const activeContracts = state?.contracts?.filter((c: any) => c.status === 'còn hiệu lực' || c.status === 'sắp hết hạn') || [];
    const contractsSummary = activeContracts.map((c: any) => {
      const rName = state?.rooms?.find((r: any) => r.id === c.roomId)?.name || '---';
      const tName = state?.tenants?.find((t: any) => t.id === c.representativeId)?.fullName || 'Đại diện';
      return `- HĐ Phòng ${rName}, Đại diện: ${tName}, Thời hạn: ${c.startDate} đến ${c.endDate}, Giá ký: ${c.price.toLocaleString()}đ, Tiền cọc: ${c.deposit.toLocaleString()}đ, Chu kỳ đóng: ${c.paymentCycle}, Trạng thái: ${c.status}`;
    }).join('\n') || 'Chưa có hợp đồng nào còn hiệu lực.';

    const currentInvoices = state?.invoices || [];
    const invoicesSummary = currentInvoices.map((i: any) => {
      const rName = state?.rooms?.find((r: any) => r.id === i.roomId)?.name || '---';
      const tName = state?.tenants?.find((t: any) => t.id === i.tenantId)?.fullName || 'Khách thuê';
      return `- Phiếu thu Tháng ${i.month} - Phòng ${rName} (${tName}): Tổng phải đóng ${i.totalAmount.toLocaleString()}đ, Đã thu ${i.paidAmount.toLocaleString()}đ, Trạng thái đóng: ${i.status}, Hạn nộp: ${i.dueDate}`;
    }).join('\n') || 'Chưa có thông tin hóa đơn thu chi hàng tháng.';

    const activeMaintenances = state?.maintenances || [];
    const maintenancesSummary = activeMaintenances.map((m: any) => {
      const rName = state?.rooms?.find((r: any) => r.id === m.roomId)?.name || '---';
      return `- Sự cố Phòng ${rName}: nội dung "${m.description}" (${m.type}), Mức độ: ${m.priority}, Chi phí phát sinh: ${m.cost.toLocaleString()}đ, Khách báo: ${m.reporterName}, Khắc phục bởi: ${m.handlerName || 'Chưa phân công'}, Hiện trạng: ${m.status}`;
    }).join('\n') || 'Không có sự cố bảo trì nào ghi nhận.';

    const cashTransactions = state?.transactions || [];
    const transactionsSummary = cashTransactions.slice(-25).map((t: any) => {
      const rName = t.roomId ? (state?.rooms?.find((r: any) => r.id === t.roomId)?.name || '') : '';
      return `- Ngày ${t.date} ${t.type.toUpperCase()}: Danh mục "${t.category}" - Số tiền: ${t.amount.toLocaleString()}đ. Chi tiết: ${t.notes}${rName ? ` (Phòng ${rName})` : ''} - Thanh toán: ${t.paymentMethod}`;
    }).join('\n') || 'Chưa có giao dịch thu chi nào.';

    const systemInstruction = `Bạn là Trợ lý AI Co-Pilot đắc lực được tích hợp trong Hệ thống quản lý phòng trọ Rental Manager.
Bạn giao tiếp bằng tiếng Việt, có giọng điệu lịch sự, vô cùng chuyên nghiệp, phân tích thực tế dựa trên số liệu thực tế được cung cấp phía dưới, không lặp lại lý thuyết sáo rỗng.
Mọi phân tích, gợi ý, tin nhắn viết ra hay văn bản đều được trình bày bằng định dạng Markdown lôi cuốn, có bố cục rõ ràng, chuyên sâu. Hãy tập trung giải quyết đúng việc được yêu cầu.`;

    let actionPrompt = '';

    switch (action) {
      case 'summarize': {
        const d = new Date();
        const currentMonthString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        actionPrompt = `
Hãy viết một bản "TÓM TẮT TÌNH HÌNH KINH DOANH THÁNG NÀY" (${currentMonthString}).
Yêu cầu phân tích thiết thực từ dữ liệu sau:
- Tổng số tòa nhà đang hoạt động
- Tổng số phòng, tỷ lệ lấn đầy thực tế (% số phòng đang thuê)
- Doanh thu theo hóa đơn tháng này: Tổng số tiền phải thu, tổng số tiền thực tế đã thu, tổng số nợ đứt quãng chưa đóng.
- Dòng tiền thực tế từ sổ nhật ký: Tổng thu, Tổng chi phát sinh, Thặng dư ngân sách có tương thích?
- Các sự cố bảo trì phát sinh nổi bật nào cần xử lý gấp.

Cấu trúc bài viết:
1. Tổng quan các chỉ số sức khỏe của chuỗi phòng trọ bằng Bullet points thu hút.
2. 3 Điểm sáng nổi bật về vận hành/tài chính.
3. 2 Điểm rủi ro/lưu ý vận hành cần xử lý gấp kèm khuyến nghị hành động nhanh.
`;
        break;
      }
      case 'underperforming': {
        actionPrompt = `
Hãy lập bản "BÁO CÁO PHÂN TÍCH PHÒNG KÉM HIỆU QUẢ".
Dựa trên thông tin tất cả phòng trọ, hợp đồng, sự cố bảo trì, các hóa đơn chưa hoàn thành.
Hãy chỉ mặt đặt tên cụ thể các phòng đang vận hành kém hiệu quả vì một trong các lý do sau:
- Có công nợ chậm trả kéo dài hoặc tích tụ lâu.
- Có chi phí sửa chữa bảo trì quá cao so với giá cho thuê gốc.
- Phòng đang để trống kéo dài không phát sinh hợp đồng hoặc hay thay đổi khách thuê dẫn đến tốn thời gian môi giới.
- Giá cho thuê hiện tại đang bị thỏa thuận thấp hơn hẳn mặt bằng chung của tòa nhà hoặc phân khúc phòng cùng loại.

Hãy đề xuất danh sách ít nhất 2 phòng kém hiệu quả cụ thể và đề xuất 3 giải pháp cải tiến thích ứng (ví dụ: đôn đốc thanh toán, tăng giá khi tái ký, sang sửa nâng cấp nội thất, kiểm tra chất lượng hệ thống kỹ thuật để tránh hỏng vặt).
`;
        break;
      }
      case 'suggest_rent': {
        actionPrompt = `
Hãy lập bản "PHƯƠNG ÁN GỢI Ý ĐIỀU CHỈNH GIÁ THUÊ TỐI ƯU".
Hãy phân tích cơ cấu lấp đầy hiện tại (tổng phòng đang thuê / tổng số phòng) và đánh giá chi phí sửa chữa liên tục của các phòng.
Hãy đưa ra một chiến lược tăng giá thuê phòng một cách khoa học:
- Nếu tỷ lệ lấp đầy tòa nhà > 90% (cho thấy cầu cao hơn cung), có thể đề xuất tăng giá 5 - 10% khi gia hạn hợp đồng mới.
- Đề xuất tăng giá cho các loại phòng có hiệu suất sinh lời thấp nhưng có vị trí hoặc thiết bị tiện nghi tốt.
- Những phòng có lịch sử chi phí bảo trì hỏng vặt cao thì có thể bổ sung phụ phí dịch vụ vận hành hoặc tăng giá tương đối để bù đắp khấu hao.

Hãy đưa ra bảng đề xuất điều chỉnh cụ thể cho từng hạng phòng (Phòng đơn, Phòng đôi, Studio, Căn hộ mini, Căn hộ dịch vụ) kèm mức tăng chi tiết và lộ trình áp dụng ôn hòa để tránh khách thuê phản ứng tiêu cực.
`;
        break;
      }
      case 'remind_payment': {
        actionPrompt = `
Hãy soạn thảo "3 MẪU TIN NHẮN NHẮC NỢ TIỀN NHÀ LỊCH SỰ & HIỆU QUẢ".
${customPrompt ? `Yêu cầu bổ sung của người dùng: ${customPrompt}` : ''}
Hãy thiết kế 3 mẫu tin nhắn ứng với 3 mức độ thúc giục tăng dần:
- MẪU 1 (Trước hạn trả 2 ngày): Thân thiện, nhắc nhẹ lịch sự chuẩn bị tài chính để đóng tiền phòng.
- MẪU 2 (Vào đúng ngày hạn nộp hoặc quá hạn 1 ngày): Trang trọng, thẳng thắn, nhắc nhở phòng đã đến kỳ hạn và cung cấp số tài khoản chuyển khoản.
- MẪU 3 (Trễ hạn quá 5 ngày - Đôn đốc tăng cường): Gửi lời cảnh báo nghiêm túc, đề xuất phạt đóng chậm theo hợp đồng hoặc tạm dừng các dịch vụ/điện nước hoặc chấm dứt hợp đồng nếu không liên hệ thanh toán trước mốc cụ thể.

Mỗi mẫu hãy để các placeholder dạng [Tên Khách Thuê], [Số Phòng], [Số Tiền], [Tháng Hóa Đơn], [Hạn Nộp], [Số TÀI KHOẢN] để người dùng sao chép nhanh, đồng thời thử điền một ví dụ cụ thể dựa trên một khách đang nợ tiền phòng trong hệ thống của tôi.
`;
        break;
      }
      case 'building_rules': {
        actionPrompt = `
Hãy soạn thảo một bản "BẢN NỘI QUY NHỮNG QUY ĐỊNH CHUNG CỦA TOÀ NHÀ TRỌ / CHUNG CƯ MINI" chuyên nghiệp, ngắn gọn, súc tích và cực kỳ bài bản.
Bản nội quy cần nhấn mạnh các khía cạnh cốt lõi sau:
1. AN NINH - TRẬT TỰ: Giờ mở/đóng cửa cổng, khóa chốt vân tay/thẻ từ, kiểm soát đưa người ngoài vào nghỉ lại qua đêm (phải đăng ký quản lý), giữ gìn trật tự và hạn chế tiếng ồn sau 22h đêm.
2. AN TOÀN TRĂM PHẦN TRĂM VỀ PHÒNG CHÁY CHỮA CHÁY (PCCC): Các quy tắc về sạc xe điện (mốc giờ cho phép, không sạc qua đêm không có người), vị trí đun nấu, không trữ chất dễ cháy, ngắt cầu dao thiết bị điện không dùng khi ra khỏi phòng.
3. VỆ SINH CHUNG & MÔI TRƯỜNG: Vứt rác đúng giờ đúng nơi quy định, không để rác ngoài hành lang chung làm cản lối đi và bốc mùi, đỗ xe gọn gàng ở hầm xe, bảo vệ cây xanh/tài sản chung.

Văn phong cứng rắn nhưng tôn trọng lợi ích chung, trình bày rõ ràng từng phần để dán bảng tin hành lang hoặc đăng vào nhóm Zalo cư dân.
`;
        break;
      }
      case 'rent_contract': {
        actionPrompt = `
Hãy soạn một mẫu "HỢP ĐỒNG THUÊ PHÒNG TRỌ / NHÀ Ở STANDARD" chuẩn pháp lý tại Việt Nam.
${customPrompt ? `Yêu cầu cụ thể điền thông tin hợp đồng: ${customPrompt}` : ''}
Căn cứ hợp đồng phải chặt chẽ, đầy đủ các mục lớn:
- Quốc hiệu, Tiêu ngữ, Tên hợp đồng: HỢP ĐỒNG THUÊ PHÒNG TRỌ
- Bên A (Bên cho thuê): [Chủ nhà / Quản lý]
- Bên B (Bên thuê): [Hãy trích xuất thông tin một khách thuê cụ thể làm ví dụ nếu hợp đồng liên kết]
- Điều 1: Đối tượng hợp đồng (Diện tích phòng, tòa nhà, thiết bị bàn giao)
- Điều 2: Giá thuê, tiền cọc, chu kỳ thanh toán và ngày thanh toán định kỳ.
- Điều 3: Quyền và nghĩa vụ của bên thuê (Tuân thủ nội quy, PCCC, không tự ý cải tạo phòng)
- Điều 4: Quyền và nghĩa vụ của bên cho thuê (Bàn giao phòng đúng hẹn, hỗ trợ đăng ký tạm trú, bảo trì hạ tầng lớn)
- Điều 5: Đơn phương chấm dứt hợp đồng, phạt phá vỡ hợp đồng và thanh lý tiền đặt cọc (Bồi thường cọc nếu đi trước hạn).
- Điều 6: Điều khoản thi hành và ký tên.

Bản hợp đồng cần được trình bày cực kỳ chỉn chu, chuyên nghiệp sẵn sàng in ấn sử dụng ngay.
`;
        break;
      }
      case 'debtor_analysis': {
        actionPrompt = `
Hãy lập bản "BÁO CÁO PHÂN TÍCH RỦI RO KHÁCH NỢ LÂU NGÀY VÀ PHƯƠNG ÁN XỬ LÝ SỰ CỐ".
Sử dụng dữ liệu hóa đơn chưa thanh toán, danh sách nợ và ngày trễ nợ để:
- Xác định những khách thuê đang có khoản nợ đọng lớn nhất hoặc kéo dài nhất (số ngày trễ hạn cao).
- Đánh giá phân loại mức độ rủi ro thu hồi công nợ theo các cấp độ: Rất Cao (Trễ > 15 ngày, lảng tránh), Cao (Trễ 7-15 ngày), Trung Bình (Trễ dưới 7 ngày).
- Đề xuất lộ trình xử lý nợ đọng thông minh cho từng trường hợp:
  + Giai đoạn 1: Liên hệ hỗ trợ thỏa thuận trả góp chia nhỏ dòng tiền.
  + Giai đoạn 2: Khấu trừ trực tiếp chi phí nợ vào % tiền đặt cọc hiện có trong hợp đồng làm quỹ bảo hiểm.
  + Giai đoạn 3: Ra tối hậu thư dừng cấp dịch vụ phụ trợ hoặc thu hồi phòng sớm để bảo lưu tiền đặt cọc còn lại.

Hãy đưa ra giải pháp bảo toàn dòng tiền một cách thực chiến và ôn hòa nhất.
`;
        break;
      }
      case 'checkout_checklist': {
        actionPrompt = `
Hãy soạn thảo "BẢN CHECKLIST BÀN GIAO THIẾT BỊ VÀ THỦ TỤC TRẢ PHÒNG (CHECK-OUT CO-PILOT)".
Checklist cần phân chia rõ ràng thành các đầu mục kiểm tra thực địa giúp quản lý phòng tránh bỏ sót khi khách dọn đi:
1. KIỂM TRA TOÀN DIỆN DIỆN MẠO PHÒNG: Tường có bị vẽ bẩn, khoan đục trái phép hay ẩm mốc nghiêm trọng? Trần nhà, sàn gạch có nứt vỡ? Cửa chính, cửa sổ có hoạt động an toàn? Vệ sinh có được dọn dẹp sạch sẽ trả về trạng thái bàn giao ban đầu?
2. KIỂM TRA ĐỒ ĐẠC, TÀI SẢN & THIẾT BỊ ĐIỆN VẬN HÀNH:
   - Điều hòa (kiểm tra điều khiển, độ mát, lưới lọc bụi).
   - Tủ lạnh, lò vi sóng ( sạch sẽ, làm mát tốt).
   - Bình nóng lạnh (hoạt động làm ấm nhanh, an toàn tủ mát rò điện).
   - Giường tủ gỗ, kệ bếp ( không gập gãy, trầy xước quá mức hao mòn tự nhiên).
3. CHỐT CHỈ SỐ ĐIỆN NƯỚC CUỐI CÙNG: Lưu trữ chỉ số mới nhất, tính toán nhanh điện nước phát sinh từ đầu tháng đến ngày check-out.
4. THU HỒI CHÌA KHÓA, THẺ TỪ, KHÓA CỔNG CHUNG.
5. PHẦN TÍNH TOÁN QUYẾT TOÁN TÀI CHÍNH THANH LÝ: Công thức chi tiết (Tiền cọc hoàn trả = Tiền cọc gốc - Tiền phòng nợ - Tiền điện nước phát sinh - Tiền bồi thường hư hại đồ đạc).

Hãy trình bày dưới dạng bảng hoặc checkbox đẹp mắt.
`;
        break;
      }
      case 'landlord_report': {
        actionPrompt = `
Hãy soạn thảo một bản "BÁO CÁO VẬN HÀNH & KẾT QUẢ TÀI CHÍNH GỬI CHỦ ĐẦU TƯ / CHỦ NHÀ" (Owner Monthly Performance Report).
Dựa trên thông tin hóa đơn thu chi, tỷ lệ lấp đầy phòng, sự cố sửa chữa, hãy biên soạn một báo cáo gửi chủ nhà một cách trịnh trọng và ngắn gọn:
- Tình trạng lấp đầy tổng thể của khu nhà (ví dụ: Đang khai thác bao nhiêu phòng trên tổng số, tỷ lệ trống).
- Tổng kết tài chính thực tế: Doanh thu thực tế đã thu được là bao nhiêu, chi phí vận hành giải ngân (vệ sinh, bảo dưỡng, quản lý) là bao nhiêu, và lợi nhuận thuần chuyển khoản về tài khoản chủ đầu tư là bao nhiêu.
- Các sửa đổi kết cấu kỹ thuật chính hoặc bảo trì tài sản lớn đã hoàn tất trong tháng này để bảo hộ giá trị tài sản ròng của chủ nhà.
- Dự đoán triển vọng tháng tiếp theo và kiến nghị để giữ chân khách thuê, tối ưu hóa công năng khu nhà.

Trình bày chuyên nghiệp để chủ đầu tư đọc xong cực kỳ yên tâm và đánh giá cao năng lực quản lý của bạn.
`;
        break;
      }
      case 'ai_analytics': {
        const strategyLines = selectedStrategies && selectedStrategies.length > 0 
          ? selectedStrategies.map((s: string) => `- Chiến lược tập trung: ${s}`).join('\n') 
          : 'Không chọn chiến lược cụ thể.';
        actionPrompt = `
Hãy lập bản "BÁO CÁO PHÂN TÍCH TỶ LỆ LẤP ĐẦY, DOANH THU, CHI PHÍ VÀ CHIẾN LƯỢC TỐI ƯU AI".
Các tham số cấu hình mục tiêu hệ thống do Quản lý thiết lập:
- Tỷ lệ lấp đầy mục tiêu: ${targetOccupancy || '90'}%
- Mục tiêu Biên lợi nhuận mong muốn: ${targetProfit || '60'}%
- Các chiến lược ưu tiên lựa chọn:
${strategyLines}

Hãy phân tích chi tiết dữ liệu thực tế được cung cấp trong hệ thống:
1. ĐÁNH GIÁ TỶ LỆ LẤP ĐẦY (OCCUPANCY RATE): Tính tỷ suất lấp đầy thực tế từ danh sách phòng đang thuê trên tổng số phòng. So sánh cụ thể với Tỷ lệ lấp đầy mục tiêu (${targetOccupancy || '90'}%). Giải thích nguyên nhân trống hiện tại.
2. PHÂN TÍCH DOANH THU & CHI PHÍ TRỰC QUAN: 
   - Đánh giá dòng tài chính tổng thể: Tổng tiền phải thu, tiền thực tế đã thu, và tổng chi phí vận hành bảo trì dồn từ sửa chữa hay transactions có loại 'chi'.
   - Đánh giá biên lợi nhuận thực tế thu về đối sánh với Mục tiêu Biên lợi nhuận mong muốn (${targetProfit || '60'}%).
3. CHỈ MẶT ĐẶT TÊN CÁC PHÒNG KÉM HIỆU QUẢ (UNDERPERFORMING ROOMS): Liệt kê và phân tích cụ thể từng phòng đang vận hành kém hiệu quả dựa trên:
   - Phòng để trống kéo dài, không tạo ra doanh thu.
   - Phòng có công nợ khó thu hồi lớn hoặc chậm nộp tiền kéo dài quá mức.
   - Phòng có chi phí sửa chữa dồn dập, ăn mòn nghiêm trọng vào doanh thu phòng.
   - Phòng có giá cho thuê thực tế thấp hơn giá trị cơ sở/basePrice trong sơ đồ do thỏa thuận lịch sử quá thấp.
4. ĐỀ XUẤT CHIẾN LƯỢC CẢI TIỆN ĐỘT PHÁ (ACTIONABLE STRATEGIES): 
   - Đề xuất Định giá động (Dynamic Pricing Adjustments): Đưa ra các mốc điều chỉnh giá thuê linh hoạt và cơ chế tăng giảm thích hợp.
   - Đề xuất Tiếp thị mục tiêu (Targeted Marketing): Thiết kế các chiến dịch quảng bá phòng trống, các uỷ đãi thu hút và cách tiếp cận khách nhanh chóng.
   - Các kịch bản tối ưu chi phí vận hành bảo trì và các chính sách kích thích giữ chân khách thuê trung thành dài hạn.

Yêu cầu trình bày báo cáo cực kỳ trực quan, văn phong chuyên nghiệp và sát sườn số liệu thực, sử dụng markdown định dạng đẹp mắt (tiêu đề, thẻ blockquote, danh sách bullet points, bảng biểu nếu cần).
`;
        break;
      }
      default:
        actionPrompt = `Chào bạn, tôi là Co-Pilot quản lý nhà trọ. Hãy chọn một tính năng để khởi động phân tích nhé!`;
    }

    if (customPrompt) {
      actionPrompt += `\n\n**Ý kiến chỉ đạo thêm của Quản lý trọ:**\n${customPrompt}`;
    }

    // Context summary to pass to Gemini
    const finalPrompt = `
DƯ LIỆU THỰC TẾ TRONG HỆ THỐNG QUẢN LÝ NHÀ TRỌ (RENTAL MANAGER):

=== THÔNG TIN KHU NHÀ / TOÀ NHÀ ===
${buildingsSummary}

=== THÔNG TIN SƠ ĐỒ PHÒNG TRỌ ===
${roomsSummary}

=== DANH SÁCH KHÁCH THUÊ HIỆN TẠI ===
${tenantsSummary}

=== HỢP ĐỒNG CHO THUÊ ĐANG HIỆU LỰC ===
${contractsSummary}

=== LỊCH SỬ PHIẾU THU & HÓA ĐƠN THÁNG ===
${invoicesSummary}

=== CÁC SỰ CỐ TIẾP NHẬN BẢO TRÌ ===
${maintenancesSummary}

=== NHẬT KÝ GIAO DỊCH THU CHI ===
${transactionsSummary}

---

YÊU CẦU THỰC HIỆN:
${actionPrompt}
`;

    // Process using gemini-3.5-flash as default model (Basic Text & Report tasks)
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.2, // Slightly deterministic/precise for structured financial analyses
      },
    });

    const aiText = response.text;
    res.json({ result: aiText });

  } catch (error: any) {
    console.error('Gemini API Error in Server:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý AI trên máy chủ.' });
  }
});

// Serve frontend assets and listen
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind to host 0.0.0.0 and port 3000
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Fullstack Enterprise Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
