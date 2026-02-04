// Printable Smart Order Report Component
// components/order-report.tsx

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface OrderSuggestion {
  itemName: string;
  category: string;
  currentPar: number;
  suggestedOrder: number;
  adjustment: number;
  reason: string;
  trend: "🔥 hot" | "📊 normal" | "❄️ cold";
  wasteRate: number;
  priority: number;
}

interface OrderReportProps {
  suggestions: OrderSuggestion[];
  period: string;
  onPrint?: () => void;
}

export function OrderReport({ suggestions, period, onPrint }: OrderReportProps) {
  const hot = suggestions.filter(s => s.trend === "🔥 hot");
  const normal = suggestions.filter(s => s.trend === "📊 normal");
  const cold = suggestions.filter(s => s.trend === "❄️ cold");

  const totalAdjustment = suggestions.reduce((sum, s) => sum + Math.abs(s.adjustment), 0);
  const totalSuggested = suggestions.reduce((sum, s) => sum + s.suggestedOrder, 0);

  return (
    <div className="space-y-4 print:space-y-6">
      {/* Header */}
      <Card className="border-border bg-card print:border-black">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-bold text-foreground print:text-black">
                Keith's Superstore - Smart Order Report
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1 print:text-black">
                {period}
              </p>
            </div>
            <Button
              onClick={onPrint}
              variant="outline"
              size="sm"
              className="print:hidden"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Hot Items */}
      {hot.length > 0 && (
        <Card className="border-border bg-card print:border-black">
          <CardHeader className="bg-red-500/10 print:bg-white">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2 print:text-black">
              🔥 Hot Items - Order Above Par ({hot.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border print:divide-black">
              {hot.map((suggestion) => (
                <OrderItem key={suggestion.itemName} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Normal Items */}
      {normal.length > 0 && (
        <Card className="border-border bg-card print:border-black print:break-inside-avoid">
          <CardHeader className="bg-blue-500/10 print:bg-white">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2 print:text-black">
              📊 Normal Items - Order at Par ({normal.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border print:divide-black">
              {normal.map((suggestion) => (
                <OrderItem key={suggestion.itemName} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cold Items */}
      {cold.length > 0 && (
        <Card className="border-border bg-card print:border-black print:break-inside-avoid">
          <CardHeader className="bg-blue-500/10 print:bg-white">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2 print:text-black">
              ❄️ Cold Items - Order Below Par ({cold.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border print:divide-black">
              {cold.map((suggestion) => (
                <OrderItem key={suggestion.itemName} suggestion={suggestion} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-border bg-card print:border-black print:break-inside-avoid">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground print:text-black">
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground print:text-black">Total Items:</p>
              <p className="text-2xl font-bold text-foreground print:text-black">
                {suggestions.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground print:text-black">Total Order Qty:</p>
              <p className="text-2xl font-bold text-foreground print:text-black">
                {totalSuggested}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground print:text-black">Hot Items:</p>
              <p className="text-xl font-bold text-red-500 print:text-black">
                {hot.length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground print:text-black">Cold Items:</p>
              <p className="text-xl font-bold text-blue-500 print:text-black">
                {cold.length}
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border print:border-black">
            <p className="text-sm text-muted-foreground print:text-black">
              Total Adjustments: {totalAdjustment} items from standard par levels
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground print:text-black print:mt-8">
        <p>Generated: {new Date().toLocaleString()}</p>
        <p className="mt-1">Keith's Superstore - Smart Ordering System</p>
      </div>
    </div>
  );
}

function OrderItem({ suggestion }: { suggestion: OrderSuggestion }) {
  const getTrendIcon = () => {
    if (suggestion.trend === "🔥 hot") {
      return <TrendingUp className="h-4 w-4 text-red-500 print:text-black" />;
    }
    if (suggestion.trend === "❄️ cold") {
      return <TrendingDown className="h-4 w-4 text-blue-500 print:text-black" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground print:text-black" />;
  };

  return (
    <div className="p-4 hover:bg-secondary/50 print:hover:bg-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {getTrendIcon()}
            <h4 className="font-medium text-foreground print:text-black">
              {suggestion.itemName}
            </h4>
            <Badge variant="outline" className="text-xs capitalize print:border-black print:text-black">
              {suggestion.category}
            </Badge>
          </div>

          <div className="flex items-center gap-4 text-sm mt-2">
            <div>
              <span className="text-muted-foreground print:text-black">Par: </span>
              <span className="font-medium text-foreground print:text-black">
                {suggestion.currentPar}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground print:text-black">→ Order: </span>
              <span className="font-bold text-foreground print:text-black">
                {suggestion.suggestedOrder}
              </span>
            </div>
            {suggestion.adjustment !== 0 && (
              <div>
                <span
                  className={`font-medium ${
                    suggestion.adjustment > 0 ? "text-red-500" : "text-blue-500"
                  } print:text-black`}
                >
                  ({suggestion.adjustment > 0 ? "+" : ""}
                  {suggestion.adjustment})
                </span>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground mt-2 print:text-black">
            {suggestion.reason}
          </p>

          {suggestion.wasteRate > 15 && (
            <p className="text-xs text-orange-500 mt-1 print:text-black">
              ⚠️ Waste rate: {suggestion.wasteRate.toFixed(0)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility function to trigger print
export function printOrderReport() {
  window.print();
}

// Generate text version for export
export function generateTextReport(suggestions: OrderSuggestion[], period: string): string {
  const hot = suggestions.filter(s => s.trend === "🔥 hot");
  const normal = suggestions.filter(s => s.trend === "📊 normal");
  const cold = suggestions.filter(s => s.trend === "❄️ cold");

  let text = "KEITH'S SUPERSTORE - SMART ORDER REPORT\n";
  text += `Period: ${period}\n`;
  text += `Generated: ${new Date().toLocaleString()}\n`;
  text += "=".repeat(60) + "\n\n";

  if (hot.length > 0) {
    text += "🔥 HOT ITEMS - Order Above Par\n";
    text += "-".repeat(60) + "\n";
    hot.forEach(s => {
      text += `${s.itemName.padEnd(25)} Par: ${String(s.currentPar).padStart(3)} → Order: ${String(s.suggestedOrder).padStart(3)} (+${s.adjustment})\n`;
      text += `   ${s.reason}\n\n`;
    });
  }

  if (normal.length > 0) {
    text += "\n📊 NORMAL ITEMS - Order at Par\n";
    text += "-".repeat(60) + "\n";
    normal.forEach(s => {
      text += `${s.itemName.padEnd(25)} Order: ${s.suggestedOrder}\n`;
    });
    text += "\n";
  }

  if (cold.length > 0) {
    text += "\n❄️ COLD ITEMS - Order Below Par\n";
    text += "-".repeat(60) + "\n";
    cold.forEach(s => {
      text += `${s.itemName.padEnd(25)} Par: ${String(s.currentPar).padStart(3)} → Order: ${String(s.suggestedOrder).padStart(3)} (${s.adjustment})\n`;
      text += `   ${s.reason}\n\n`;
    });
  }

  text += "\n" + "=".repeat(60) + "\n";
  text += "SUMMARY\n";
  text += `  Total Items: ${suggestions.length}\n`;
  text += `  Hot Items: ${hot.length}\n`;
  text += `  Normal Items: ${normal.length}\n`;
  text += `  Cold Items: ${cold.length}\n`;

  return text;
}
