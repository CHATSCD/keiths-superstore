"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Save, RefreshCw, AlertCircle, CheckCircle2, CheckCircle } from "lucide-react";

interface StoredInventoryItem {
  id: string;
  name: string;
  category: string;
  parLevel: number;
  currentStock: number;
  unit: string;
}

interface InventoryItem extends StoredInventoryItem {
  weeklyCount: number | null;
}

const STORAGE_KEY = "keiths-inventory-items";

const defaultInventory: StoredInventoryItem[] = [
  { id: "1", name: "Chicken Tenders", category: "Protein", parLevel: 50, currentStock: 32, unit: "lbs" },
  { id: "2", name: "Hot Dog Franks", category: "Protein", parLevel: 100, currentStock: 45, unit: "pcs" },
  { id: "3", name: "Potato Wedges", category: "Sides", parLevel: 40, currentStock: 28, unit: "lbs" },
  { id: "4", name: "Buffalo Wings", category: "Protein", parLevel: 60, currentStock: 38, unit: "lbs" },
  { id: "5", name: "Sub Rolls", category: "Bread", parLevel: 80, currentStock: 55, unit: "pcs" },
  { id: "6", name: "Cheese Slices", category: "Dairy", parLevel: 120, currentStock: 78, unit: "pcs" },
  { id: "7", name: "Jalapeños", category: "Toppings", parLevel: 20, currentStock: 12, unit: "lbs" },
  { id: "8", name: "BBQ Sauce", category: "Sauces", parLevel: 15, currentStock: 8, unit: "gal" },
  { id: "9", name: "Corn Dogs", category: "Protein", parLevel: 75, currentStock: 42, unit: "pcs" },
  { id: "10", name: "Coleslaw Mix", category: "Sides", parLevel: 25, currentStock: 18, unit: "lbs" },
];

const initialInventory = defaultInventory.map(item => ({ ...item, weeklyCount: null }));

export default function InventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  // Load inventory from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items: StoredInventoryItem[] = JSON.parse(stored);
        // Add weeklyCount field for this page
        setInventory(items.map(item => ({ ...item, weeklyCount: null })));
      } catch {
        setInventory(defaultInventory.map(item => ({ ...item, weeklyCount: null })));
      }
    } else {
      // Initialize with default inventory
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultInventory));
      setInventory(defaultInventory.map(item => ({ ...item, weeklyCount: null })));
    }
    setIsLoaded(true);
  }, []);

  const showSuccessToast = useCallback((message: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{message}</span>
        </div>
      ),
    });
  }, [toast]);

  const handleWeeklyCountChange = (id: string, value: string) => {
    const numValue = value === "" ? null : parseInt(value, 10);
    setInventory((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, weeklyCount: numValue } : item
      )
    );
  };

  const calculateSuggestedOrder = (item: InventoryItem): number => {
    const count = item.weeklyCount ?? item.currentStock;
    const needed = item.parLevel - count;
    return Math.max(0, needed);
  };

  const getStockStatus = (item: InventoryItem) => {
    const count = item.weeklyCount ?? item.currentStock;
    const ratio = count / item.parLevel;
    if (ratio < 0.3) return "critical";
    if (ratio < 0.6) return "low";
    return "good";
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Update currentStock with weeklyCount values where entered
    const updatedInventory = inventory.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      parLevel: item.parLevel,
      currentStock: item.weeklyCount !== null ? item.weeklyCount : item.currentStock,
      unit: item.unit,
    }));
    
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedInventory));
      setInventory(updatedInventory.map(item => ({ ...item, weeklyCount: null })));
      showSuccessToast("Inventory counts saved successfully");
      setSavedMessage(true);
      setTimeout(() => setSavedMessage(false), 3000);
    } catch {
      toast({
        variant: "destructive",
        description: "Failed to save inventory counts",
      });
    }
    
    setIsSaving(false);
  };

  const handleReset = () => {
    // Reload from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const items: StoredInventoryItem[] = JSON.parse(stored);
        setInventory(items.map(item => ({ ...item, weeklyCount: null })));
      } catch {
        setInventory(defaultInventory.map(item => ({ ...item, weeklyCount: null })));
      }
    } else {
      setInventory(defaultInventory.map(item => ({ ...item, weeklyCount: null })));
    }
  };

  const totalSuggestedItems = inventory.reduce(
    (acc, item) => acc + (calculateSuggestedOrder(item) > 0 ? 1 : 0),
    0
  );

  const criticalItems = inventory.filter(
    (item) => getStockStatus(item) === "critical"
  ).length;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Inventory Management" />
        <main className="px-4 py-4 flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Inventory Management" />

      <main className="px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Items</p>
              <p className="text-xl font-bold text-foreground">{inventory.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Need Order</p>
              <p className="text-xl font-bold text-accent">{totalSuggestedItems}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-xl font-bold text-primary">{criticalItems}</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Counts
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-border text-foreground bg-secondary hover:bg-secondary/80"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Save Success Message */}
        {savedMessage && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/20 text-green-500 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Inventory counts saved successfully
          </div>
        )}

        {/* Inventory Table */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Package className="h-4 w-4 text-primary" />
              Weekly Inventory Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-semibold">Item</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold text-center">Par</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold text-center">Count</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-semibold text-center">Order</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => {
                    const status = getStockStatus(item);
                    const suggestedOrder = calculateSuggestedOrder(item);

                    return (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className="text-xs border-border text-muted-foreground"
                              >
                                {item.category}
                              </Badge>
                              {status === "critical" && (
                                <AlertCircle className="h-3 w-3 text-primary" />
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm text-muted-foreground">
                            {item.parLevel}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1">
                            {item.unit}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            value={item.weeklyCount ?? ""}
                            placeholder={item.currentStock.toString()}
                            onChange={(e) =>
                              handleWeeklyCountChange(item.id, e.target.value)
                            }
                            className="w-16 h-8 text-center text-sm bg-secondary border-border text-foreground mx-auto"
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-sm font-semibold ${
                              suggestedOrder > 0
                                ? suggestedOrder > item.parLevel * 0.5
                                  ? "text-primary"
                                  : "text-blue-500"
                                : "text-green-500"
                            }`}
                          >
                            {suggestedOrder > 0 ? `+${suggestedOrder}` : "OK"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Order Legend
            </h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Stocked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">Order Suggested</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Urgent Order</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formula Explanation */}
        <Card className="border-border bg-secondary/50">
          <CardContent className="p-4">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
              How Suggested Order Works
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="text-accent font-medium">Suggested Order</span> = Par Level - Weekly Count.
              Enter your current count in the table above, and the system will automatically calculate how much to order to reach your target par level.
            </p>
          </CardContent>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
