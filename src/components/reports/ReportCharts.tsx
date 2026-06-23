import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

// Color themes
const COLOR_PALETTE = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280'];

interface ChartData {
  name: string;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  height?: number;
}

export const RevenueChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} />
          <Tooltip 
            formatter={(v: any) => [`${Number(v).toLocaleString()} đ`, '']} 
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }} 
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Bar dataKey="expected" name="Kế hoạch (Phải thu)" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="collected" name="Thực tế (Đã thu)" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DebtChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(1)}tr`} />
          <Tooltip 
            formatter={(v: any) => [`${Number(v).toLocaleString()} đ`, 'Tổng nợ']} 
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }} 
          />
          <Area type="monotone" dataKey="debt" stroke="#ef4444" fillOpacity={1} fill="url(#colorDebt)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const StatusPieChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  const nonemptyData = data.filter(d => d.value > 0);
  
  if (nonemptyData.length === 0) {
    return (
      <div className="flex items-center justify-center text-slate-450 h-full text-xs py-10">
        Không có dữ liệu trạng thái phòng.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="flex flex-col sm:flex-row items-center justify-around gap-2">
      <div className="w-[180px] h-[180px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={nonemptyData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {nonemptyData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v: any) => [`${v} phòng`, '']} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5 flex flex-col justify-center text-xs">
        {nonemptyData.map((item, index) => (
          <div key={item.name} className="flex items-center gap-2">
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ backgroundColor: COLOR_PALETTE[index % COLOR_PALETTE.length] }} 
            />
            <span className="text-slate-600 font-medium">{item.name}:</span>
            <span className="font-extrabold text-slate-800">{item.value} phòng ({item.percent || '---'}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CashflowChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} />
          <Tooltip 
            formatter={(v: any) => [`${Number(v).toLocaleString()} đ`, '']} 
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }} 
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Bar dataKey="income" name="Tổng Thu dòng tiền" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expense" name="Tổng Chi vận hành" fill="#ef4444" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const ProfitChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}tr`} />
          <Tooltip 
            formatter={(v: any) => [`${Number(v).toLocaleString()} đ`, 'Lợi nhuận ròng']} 
            contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, borderColor: '#cbd5e1', fontSize: 12 }} 
          />
          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const UtilityChart: React.FC<ChartProps> = ({ data, height = 280 }) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis yAxisId="left" stroke="#3b82f6" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} kWh`} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} tickLine={false} tickFormatter={(v) => `${v} m³`} />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
          <Line yAxisId="left" type="monotone" dataKey="electric" name="Điện tiêu thụ (kWh)" stroke="#3b82f6" strokeWidth={2.5} />
          <Line yAxisId="right" type="monotone" dataKey="water" name="Nước tiêu thụ (m³)" stroke="#10b981" strokeWidth={2.5} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
