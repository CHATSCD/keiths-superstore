"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Minus } from "lucide-react";

export interface EmployeePerformance {
  employeeName: string;
  productionScore: number;      // % of par target
  sellThroughRate: number;       // % of cooked that was sold
  categoryCoverage: number;      // % of categories covered
  totalCooked: number;
  totalSold: number;
  totalWasted: number;
  status: "good" | "undercooking" | "overcooking";
  issues: string[];
}

interface PerformanceDashboardProps {
  performances: EmployeePerformance[];
  period: string; // e.g., "This Week" or "Feb 1-7"
}

export function PerformanceDashboard({ performances, period }: PerformanceDashboardProps) {
  if (performances.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            No performance data available yet. Start tracking production and waste!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort by status (issues first)
  const sorted = [...performances].sort((a, b) => {
    const statusOrder = { undercooking: 0, overcooking: 1, good: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Employee Performance - {period}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Performance Cards */}
      {sorted.map((perf) => (
        <Card
          key={perf.employeeName}
          className={`border-border ${
            perf.status === "undercooking"
              ? "bg-red-500/5"
              : perf.status === "overcooking"
              ? "bg-orange-500/5"
              : "bg-card"
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                {perf.employeeName}
              </CardTitle>
              <PerformanceBadge status={perf.status} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Production Score */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {perf.productionScore < 80 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : perf.productionScore > 120 ? (
                    <TrendingUp className="h-4 w-4 text-orange-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {perf.productionScore}%
                </p>
                <p className="text-xs text-muted-foreground">Production</p>
              </div>

              {/* Sell-Through Rate */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {perf.sellThroughRate < 60 ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : perf.sellThroughRate > 90 ? (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {perf.sellThroughRate}%
                </p>
                <p className="text-xs text-muted-foreground">Sell-Through</p>
              </div>

              {/* Category Coverage */}
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  {perf.categoryCoverage < 70 ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {perf.categoryCoverage}%
                </p>
                <p className="text-xs text-muted-foreground">Coverage</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cooked:</span>
                <span className="font-medium text-foreground">{perf.totalCooked} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Sold:</span>
                <span className="font-medium text-green-500">{perf.totalSold} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Wasted:</span>
                <span className="font-medium text-red-500">{perf.totalWasted} items</span>
              </div>
            </div>

            {/* Issues */}
            {perf.issues.length > 0 && (
              <div className="space-y-2">
                {perf.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 text-sm bg-red-500/10 text-red-500 p-2 rounded"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Summary Stats */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-500">
                {sorted.filter(p => p.status === "good").length}
              </p>
              <p className="text-xs text-muted-foreground">Good Performance</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">
                {sorted.filter(p => p.status === "undercooking").length}
              </p>
              <p className="text-xs text-muted-foreground">Undercooking</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">
                {sorted.filter(p => p.status === "overcooking").length}
              </p>
              <p className="text-xs text-muted-foreground">Overcooking</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PerformanceBadge({ status }: { status: EmployeePerformance["status"] }) {
  if (status === "good") {
    return (
      <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/30">
        <CheckCircle className="h-3 w-3 mr-1" />
        Good
      </Badge>
    );
  }

  if (status === "undercooking") {
    return (
      <Badge className="bg-red-500/20 text-red-500 hover:bg-red-500/30">
        <TrendingDown className="h-3 w-3 mr-1" />
        Undercooking
      </Badge>
    );
  }

  return (
    <Badge className="bg-orange-500/20 text-orange-500 hover:bg-orange-500/30">
      <TrendingUp className="h-3 w-3 mr-1" />
      Overcooking
    </Badge>
  );
}

// Helper function to calculate performance from data
export function calculatePerformance(
  employeeName: string,
  productionEntries: any[],
  wasteEntries: any[],
  parTarget: number = 150
): EmployeePerformance {
  // Filter to this employee
  const empProduction = productionEntries.filter(p => p.employeeName === employeeName);
  const empWaste = wasteEntries.filter(w => w.cookedBy === employeeName);

  // Calculate totals
  const totalCooked = empProduction.reduce((sum, p) => {
    return sum + p.items.reduce((s: number, i: any) => s + i.quantityCooked, 0);
  }, 0);

  const totalWasted = empWaste.reduce((sum, w) => sum + w.quantity, 0);
  const totalSold = totalCooked - totalWasted;

  // Calculate metrics
  const productionScore = parTarget > 0 ? Math.round((totalCooked / parTarget) * 100) : 0;
  const sellThroughRate = totalCooked > 0 ? Math.round((totalSold / totalCooked) * 100) : 0;

  // Calculate category coverage
  const categoriesCooked = new Set(
    empProduction.flatMap(p => p.items.map((i: any) => i.category))
  );
  const categoryCoverage = Math.round((categoriesCooked.size / 5) * 100); // 5 total categories

  // Determine status
  let status: EmployeePerformance["status"] = "good";
  const issues: string[] = [];

  if (productionScore < 80) {
    status = "undercooking";
    issues.push(`Only producing ${productionScore}% of target - needs to cook more`);
  } else if (productionScore > 120) {
    status = "overcooking";
    issues.push(`Producing ${productionScore}% of target - cooking too much`);
  }

  if (sellThroughRate < 60) {
    status = "overcooking";
    issues.push(`Only ${sellThroughRate}% sell-through - too much waste`);
  } else if (sellThroughRate > 90 && productionScore < 100) {
    issues.push(`${sellThroughRate}% sell-through suggests could cook more`);
  }

  if (categoryCoverage < 70) {
    issues.push(`Only covering ${categoryCoverage}% of categories - not enough variety`);
  }

  return {
    employeeName,
    productionScore,
    sellThroughRate,
    categoryCoverage,
    totalCooked,
    totalSold,
    totalWasted,
    status,
    issues,
  };
}