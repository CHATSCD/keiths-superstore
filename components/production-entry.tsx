"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Check } from "lucide-react";

interface ProductionEntryProps {
  employees: Array<{ id: string; name: string }>;
  onSave: (data: ProductionData) => void;
  onCancel: () => void;
}

export interface ProductionData {
  employeeName: string;
  shift: "Morning" | "Afternoon" | "Night";
  date: Date;
  items: Array<{
    name: string;
    quantity: number;
    category: string;
  }>;
}

const ITEMS_BY_CATEGORY = {
  breakfast: [
    "Bacon", "Stuffed Waffles", "Little Pigs in a Blanket",
    "Big Pigs in a Blanket", "Kolache", "Boudin",
  ],
  roller: [
    "Egg Rolls", "Tornados", "Chicken Stick", "Corn Dog",
    "Hot Dog", "Sausage", "Crispitos",
  ],
  deli: [
    "Hamburger", "Pulled Pork", "Brisket",
    "Country Fried Steak", "Pork Chop", "Steak",
  ],
  bakery: [
    "Cinnamon Rolls", "Large Cookies", "Small Cookies",
    "Muffins", "Brownies", "Danishes", "Donuts",
  ],
  branded: [
    "Pizza", "Pizza Whole", "Pizza Hunk", "Wings", "Bites",
  ],
};

export function ProductionEntry({ employees, onSave, onCancel }: ProductionEntryProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [shift, setShift] = useState<"Morning" | "Afternoon" | "Night">("Morning");
  const [selectedCategory, setSelectedCategory] = useState<string>("breakfast");
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

  const handleQuantityChange = (itemName: string, value: string) => {
    const qty = parseInt(value) || 0;
    if (qty >= 0) {
      setQuantities(prev => ({ ...prev, [itemName]: qty }));
    }
  };

  const handleSave = () => {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([name, quantity]) => {
        // Find category
        let category = "";
        for (const [cat, itemList] of Object.entries(ITEMS_BY_CATEGORY)) {
          if (itemList.includes(name)) {
            category = cat;
            break;
          }
        }
        return { name, quantity, category };
      });

    if (items.length === 0) {
      alert("Please enter quantities for at least one item");
      return;
    }

    const data: ProductionData = {
      employeeName: employee.name,
      shift,
      date: new Date(),
      items,
    };

    onSave(data);
  };

  const currentItems = ITEMS_BY_CATEGORY[selectedCategory as keyof typeof ITEMS_BY_CATEGORY] || [];
  const totalItems = Object.values(quantities).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="space-y-4">
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-foreground">
            Manual Production Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Employee Selection */}
          <div>
            <Label className="text-xs text-muted-foreground">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Shift Selection */}
          <div>
            <Label className="text-xs text-muted-foreground">Shift</Label>
            <Select value={shift} onValueChange={(v) => setShift(v as any)}>
              <SelectTrigger className="bg-secondary border-border mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Morning">Morning (6am-2pm)</SelectItem>
                <SelectItem value="Afternoon">Afternoon (2pm-10pm)</SelectItem>
                <SelectItem value="Night">Night (10pm-6am)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      {employeeId && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Select Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(ITEMS_BY_CATEGORY).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  className="capitalize"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Entry */}
      {employeeId && selectedCategory && (
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground capitalize">
              {selectedCategory} - Enter Quantities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentItems.map((item) => (
              <div key={item} className="flex items-center justify-between gap-2">
                <Label className="text-sm text-foreground flex-1">{item}</Label>
                <Input
                  type="number"
                  min="0"
                  value={quantities[item] || ""}
                  onChange={(e) => handleQuantityChange(item, e.target.value)}
                  className="w-20 bg-secondary border-border text-center"
                  placeholder="0"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary & Actions */}
      {totalItems > 0 && (
        <Card className="border-border bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Total Items: {totalItems}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Object.keys(quantities).filter(k => quantities[k] > 0).length} different items
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Production
              </Button>
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}