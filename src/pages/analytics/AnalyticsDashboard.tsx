import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Package, DollarSign, Users, Wrench } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

const COLORS = ["#1e3a5f", "#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function AnalyticsDashboard() {
  const [jobsByStatus, setJobsByStatus] = useState<any[]>([]);
  const [monthlyJobs, setMonthlyJobs] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [topBrands, setTopBrands] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalJobs: 0, totalRevenue: 0, totalExpenses: 0, totalCustomers: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Fetch all jobs
    const { data: jobs } = await supabase.from("jobs").select("*");
    const { data: expenses } = await supabase.from("expenses").select("amount");
    const { data: clients } = await supabase.from("clients").select("id");

    if (!jobs) { setLoading(false); return; }

    // Stats
    const totalRevenue = jobs.reduce((s, j) => s + (Number(j.receive_amount) || 0), 0);
    const totalExpenses = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
    setStats({ totalJobs: jobs.length, totalRevenue, totalExpenses, totalCustomers: (clients || []).length });

    // Jobs by status
    const statusMap: Record<string, number> = {};
    jobs.forEach(j => { statusMap[j.status] = (statusMap[j.status] || 0) + 1; });
    setJobsByStatus(Object.entries(statusMap).map(([name, value]) => ({ name, value })));

    // Monthly jobs (last 6 months)
    const monthly: Record<string, { month: string; jobs: number; revenue: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(new Date(), i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yy");
      monthly[key] = { month: label, jobs: 0, revenue: 0 };
    }
    jobs.forEach(j => {
      const key = j.job_date?.substring(0, 7);
      if (key && monthly[key]) {
        monthly[key].jobs++;
        monthly[key].revenue += Number(j.receive_amount) || 0;
      }
    });
    const monthlyArr = Object.values(monthly);
    setMonthlyJobs(monthlyArr);
    setMonthlyRevenue(monthlyArr);

    // Top brands
    const brandMap: Record<string, number> = {};
    jobs.forEach(j => { if (j.brand_name) brandMap[j.brand_name] = (brandMap[j.brand_name] || 0) + 1; });
    setTopBrands(Object.entries(brandMap).sort((a, b) => b[1] - a[1]).slice(0, 7).map(([name, value]) => ({ name, value })));

    setLoading(false);
  };

  if (loading) return <AppLayout><div className="p-8 text-muted-foreground">Loading analytics...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6" /> Analytics Dashboard</h1>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Wrench className="h-8 w-8 text-blue-600" />
              <div><p className="text-sm text-muted-foreground">Total Jobs</p><p className="text-2xl font-bold">{stats.totalJobs}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-bold">৳{stats.totalRevenue.toLocaleString()}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div><p className="text-sm text-muted-foreground">Total Expenses</p><p className="text-2xl font-bold">৳{stats.totalExpenses.toLocaleString()}</p></div>
            </div>
          </CardContent></Card>
          <Card><CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-purple-600" />
              <div><p className="text-sm text-muted-foreground">Total Customers</p><p className="text-2xl font-bold">{stats.totalCustomers}</p></div>
            </div>
          </CardContent></Card>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Monthly Jobs Trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Jobs Trend (6 months)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyJobs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Monthly Revenue (৳)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => `৳${v.toLocaleString()}`} />
                  <Line type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2} dot={{ fill: "#059669" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Jobs by Status */}
          <Card>
            <CardHeader><CardTitle className="text-base">Jobs by Status</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={jobsByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {jobsByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Brands */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Brands by Jobs</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topBrands} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
