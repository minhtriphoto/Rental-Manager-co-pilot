/**
 * ReportExporter.ts
 * Premium client-side data exporter utilities for Excel (CSV) and styled PDF document printing.
 */

export const exportToCSV = (headers: string[], rows: (string | number)[][], fileName: string) => {
  // UTF-8 BOM representation so Microsoft Excel correctly renders Vietnamese diacritics
  const BOM = '\uFEFF';
  const csvContent = BOM + rows.map(row => 
    row.map(value => {
      const stringValue = String(value ?? '').replace(/\n/g, ' ');
      // Escape enclosing double quotes
      return `"${stringValue.replace(/"/g, '""')}"`;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export interface MetricItem {
  label: string;
  value: string;
}

export const exportToPDF = (reportTitle: string, tableHTML: string, summaryMetrics: MetricItem[]) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Không thể mở cửa sổ in ấn. Vui lòng tắt trình chặn pop-up của trình duyệt.');
    return;
  }
  
  const metricsHTML = summaryMetrics.map(m => `
    <div style="border: 1px solid #cbd5e1; padding: 12px; border-radius: 8px; text-align: center; background-color: #f8fafc; flex: 1; min-width: 140px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
      <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">${m.label}</div>
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${m.value}</div>
    </div>
  `).join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${reportTitle}</title>
        <style>
          body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #334155; line-height: 1.5; font-size: 13px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #cbd5e1; padding-bottom: 15px; }
          .title { font-size: 26px; font-weight: 800; color: #1e3a8a; margin: 0; text-transform: uppercase; letter-spacing: 0.02em; }
          .subtitle { font-size: 12px; color: #64748b; margin-top: 6px; font-weight: 500; }
          .metrics-grid { display: flex; gap: 16px; margin-bottom: 30px; flex-wrap: wrap; }
          .report-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
          .report-table th { background-color: #f1f5f9; color: #334155; font-weight: 700; text-align: left; padding: 10px 8px; border: 1px solid #94a3b8; text-transform: uppercase; font-size: 10px; }
          .report-table td { padding: 9px 8px; border: 1px solid #cbd5e1; color: #1e293b; }
          .report-table tr:nth-child(even) { background-color: #f8fafc; }
          .badge-unpaid { background-color: #fee2e2; color: #991b1b; padding: 2px 6px; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 9px; border: 1px solid #fca5a5; }
          .badge-paid { background-color: #d1fae5; color: #065f46; padding: 2px 6px; font-weight: bold; border-radius: 4px; text-transform: uppercase; font-size: 9px; border: 1px solid #6ee7b7; }
          .badge-text { font-weight: bold; font-size: 11px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .footer { text-align: center; margin-top: 50px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          .signature-section { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; padding: 0 40px; }
          .sig-box { text-align: center; width: 220px; }
          .sig-title { font-weight: bold; color: #475569; margin-bottom: 60px; }
          .sig-name { font-weight: bold; color: #0f172a; border-top: 1px dashed #cbd5e1; padding-top: 6px; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${reportTitle}</div>
          <div class="subtitle">Báo cáo hệ thống trích xuất ngày: ${new Date().toLocaleDateString('vi-VN')} | Người lập biểu: Quản lý tối cao</div>
        </div>
        
        <div class="metrics-grid">
          ${metricsHTML}
        </div>
        
        <div style="margin-top: 15px;">
          ${tableHTML}
        </div>

        <div class="signature-section">
          <div class="sig-box">
            <div class="sig-title font-bold">Người Lập Biểu</div>
            <div class="sig-name">Ký và ghi rõ họ tên</div>
          </div>
          <div class="sig-box">
            <div class="sig-title font-bold">Quản Trị Viên Hệ Thống</div>
            <div class="sig-name">Nguyễn Văn Quản Lý</div>
          </div>
        </div>
        
        <div class="footer">
          Trang báo cáo chính thức được cung cấp và kiểm định bởi hệ thống Rental Manager.
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
