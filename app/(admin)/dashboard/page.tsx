'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useBreadcrumbs, useAuth } from '@/context';
import { useDashboardStats, usePageViewStats } from '@/hooks';
import { PERMISSIONS } from '@/shared/validators/permissions';
import { AccessDenied } from '@/components/admin/access-denied';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedList } from '@/components/ui/animated-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  LabelList,
  CartesianGrid,
  Area,
  AreaChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  Cell,
} from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  FolderOpen,
  Eye,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Building2,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Status badge config
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  pending: { label: 'Pending', variant: 'secondary', className: 'bg-amber-100 text-amber-700 hover:bg-amber-100' },
  reviewed: { label: 'Reviewed', variant: 'secondary', className: 'bg-blue-100 text-blue-700 hover:bg-blue-100' },
  shortlisted: { label: 'Shortlisted', variant: 'secondary', className: 'bg-violet-100 text-violet-700 hover:bg-violet-100' },
  rejected: { label: 'Rejected', variant: 'secondary', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
  hired: { label: 'Hired', variant: 'secondary', className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' },
};

// Chart colors
const CHART_COLORS = {
  pending: 'hsl(45, 93%, 47%)',
  reviewed: 'hsl(217, 91%, 60%)',
  shortlisted: 'hsl(262, 83%, 58%)',
  rejected: 'hsl(220, 9%, 46%)',
  hired: 'hsl(160, 84%, 39%)',
};


function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>

      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-80 rounded-xl lg:col-span-4" />
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

// Application Pipeline Radar Chart
function ApplicationPipelineChart({ data }: { data: { pending: number; reviewed: number; shortlisted: number; rejected: number; hired: number; total: number } }) {
  const chartData = useMemo(() => [
    { status: 'Pending', count: data.pending },
    { status: 'Reviewed', count: data.reviewed },
    { status: 'Shortlisted', count: data.shortlisted },
    { status: 'Rejected', count: data.rejected },
    { status: 'Hired', count: data.hired },
  ], [data]);

  const chartConfig: ChartConfig = {
    count: { label: 'Applications', color: 'var(--primary)' },
  };

  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-muted-foreground">
        No applications yet
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[280px]">
      <RadarChart data={chartData}>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <PolarAngleAxis dataKey="status" />
        <PolarGrid />
        <Radar
          dataKey="count"
          fill="var(--primary)"
          fillOpacity={0.6}
          dot={{
            r: 4,
            fillOpacity: 1,
            fill: 'var(--primary)',
          }}
        />
      </RadarChart>
    </ChartContainer>
  );
}

// Horizontal Bar Chart for Industry data with custom labels
function IndustryBarChart({ 
  data, 
  label = 'count',
  colorVar = '--chart-1',
  alternateColors = false,
}: { 
  data: { name: string; count: number }[];
  label?: string;
  colorVar?: string;
  alternateColors?: boolean;
}) {
  const chartConfig: ChartConfig = {
    count: { label: label, color: `var(${colorVar})` },
  };

  const barColors = ['var(--primary)', 'var(--muted-foreground)'];
  const textColors = ['var(--primary-foreground)', 'white'];

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No data available
      </div>
    );
  }

  // Custom label renderer for alternating text colors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomLabel = (props: any) => {
    const { x = 0, y = 0, height = 0, value, index = 0 } = props;
    const displayValue = value && value.length > 18 ? value.slice(0, 18) + '...' : value;
    const fillColor = alternateColors ? textColors[index % 2] : 'white';
    
    return (
      <text
        x={Number(x) + 8}
        y={Number(y) + Number(height) / 2}
        fill={fillColor}
        fontSize={12}
        dominantBaseline="middle"
      >
        {displayValue}
      </text>
    );
  };

  // Custom tooltip renderer for alternating colors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderCustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (!active || !payload || !payload.length) return null;
    
    const dataPoint = payload[0];
    const index = data.findIndex(d => d.name === dataPoint.payload.name);
    const indicatorColor = alternateColors ? barColors[index % 2] : `var(${colorVar})`;
    
    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
        <div className="flex items-center gap-2">
          <div 
            className="h-2.5 w-2.5 shrink-0 rounded-[2px]" 
            style={{ backgroundColor: indicatorColor }}
          />
          <span className="text-muted-foreground">{label}:</span>
          <span className="font-medium">{dataPoint.value}</span>
        </div>
      </div>
    );
  };

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{ right: 32 }}
      >
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          hide
        />
        <XAxis dataKey="count" type="number" hide />
        <ChartTooltip
          cursor={false}
          content={renderCustomTooltip}
        />
        <Bar
          dataKey="count"
          layout="vertical"
          fill={alternateColors ? undefined : `var(${colorVar})`}
          radius={4}
        >
          {alternateColors && data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={barColors[index % 2]} />
          ))}
          <LabelList
            dataKey="name"
            position="insideLeft"
            content={renderCustomLabel}
          />
          <LabelList
            dataKey="count"
            position="right"
            offset={8}
            className="fill-foreground"
            fontSize={12}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// Interactive Area Chart for daily views and applications
function DailyActivityChart({ 
  data 
}: { 
  data: { date: string; views: number; applications: number }[];
}) {
  const [timeRange, setTimeRange] = useState('90d');

  const chartConfig: ChartConfig = {
    views: {
      label: 'Job Views',
      color: 'var(--primary)',
    },
    applications: {
      label: 'Applications',
      color: 'var(--muted-foreground)',
    },
  };

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return data.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, timeRange]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-base">Daily Activity</CardTitle>
          <CardDescription>
            Job views and applications over time
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="90d" className="rounded-lg">
              Last 3 months
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-views)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="applications"
              type="natural"
              fill="url(#fillApplications)"
              stroke="var(--color-applications)"
              stackId="a"
            />
            <Area
              dataKey="views"
              type="natural"
              fill="url(#fillViews)"
              stroke="var(--color-views)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Interactive Bar Chart for page views (Home vs Jobs)
function PageViewsChart({ 
  data,
}: { 
  data: { date: string; home: number; jobs: number }[];
}) {
  const [activeChart, setActiveChart] = useState<'home' | 'jobs'>('home');
  const [timeRange, setTimeRange] = useState('90d');

  const chartConfig: ChartConfig = {
    views: { label: 'Page Views' },
    home: { label: 'Home Page', color: 'var(--primary)' },
    jobs: { label: 'Jobs Page', color: 'var(--muted-foreground)' },
  };

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const referenceDate = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    
    const startDate = new Date(referenceDate);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return data.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [data, timeRange]);

  // Calculate totals based on filtered data
  const filteredTotals = useMemo(() => {
    return {
      home: filteredData.reduce((acc, curr) => acc + curr.home, 0),
      jobs: filteredData.reduce((acc, curr) => acc + curr.jobs, 0),
    };
  }, [filteredData]);

  if (!data || data.length === 0) {
    return (
      <Card className="py-0">
        <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
            <CardTitle className="text-base">Page Views</CardTitle>
            <CardDescription>Home and Jobs page traffic</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <CardTitle className="text-base">Page Views</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Select time range">
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg text-xs">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg text-xs">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg text-xs">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <CardDescription>
            Home and Jobs page traffic
          </CardDescription>
        </div>
        <div className="flex">
          {(['home', 'jobs'] as const).map((key) => (
            <button
              key={key}
              data-active={activeChart === key}
              className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
              onClick={() => setActiveChart(key)}
            >
              <span className="text-muted-foreground text-xs">
                {chartConfig[key].label}
              </span>
              <span className="text-lg leading-none font-bold sm:text-3xl">
                {filteredTotals[key].toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={filteredData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="views"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey={activeChart} fill={`var(--color-${activeChart})`} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const { hasPermission, isLoading: authLoading, user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: pageViewStats } = usePageViewStats();

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard' },
    ]);
  }, [setBreadcrumbs]);

  // Process chart data
  const jobsByIndustryData = useMemo(() => {
    if (!stats?.charts.jobsByIndustry) return [];
    return stats.charts.jobsByIndustry.map(item => ({
      name: item.name,
      count: item.count,
    }));
  }, [stats?.charts.jobsByIndustry]);

  const applicationsByIndustryData = useMemo(() => {
    if (!stats?.charts.applicationsByIndustry) return [];
    return stats.charts.applicationsByIndustry.map((item: any) => ({
      name: item.industry,
      count: item.count,
    }));
  }, [stats?.charts.applicationsByIndustry]);

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  if (!hasPermission(PERMISSIONS.DASHBOARD_VIEW)) {
    return <AccessDenied />;
  }

  if (statsLoading || !stats) {
    return <DashboardSkeleton />;
  }

  const { overview, recentApplications, recentJobs } = stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.firstName}
          </h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your careers platform today.
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button variant="outline" asChild>
            <Link href="/" target="_blank">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Careers
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/jobs/new">
              <Plus className="h-4 w-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>
      </div>

      {/* Daily Activity Chart */}
      <DailyActivityChart data={stats.charts.dailyActivity || []} />

      {/* Page Views Chart */}
      <PageViewsChart data={pageViewStats?.dailyPageViews || []} />

      {/* Application Pipeline & Recent Applications */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Application Pipeline Chart */}
        <Card className="lg:col-span-4 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Application Pipeline</CardTitle>
            <CardDescription>Distribution of application statuses</CardDescription>
          </CardHeader>
          <CardContent className="pb-4 overflow-x-auto">
            <ApplicationPipelineChart data={overview.applications} />
          </CardContent>
        </Card>

        {/* Recent Applications */}
        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Applications</CardTitle>
              <CardDescription>Latest job applications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/applications">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {recentApplications.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {recentApplications.map((app) => {
                    const statusConfig = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
                    return (
                      <div
                        key={app.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {app.applicantName.split(' ').map((n) => n[0]).join('')}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{app.applicantName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {app.jobTitle}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <Badge variant={statusConfig.variant} className={statusConfig.className}>
                            {statusConfig.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(app.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No applications yet</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Jobs by Industry */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Jobs by Industry
            </CardTitle>
            <CardDescription>Distribution across industries</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[300px]">
              <IndustryBarChart 
                data={jobsByIndustryData} 
                label="Jobs"
                alternateColors
              />
            </div>
          </CardContent>
        </Card>

        {/* Applications by Industry */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Applications by Industry
            </CardTitle>
            <CardDescription>Where candidates are applying</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[300px]">
              <IndustryBarChart 
                data={applicationsByIndustryData} 
                label="Applications"
                alternateColors
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats & Recent Jobs */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Stats */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Platform overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Industries</p>
                  <p className="text-xs text-muted-foreground">{overview.industries.active} active</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{overview.industries.total}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Published Jobs</p>
                  <p className="text-xs text-muted-foreground">Active listings</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{overview.jobs.published}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Draft Jobs</p>
                  <p className="text-xs text-muted-foreground">Awaiting publish</p>
                </div>
              </div>
              <span className="text-2xl font-bold">{overview.jobs.draft}</span>
            </div>

            {overview.jobs.expired > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Expired Jobs</p>
                    <p className="text-xs text-muted-foreground">Need attention</p>
                  </div>
                </div>
                <span className="text-2xl font-bold">{overview.jobs.expired}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Jobs */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Jobs</CardTitle>
              <CardDescription>Latest job postings</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/jobs">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px]">
              {recentJobs.length > 0 ? (
                <div className="space-y-4 pr-4">
                  {recentJobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{job.title}</p>
                          {job.isPublished ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              Draft
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="truncate">{job.industry}</span>
                          <span>•</span>
                          <span className="truncate">{job.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span>{job.applicationsCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{job.viewsCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No jobs posted yet</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
