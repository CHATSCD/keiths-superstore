export interface WasteEntry {
  id: string;
  item: string;
  quantity: number;
  timestamp: Date;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  parLevel: number;
  currentStock: number;
  lastWeekStock?: number;
  unit: string;
}

export interface WeeklySalesData {
  itemName: string;
  sold: number;
  wasted: number;
  wasteRate: number;
  salesTrend: number; // % change from last week
  currentPar: number;
}

export interface OrderSuggestion {
  itemName: string;
  category: string;
  currentPar: number;
  suggestedOrder: number;
  adjustment: number; // How much above/below par
  reason: string;
  trend: "🔥 hot" | "📊 normal" | "❄️ cold";
  wasteRate: number;
  priority: number; // 1-5, for sorting
}

// Calculate sales for the current week
export function calculateWeeklySales(
  item: InventoryItem,
  wasteEntries: WasteEntry[],
  weekStartStock: number,
  ordered: number = 0
): WeeklySalesData {
  const itemWaste = wasteEntries
    .filter(w => w.item === item.name)
    .reduce((sum, w) => sum + w.quantity, 0);

  // Formula: sold = (starting stock + ordered) - (current stock + wasted)
  const sold = (weekStartStock + ordered) - (item.currentStock + itemWaste);
  
  const wasteRate = sold > 0 ? (itemWaste / (sold + itemWaste)) * 100 : 0;
  
  // Calculate trend (compare to last week if available)
  const lastWeekSold = item.lastWeekStock || sold;
  const salesTrend = lastWeekSold > 0 
    ? ((sold - lastWeekSold) / lastWeekSold) * 100 
    : 0;

  return {
    itemName: item.name,
    sold: Math.max(0, sold),
    wasted: itemWaste,
    wasteRate,
    salesTrend,
    currentPar: item.parLevel,
  };
}

// Generate smart ordering suggestions
export function generateOrderSuggestion(
  salesData: WeeklySalesData,
  category: string
): OrderSuggestion {
  const { itemName, salesTrend, wasteRate, currentPar } = salesData;
  
  let suggestedOrder = currentPar;
  let adjustment = 0;
  let reason = "";
  let trend: "🔥 hot" | "📊 normal" | "❄️ cold" = "📊 normal";
  let priority = 3; // Default priority

  // High waste items - reduce regardless of sales
  if (wasteRate > 30) {
    const reduction = Math.floor(currentPar * 0.25); // Reduce by 25%
    suggestedOrder = Math.max(1, currentPar - reduction);
    adjustment = suggestedOrder - currentPar;
    reason = `High waste rate (${wasteRate.toFixed(0)}%) - reduce production`;
    trend = "❄️ cold";
    priority = 5; // High priority to address
  }
  // Hot items - sales increasing significantly
  else if (salesTrend >= 20) {
    const increase = Math.ceil(currentPar * (salesTrend / 100));
    suggestedOrder = currentPar + increase;
    adjustment = increase;
    reason = `Sales up ${salesTrend.toFixed(0)}% - order more`;
    trend = "🔥 hot";
    priority = 1; // High priority - don't run out
  }
  // Warm items - moderate increase
  else if (salesTrend >= 10) {
    const increase = Math.ceil(currentPar * 0.15); // Increase by 15%
    suggestedOrder = currentPar + increase;
    adjustment = increase;
    reason = `Sales up ${salesTrend.toFixed(0)}% - slight increase`;
    trend = "🔥 hot";
    priority = 2;
  }
  // Cold items - sales decreasing significantly
  else if (salesTrend <= -20) {
    const decrease = Math.floor(currentPar * 0.25); // Reduce by 25%
    suggestedOrder = Math.max(1, currentPar - decrease);
    adjustment = suggestedOrder - currentPar;
    reason = `Sales down ${Math.abs(salesTrend).toFixed(0)}% - reduce order`;
    trend = "❄️ cold";
    priority = 4;
  }
  // Cool items - moderate decrease
  else if (salesTrend <= -10) {
    const decrease = Math.floor(currentPar * 0.15); // Reduce by 15%
    suggestedOrder = Math.max(1, currentPar - decrease);
    adjustment = suggestedOrder - currentPar;
    reason = `Sales down ${Math.abs(salesTrend).toFixed(0)}% - slight reduction`;
    trend = "❄️ cold";
    priority = 3;
  }
  // Steady items - order at par
  else {
    suggestedOrder = currentPar;
    adjustment = 0;
    reason = "Steady sales - order at par";
    trend = "📊 normal";
    priority = 3;
  }

  // Additional waste warning
  if (wasteRate > 15 && wasteRate <= 30) {
    reason += ` ⚠️ (${wasteRate.toFixed(0)}% waste)`;
  }

  return {
    itemName,
    category,
    currentPar,
    suggestedOrder,
    adjustment,
    reason,
    trend,
    wasteRate,
    priority,
  };
}

// Generate all order suggestions for inventory
export function generateAllOrderSuggestions(
  inventory: InventoryItem[],
  wasteEntries: WasteEntry[],
  weekStartStocks: { [itemName: string]: number },
  orderedQuantities: { [itemName: string]: number } = {}
): OrderSuggestion[] {
  const suggestions: OrderSuggestion[] = [];

  // Filter to only get recent waste (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentWaste = wasteEntries.filter(w => 
    new Date(w.timestamp) >= sevenDaysAgo
  );

  for (const item of inventory) {
    const weekStartStock = weekStartStocks[item.name] || item.currentStock;
    const ordered = orderedQuantities[item.name] || 0;

    const salesData = calculateWeeklySales(
      item,
      recentWaste,
      weekStartStock,
      ordered
    );

    const suggestion = generateOrderSuggestion(salesData, item.category);
    suggestions.push(suggestion);
  }

  // Sort by priority (1 = most important)
  return suggestions.sort((a, b) => a.priority - b.priority);
}

// Format order report for printing
export function formatOrderReport(suggestions: OrderSuggestion[]): string {
  const hot = suggestions.filter(s => s.trend === "🔥 hot");
  const normal = suggestions.filter(s => s.trend === "📊 normal");
  const cold = suggestions.filter(s => s.trend === "❄️ cold");

  let report = "KEITH'S SUPERSTORE - SMART ORDER REPORT\n";
  report += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
  report += "=".repeat(60) + "\n\n";

  if (hot.length > 0) {
    report += "🔥 HOT ITEMS (Order Above Par)\n";
    report += "-".repeat(60) + "\n";
    hot.forEach(s => {
      report += `${s.itemName.padEnd(25)} Par: ${String(s.currentPar).padStart(3)} → Order: ${String(s.suggestedOrder).padStart(3)} (+${s.adjustment})\n`;
      report += `   ${s.reason}\n\n`;
    });
  }

  if (normal.length > 0) {
    report += "\n📊 NORMAL ITEMS (Order at Par)\n";
    report += "-".repeat(60) + "\n";
    normal.forEach(s => {
      report += `${s.itemName.padEnd(25)} Order: ${s.suggestedOrder}\n`;
    });
    report += "\n";
  }

  if (cold.length > 0) {
    report += "\n❄️ COLD ITEMS (Order Below Par)\n";
    report += "-".repeat(60) + "\n";
    cold.forEach(s => {
      report += `${s.itemName.padEnd(25)} Par: ${String(s.currentPar).padStart(3)} → Order: ${String(s.suggestedOrder).padStart(3)} (${s.adjustment})\n`;
      report += `   ${s.reason}\n\n`;
    });
  }

  // Summary
  const totalAdjustment = suggestions.reduce((sum, s) => sum + Math.abs(s.adjustment), 0);
  report += "\n" + "=".repeat(60) + "\n";
  report += `SUMMARY:\n`;
  report += `  Hot Items: ${hot.length}\n`;
  report += `  Normal Items: ${normal.length}\n`;
  report += `  Cold Items: ${cold.length}\n`;
  report += `  Total Adjustments: ${totalAdjustment} items\n`;

  return report;
}