"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Lightbulb, Users } from "lucide-react";

const wasteProductionData = [
  { day: "Mon", waste: 45, production: 320 },
  { day: "Tue", waste: 38, production: 340 },
  { day: "Wed", waste: 52, production: 290 },
  { day: "Thu", waste: 41, production: 355 },
  { day: "Fri", waste: 67, production: 410 },
  { day: "Sat", waste: 55, production: 380 },
  { day: "Sun", waste: 33, production: 250 },
];

const employeeWasteData = [
  { name: "Marcus J.", waste: 28, efficiency: 92 },
  { name: "Sarah W.", waste: 45, efficiency: 85 },
  { name: "David C.", waste: 22, efficiency: 95 },
  { name: "Emily R.", waste: 38, efficiency: 88 },
  { name: "James T.", waste: 31, efficiency: 90 },
];

const productWasteData = [
  { product: "Fried Chicken", waste: 35, sold: 180 },
  { product: "Hot Dogs", waste: 12, sold: 95 },
  { product: "Potato Wedges", waste: 28, sold: 120 },
  { product: "Wings", waste: 18, sold: 85 },
  { product: "Sandwiches", waste: 8, sold: 45 },
];

const aiInsights = [
  {
    type: "warning",
    icon: AlertTriangle,
    title: "Overcooking Alert",
    description: "Sarah W. has 23% higher waste on Fried Chicken compared to team average. Consider reducing batch sizes during slower hours.",
    employee: "Sarah Williams",
  },
  {
    type: "trend",
    icon: TrendingDown,
    title: "Low Demand Pattern",
    description: "Potato Wedges show consistently high waste (23% vs 10% average). Sales data suggests reducing production by 30% after 6 PM.",
    product: "Potato Wedges",
  },
  {
    type: "positive",
    icon: TrendingUp,
    title: "Top Performer",
    description: "David C. maintains 95% efficiency with the lowest waste ratio. His prep timing techniques could benefit the team.",
    employee: "David Chen",
  },
  {
    type: "insight",
    icon: Lightbulb,
    title: "Weekend Optimization",
    description: "Friday waste spikes 35% despite higher sales. Consider staggered cooking schedules to match peak hours (11AM-2PM, 5PM-8PM).",
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("week");

  // Colors computed in JS for Recharts
  const primaryColor = "#dc2626"; // Red
  const accentColor = "#3b82f6"; // Blue
  const mutedColor = "#64748b"; // Gray

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Analytics Dashboard" />

      <main className="px-4 py-4 space-y-4">
        {/* Time Range Selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-secondary border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Total Waste</p>
              <p className="text-xl font-bold text-primary">$331</p>
              <p className="text-xs text-muted-foreground">-12% vs last week</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Production</p>
              <p className="text-xl font-bold text-accent">2,345</p>
              <p className="text-xs text-muted-foreground">items produced</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Efficiency</p>
              <p className="text-xl font-bold text-foreground">89%</p>
              <p className="text-xs text-accent">+3% improved</p>
            </CardContent>
          </Card>
        </div>

        {/* Waste vs Production Chart */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Waste vs Production
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                waste: { label: "Waste ($)", color: primaryColor },
                production: { label: "Production", color: accentColor },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={wasteProductionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="waste" fill={primaryColor} name="Waste ($)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="production" fill={accentColor} name="Production" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Employee Performance */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Employee Waste Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                waste: { label: "Waste ($)", color: primaryColor },
                efficiency: { label: "Efficiency (%)", color: accentColor },
              }}
              className="h-[180px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={employeeWasteData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="waste"
                    stroke={primaryColor}
                    strokeWidth={2}
                    dot={{ fill: primaryColor, r: 4 }}
                    name="Waste ($)"
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    stroke={accentColor}
                    strokeWidth={2}
                    dot={{ fill: accentColor, r: 4 }}
                    name="Efficiency (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Sparkles className="h-4 w-4 text-accent" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aiInsights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-secondary border border-border"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        insight.type === "warning"
                          ? "bg-primary/20 text-primary"
                          : insight.type === "positive"
                          ? "bg-green-500/20 text-green-500"
                          : insight.type === "trend"
                          ? "bg-accent/20 text-accent"
                          : "bg-blue-500/20 text-blue-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-foreground">
                          {insight.title}
                        </h4>
                        {insight.employee && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {insight.employee}
                          </Badge>
                        )}
                        {insight.product && (
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {insight.product}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Product Waste Analysis */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">
              Product Waste Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productWasteData.map((product) => {
                const wasteRatio = (product.waste / product.sold) * 100;
                return (
                  <div key={product.product} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{product.product}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {product.sold} sold
                        </span>
                        <span className={wasteRatio > 15 ? "text-primary" : "text-accent"}>
                          {wasteRatio.toFixed(1)}% waste
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(wasteRatio * 5, 100)}%`,
                          backgroundColor: wasteRatio > 15 ? primaryColor : accentColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
