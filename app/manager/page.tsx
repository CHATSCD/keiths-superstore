"use client";

import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Users, Package, Plus, Trash2, Edit2, Save, X, ClipboardList, TrendingUp, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceDashboard, calculatePerformance } from "@/components/performance-dashboard";
import { OrderReport, generateTextReport, printOrderReport } from "@/components/order-report";
import { generateAllOrderSuggestions } from "@/lib/sales-analytics";

interface Employee {
  id: string;
  name: string;
  role: "employee" | "manager";
  active: boolean;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  parLevel: number;
  currentStock: number;
  lastWeekStock?: number;
  unit: string;
}

const STORAGE_KEYS = {
  employees: "keiths-employees",
  items: "keiths-inventory-items",
  waste: "keiths-waste-entries",
  production: "keiths-production-entries",
};

export default function ManagerPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("items");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [wasteEntries, setWasteEntries] = useState<any[]>([]);
  const [productionEntries, setProductionEntries] = useState<any[]>([]);
  
  // New item form
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemPar, setNewItemPar] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load data
  useEffect(() => {
    const storedEmployees = localStorage.getItem(STORAGE_KEYS.employees);
    const storedItems = localStorage.getItem(STORAGE_KEYS.items);
    const storedWaste = localStorage.getItem(STORAGE_KEYS.waste);
    const storedProduction = localStorage.getItem(STORAGE_KEYS.production);

    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
    if (storedItems) setItems(JSON.parse(storedItems));
    if (storedWaste) setWasteEntries(JSON.parse(storedWaste));
    if (storedProduction) setProductionEntries(JSON.parse(storedProduction));
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

  const addItem = () => {
    if (!newItemName || !newItemCategory || !newItemPar) {
      return;
    }

    const newItem: InventoryItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      category: newItemCategory,
      parLevel: parseInt(newItemPar),
      currentStock: 0,
      unit: "pcs",
    };

    const updated = [...items, newItem];
    setItems(updated);
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(updated));
    
    setNewItemName("");
    setNewItemCategory("");
    setNewItemPar("");
    showSuccessToast("Item added");
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(updated));
    showSuccessToast("Item deleted");
  };

  // Calculate performance metrics
  const performanceData = employees
    .filter(e => e.active)
    .map(emp => calculatePerformance(emp.name, productionEntries, wasteEntries, 150));

  // Generate order suggestions
  const weekStartStocks: any = {};
  items.forEach(item => {
    weekStartStocks[item.name] = item.lastWeekStock || item.currentStock;
  });

  const orderSuggestions = generateAllOrderSuggestions(
    items,
    wasteEntries,
    weekStartStocks
  );

  const handlePrintReport = () => {
    printOrderReport();
  };

  const handleDownloadReport = () => {
    const text = generateTextReport(orderSuggestions, "This Week");
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    showSuccessToast("Report downloaded");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="items">
              <Package className="h-4 w-4 mr-2" />
              Items
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ClipboardList className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-4 w-4 mr-2" />
              Employees
            </TabsTrigger>
          </TabsList>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add New Item</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="e.g., Chicken Wings"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="roller">Roller Items</SelectItem>
                      <SelectItem value="deli">Deli</SelectItem>
                      <SelectItem value="bakery">Bakery</SelectItem>
                      <SelectItem value="branded">Branded</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Par Level</Label>
                  <Input
                    type="number"
                    value={newItemPar}
                    onChange={(e) => setNewItemPar(e.target.value)}
                    placeholder="50"
                  />
                </div>
                <Button onClick={addItem} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inventory Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.category} • Par: {item.parLevel}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <PerformanceDashboard 
              performances={performanceData}
              period="This Week"
            />
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Smart Order Suggestions</CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={handleDownloadReport} variant="outline" size="sm">
                      Download
                    </Button>
                    <Button onClick={handlePrintReport} variant="outline" size="sm">
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <OrderReport
              suggestions={orderSuggestions}
              period="This Week"
              onPrint={handlePrintReport}
            />
          </TabsContent>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Employees ({employees.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div>
                        <p className="font-medium">{emp.name}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {emp.role}
                        </p>
                      </div>
                      <Badge variant={emp.active ? "default" : "secondary"}>
                        {emp.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Navigation />
    </div>
  );
}
