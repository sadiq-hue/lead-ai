import { TrendingUp, TrendingDown, DollarSign, ArrowUp } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const revenueExpenseData = [
  { month: "Jan", revenue: 32000, expenses: 18000 },
  { month: "Feb", revenue: 35000, expenses: 19000 },
  { month: "Mar", revenue: 38000, expenses: 20000 },
  { month: "Apr", revenue: 45500, expenses: 22900 },
];

const expenseBreakdown = [
  { category: "Inventory", value: 8500, color: "hsl(var(--chart-1))" },
  { category: "Marketing", value: 6200, color: "hsl(var(--chart-2))" },
  { category: "Operations", value: 4800, color: "hsl(var(--chart-3))" },
  { category: "Salaries", value: 2400, color: "hsl(var(--chart-4))" },
  { category: "Other", value: 1000, color: "hsl(var(--chart-5))" },
];

const insights = [
  { text: "Revenue increased by 20% this week", type: "positive" },
  { text: "Top expense category: Inventory ($8,500)", type: "neutral" },
  { text: "Cash flow is 24% higher than last month", type: "positive" },
  { text: "Marketing costs decreased by 12%", type: "positive" },
];

export function Finance() {
  const totalRevenue = revenueExpenseData[revenueExpenseData.length - 1].revenue;
  const totalExpenses = revenueExpenseData[revenueExpenseData.length - 1].expenses;
  const profit = totalRevenue - totalExpenses;
  const profitMargin = ((profit / totalRevenue) * 100).toFixed(1);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Financial Dashboard</h1>
        <p className="text-muted-foreground">Simple, clear insights into your business finances</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <div className="p-6 border border-border rounded-xl bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Monthly Revenue</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">${(totalRevenue / 1000).toFixed(1)}k</span>
              <span className="text-sm text-green-600 flex items-center gap-1">
                <ArrowUp className="w-3 h-3" />
                20%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">vs last month</p>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Monthly Expenses</span>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">${(totalExpenses / 1000).toFixed(1)}k</span>
            </div>
            <p className="text-sm text-muted-foreground">April 2026</p>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Net Profit</span>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-green-600">${(profit / 1000).toFixed(1)}k</span>
            </div>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Profit Margin</span>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold">{profitMargin}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Healthy margin</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 p-6 border border-border rounded-xl bg-card">
          <h3 className="mb-6">Revenue vs Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-2))" strokeWidth={3} name="Revenue" />
              <Line type="monotone" dataKey="expenses" stroke="hsl(var(--chart-1))" strokeWidth={3} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 border border-border rounded-xl bg-card">
          <h3 className="mb-6">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {expenseBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {expenseBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.category}</span>
                </div>
                <span className="font-medium">${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border border-border rounded-xl bg-card">
        <h3 className="mb-6">Financial Insights</h3>
        <div className="grid grid-cols-2 gap-4">
          {insights.map((insight, i) => (
            <div key={i} className="p-4 rounded-lg bg-accent/50 flex items-start gap-3">
              <div
                className={`p-2 rounded-lg flex-shrink-0 ${
                  insight.type === "positive" ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                }`}
              >
                <TrendingUp className="w-5 h-5" />
              </div>
              <p className="text-sm">{insight.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Cash on Hand</p>
          <p className="text-2xl font-semibold">$68,400</p>
          <p className="text-sm text-green-600 mt-1">+$12,300 this month</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Outstanding Invoices</p>
          <p className="text-2xl font-semibold">$8,400</p>
          <p className="text-sm text-muted-foreground mt-1">2 pending payments</p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <p className="text-muted-foreground mb-2">Recurring Revenue</p>
          <p className="text-2xl font-semibold">$22,000</p>
          <p className="text-sm text-muted-foreground mt-1">Monthly average</p>
        </div>
      </div>
    </div>
  );
}
