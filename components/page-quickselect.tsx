"use client";

import React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, X, AlertCircle, CheckCircle, Package } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  role: "employee" | "manager";
  active: boolean;
}

interface WasteEntry {
  id: string;
  item: string;
  category: string;
  quantity: number;
  unit: string;
  employee: string;
  timestamp: Date;
}

const defaultEmployees: Employee[] = [
  { id: "1", name: "Shaun Dubuisson", role: "employee", active: true },
  { id: "2", name: "Sarah Williams", role: "employee", active: true },
  { id: "3", name: "David Chen", role: "employee", active: true },
  { id: "4", name: "Emily Rodriguez", role: "employee", active: true },
  { id: "5", name: "James Thompson", role: "employee", active: true },
];

// Pre-loaded waste items from Keith's Superstore forms
const WASTE_ITEMS = {
  breakfast: [
    "Bacon",
    "Stuffed Waffles",
    "Little Pigs in a Blanket",
    "Big Pigs in a Blanket",
    "Kolache",
    "Boudin",
  ],
  roller: [
    "Egg Rolls",
    "Tornados",
    "Chicken Stick",
    "Corn Dog",
    "Hot Dog",
    "Sausage",
    "Crispitos",
  ],
  deli: [
    "Hamburger",
    "Pulled Pork",
    "Brisket",
    "Country Fried Steak",
    "Pork Chop",
    "Steak",
  ],
  bakery: [
    "Cinnamon Rolls",
    "Large Cookies",
    "Small Cookies",
    "Muffins",
    "Brownies",
    "Danishes",
    "Donuts",
  ],
  branded: [
    "Pizza",
    "Pizza Whole",
    "Pizza Hunk",
    "Wings",
    "Bites",
  ],
};

const STORAGE_KEYS = {
  employees: "keiths-employees",
  waste: "keiths-waste-entries",
};

export default function WasteTrackingPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("breakfast");
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [todayTotal, setTodayTotal] = useState<number>(0);

  // Load employees and waste entries from localStorage
  useEffect(() => {
    const storedEmployees = localStorage.getItem(STORAGE_KEYS.employees);
    const storedWaste = localStorage.getItem(STORAGE_KEYS.waste);
    
    if (storedEmployees) {
      try {
        setEmployees(JSON.parse(storedEmployees));
      } catch {
        setEmployees(defaultEmployees);
      }
    } else {
      setEmployees(defaultEmployees);
    }
    
    if (storedWaste) {
      try {
        const entries = JSON.parse(storedWaste);
        setWasteEntries(entries);
        
        // Calculate today's total
        const today = new Date().toDateString();
        const todayEntries = entries.filter((e: WasteEntry) => 
          new Date(e.timestamp).toDateString() === today
        );
        setTodayTotal(todayEntries.length);
      } catch {
        setWasteEntries([]);
      }
    }
  }, []);

  const activeEmployees = employees.filter(emp => emp.active);

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

  const showErrorToast = useCallback((message: string) => {
    toast({
      variant: "destructive",
      description: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{message}</span>
        </div>
      ),
    });
  }, [toast]);

  const addWasteEntry = () => {
    if (!selectedEmployee || !selectedItem || !quantity) {
      showErrorToast("Please select employee, item, and quantity");
      return;
    }

    const employeeName = activeEmployees.find(e => e.id === selectedEmployee)?.name || "Unknown";
    const qty = parseInt(quantity) || 1;

    const newEntry: WasteEntry = {
      id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      item: selectedItem,
      category: selectedCategory,
      quantity: qty,
      unit: "pcs",
      employee: employeeName,
      timestamp: new Date(),
    };

    const updatedEntries = [newEntry, ...wasteEntries];
    setWasteEntries(updatedEntries);
    localStorage.setItem(STORAGE_KEYS.waste, JSON.stringify(updatedEntries));

    // Update today's total
    const today = new Date().toDateString();
    const todayEntries = updatedEntries.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
    setTodayTotal(todayEntries.length);

    showSuccessToast(`Added ${selectedItem} (${qty} pcs) - ${employeeName}`);
    
    // Reset quantity
    setQuantity("1");
  };

  const removeEntry = (id: string) => {
    const updatedEntries = wasteEntries.filter(e => e.id !== id);
    setWasteEntries(updatedEntries);
    localStorage.setItem(STORAGE_KEYS.waste, JSON.stringify(updatedEntries));
    
    const today = new Date().toDateString();
    const todayEntries = updatedEntries.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
    setTodayTotal(todayEntries.length);
    
    showSuccessToast("Entry removed");
  };

  const currentItems = WASTE_ITEMS[selectedCategory as keyof typeof WASTE_ITEMS] || [];

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
        {/* Employee Selection */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Trash2 className="h-4 w-4 text-red-500" />
              Waste Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Employee Recording Waste
              </label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Selection */}
        {selectedEmployee && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Select Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(WASTE_ITEMS).map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="capitalize"
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedItem("");
                    }}
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Item Selection */}
        {selectedEmployee && selectedCategory && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground capitalize">
                {selectedCategory} Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {currentItems.map((item) => (
                  <Button
                    key={item}
                    variant={selectedItem === item ? "default" : "outline"}
                    className="text-xs h-auto py-2 px-3"
                    onClick={() => setSelectedItem(item)}
                  >
                    {item}
                  </Button>
                ))}
              </div>

              {selectedItem && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Quantity Wasted
                    </label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="bg-secondary border-border"
                      placeholder="Enter quantity"
                    />
                  </div>
                  
                  <Button
                    onClick={addWasteEntry}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Record Waste
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Today's Entries */}
        {wasteEntries.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-500" />
                  Recent Waste Entries
                </div>
                <span className="text-xs text-muted-foreground">
                  {todayTotal} today
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {wasteEntries.slice(0, 20).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.item}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                          {entry.quantity} {entry.unit}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500 capitalize">
                          {entry.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.employee} • {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 shrink-0"
                      onClick={() => removeEntry(entry.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Today</p>
              <p className="text-2xl font-bold text-foreground">{todayTotal}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{wasteEntries.length}</p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold text-foreground">5</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}