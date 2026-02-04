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
import { CheckCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Package,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ClipboardList,
} from "lucide-react";

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
  unit: string;
}

const initialEmployees: Employee[] = [
  { id: "1", name: "Marcus Johnson", role: "employee", active: true },
  { id: "2", name: "Sarah Williams", role: "employee", active: true },
  { id: "3", name: "David Chen", role: "employee", active: true },
  { id: "4", name: "Emily Rodriguez", role: "manager", active: true },
  { id: "5", name: "James Thompson", role: "employee", active: false },
];

const initialItems: InventoryItem[] = [
  { id: "1", name: "Chicken Tenders", category: "Protein", parLevel: 50, currentStock: 32, unit: "lbs" },
  { id: "2", name: "Hot Dog Franks", category: "Protein", parLevel: 100, currentStock: 45, unit: "pcs" },
  { id: "3", name: "Potato Wedges", category: "Sides", parLevel: 40, currentStock: 28, unit: "lbs" },
  { id: "4", name: "Buffalo Wings", category: "Protein", parLevel: 60, currentStock: 38, unit: "lbs" },
  { id: "5", name: "Sub Rolls", category: "Bread", parLevel: 80, currentStock: 55, unit: "pcs" },
];

const categories = ["Protein", "Sides", "Bread", "Dairy", "Toppings", "Sauces"];
const units = ["lbs", "pcs", "gal", "oz", "boxes"];

const STORAGE_KEYS = {
  employees: "keiths-employees",
  items: "keiths-inventory-items",
};

export default function ManagerPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"employees" | "items" | "counts">("employees");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const storedEmployees = localStorage.getItem(STORAGE_KEYS.employees);
    const storedItems = localStorage.getItem(STORAGE_KEYS.items);
    
    if (storedEmployees) {
      try {
        setEmployees(JSON.parse(storedEmployees));
      } catch {
        setEmployees(initialEmployees);
      }
    } else {
      setEmployees(initialEmployees);
    }
    
    if (storedItems) {
      try {
        setItems(JSON.parse(storedItems));
      } catch {
        setItems(initialItems);
      }
    } else {
      setItems(initialItems);
    }
    
    setIsLoaded(true);
  }, []);

  // Save employees to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.employees, JSON.stringify(employees));
    }
  }, [employees, isLoaded]);

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(items));
    }
  }, [items, isLoaded]);

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
  
  // Employee form state
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeeRole, setNewEmployeeRole] = useState<"employee" | "manager">("employee");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [editEmployeeDialogOpen, setEditEmployeeDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editEmployeeName, setEditEmployeeName] = useState("");
  const [editEmployeeRole, setEditEmployeeRole] = useState<"employee" | "manager">("employee");
  
  // Item form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("");
  const [newItemParLevel, setNewItemParLevel] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("lbs");
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCategory, setEditItemCategory] = useState("");
  const [editItemParLevel, setEditItemParLevel] = useState("");
  const [editItemUnit, setEditItemUnit] = useState("lbs");
  
  // Par level editing
  const [editingPar, setEditingPar] = useState<string | null>(null);
  const [editParValue, setEditParValue] = useState("");
  
  // Count editing
  const [editingCount, setEditingCount] = useState<string | null>(null);
  const [editCountValue, setEditCountValue] = useState("");

  // Employee functions
  const handleAddEmployee = () => {
    if (!newEmployeeName.trim()) return;
    const newEmployee: Employee = {
      id: Date.now().toString(),
      name: newEmployeeName.trim(),
      role: newEmployeeRole,
      active: true,
    };
    setEmployees([...employees, newEmployee]);
    setNewEmployeeName("");
    setNewEmployeeRole("employee");
    setEmployeeDialogOpen(false);
    showSuccessToast(`Employee "${newEmployee.name}" added successfully`);
  };

  const handleToggleEmployee = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    setEmployees(employees.map(emp => 
      emp.id === id ? { ...emp, active: !emp.active } : emp
    ));
    if (employee) {
      showSuccessToast(`${employee.name} marked as ${employee.active ? "inactive" : "active"}`);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    setEmployees(employees.filter(emp => emp.id !== id));
    if (employee) {
      showSuccessToast(`Employee "${employee.name}" removed`);
    }
  };

  const openEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditEmployeeName(employee.name);
    setEditEmployeeRole(employee.role);
    setEditEmployeeDialogOpen(true);
  };

  const handleUpdateEmployee = () => {
    if (!editingEmployee || !editEmployeeName.trim()) return;
    const updatedName = editEmployeeName.trim();
    setEmployees(employees.map(emp => 
      emp.id === editingEmployee.id 
        ? { ...emp, name: updatedName, role: editEmployeeRole }
        : emp
    ));
    setEditEmployeeDialogOpen(false);
    setEditingEmployee(null);
    setEditEmployeeName("");
    setEditEmployeeRole("employee");
    showSuccessToast(`Employee "${updatedName}" updated successfully`);
  };

  // Item functions
  const handleAddItem = () => {
    if (!newItemName.trim() || !newItemCategory || !newItemParLevel) return;
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: newItemCategory,
      parLevel: parseInt(newItemParLevel, 10),
      currentStock: 0,
      unit: newItemUnit,
    };
    setItems([...items, newItem]);
    setNewItemName("");
    setNewItemCategory("");
    setNewItemParLevel("");
    setNewItemUnit("lbs");
    setItemDialogOpen(false);
    showSuccessToast(`Item "${newItem.name}" added successfully`);
  };

  const handleDeleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    setItems(items.filter(i => i.id !== id));
    if (item) {
      showSuccessToast(`Item "${item.name}" removed`);
    }
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setEditItemName(item.name);
    setEditItemCategory(item.category);
    setEditItemParLevel(item.parLevel.toString());
    setEditItemUnit(item.unit);
    setEditItemDialogOpen(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem || !editItemName.trim() || !editItemCategory || !editItemParLevel) return;
    const updatedName = editItemName.trim();
    setItems(items.map(item => 
      item.id === editingItem.id 
        ? { 
            ...item, 
            name: updatedName, 
            category: editItemCategory,
            parLevel: parseInt(editItemParLevel, 10),
            unit: editItemUnit
          }
        : item
    ));
    setEditItemDialogOpen(false);
    setEditingItem(null);
    setEditItemName("");
    setEditItemCategory("");
    setEditItemParLevel("");
    setEditItemUnit("lbs");
    showSuccessToast(`Item "${updatedName}" updated successfully`);
  };

  const handleSavePar = (id: string) => {
    const value = parseInt(editParValue, 10);
    if (isNaN(value) || value < 0) return;
    const item = items.find(i => i.id === id);
    setItems(items.map(item => 
      item.id === id ? { ...item, parLevel: value } : item
    ));
    setEditingPar(null);
    setEditParValue("");
    if (item) {
      showSuccessToast(`Par level for "${item.name}" set to ${value}`);
    }
  };

  const handleSaveCount = (id: string) => {
    const value = parseInt(editCountValue, 10);
    if (isNaN(value) || value < 0) return;
    const item = items.find(i => i.id === id);
    setItems(items.map(item => 
      item.id === id ? { ...item, currentStock: value } : item
    ));
    setEditingCount(null);
    setEditCountValue("");
    if (item) {
      showSuccessToast(`Count for "${item.name}" updated to ${value}`);
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Manager Dashboard" />
        <main className="px-4 py-4 flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Manager Dashboard" />

      <main className="px-4 py-4 space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === "employees" ? "default" : "outline"}
            onClick={() => setActiveTab("employees")}
            className={activeTab === "employees" 
              ? "flex-1 bg-primary text-primary-foreground" 
              : "flex-1 bg-transparent border-border text-foreground"
            }
          >
            <Users className="h-4 w-4 mr-2" />
            Employees
          </Button>
          <Button
            variant={activeTab === "items" ? "default" : "outline"}
            onClick={() => setActiveTab("items")}
            className={activeTab === "items" 
              ? "flex-1 bg-primary text-primary-foreground" 
              : "flex-1 bg-transparent border-border text-foreground"
            }
          >
            <Package className="h-4 w-4 mr-2" />
            Items
          </Button>
          <Button
            variant={activeTab === "counts" ? "default" : "outline"}
            onClick={() => setActiveTab("counts")}
            className={activeTab === "counts" 
              ? "flex-1 bg-primary text-primary-foreground" 
              : "flex-1 bg-transparent border-border text-foreground"
            }
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Par/Count
          </Button>
        </div>

        {/* Employees Tab */}
        {activeTab === "employees" && (
          <>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Employee List
                </CardTitle>
                <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Employee</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Employee Name</Label>
                        <Input
                          value={newEmployeeName}
                          onChange={(e) => setNewEmployeeName(e.target.value)}
                          placeholder="Enter full name"
                          className="bg-secondary border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Role</Label>
                        <Select value={newEmployeeRole} onValueChange={(v: "employee" | "manager") => setNewEmployeeRole(v)}>
                          <SelectTrigger className="bg-secondary border-border text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="employee">Employee</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleAddEmployee} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Employee
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {employees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${employee.active ? "bg-green-500" : "bg-muted-foreground"}`} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{employee.name}</p>
                          <Badge 
                            variant="outline" 
                            className={`text-xs mt-1 ${
                              employee.role === "manager" 
                                ? "border-accent text-accent" 
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {employee.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleEmployee(employee.id)}
                          className={employee.active ? "text-green-500" : "text-muted-foreground"}
                        >
                          {employee.active ? "Active" : "Inactive"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditEmployee(employee)}
                          className="text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Employee Dialog */}
            <Dialog open={editEmployeeDialogOpen} onOpenChange={setEditEmployeeDialogOpen}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Employee</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Employee Name</Label>
                    <Input
                      value={editEmployeeName}
                      onChange={(e) => setEditEmployeeName(e.target.value)}
                      placeholder="Enter full name"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Role</Label>
                    <Select value={editEmployeeRole} onValueChange={(v: "employee" | "manager") => setEditEmployeeRole(v)}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateEmployee} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    Update Employee
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="border-border bg-secondary/50">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Employees:</span>
                  <span className="text-foreground font-medium">{employees.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Active:</span>
                  <span className="text-green-500 font-medium">{employees.filter(e => e.active).length}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Items Tab */}
        {activeTab === "items" && (
          <>
            <Card className="border-border bg-card">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Package className="h-4 w-4 text-primary" />
                  Inventory Items
                </CardTitle>
                <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add New Item</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <Label className="text-foreground">Item Name</Label>
                        <Input
                          value={newItemName}
                          onChange={(e) => setNewItemName(e.target.value)}
                          placeholder="e.g., Fried Chicken"
                          className="bg-secondary border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-foreground">Category</Label>
                        <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                          <SelectTrigger className="bg-secondary border-border text-foreground">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-foreground">Par Level</Label>
                          <Input
                            type="number"
                            min="0"
                            value={newItemParLevel}
                            onChange={(e) => setNewItemParLevel(e.target.value)}
                            placeholder="50"
                            className="bg-secondary border-border text-foreground"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-foreground">Unit</Label>
                          <Select value={newItemUnit} onValueChange={setNewItemUnit}>
                            <SelectTrigger className="bg-secondary border-border text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((unit) => (
                                <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button onClick={handleAddItem} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                            {item.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Par: {item.parLevel} {item.unit}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditItem(item)}
                          className="text-accent hover:text-accent hover:bg-accent/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Edit Item Dialog */}
            <Dialog open={editItemDialogOpen} onOpenChange={setEditItemDialogOpen}>
              <DialogContent className="bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Edit Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label className="text-foreground">Item Name</Label>
                    <Input
                      value={editItemName}
                      onChange={(e) => setEditItemName(e.target.value)}
                      placeholder="e.g., Fried Chicken"
                      className="bg-secondary border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Category</Label>
                    <Select value={editItemCategory} onValueChange={setEditItemCategory}>
                      <SelectTrigger className="bg-secondary border-border text-foreground">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">Par Level</Label>
                      <Input
                        type="number"
                        min="0"
                        value={editItemParLevel}
                        onChange={(e) => setEditItemParLevel(e.target.value)}
                        placeholder="50"
                        className="bg-secondary border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Unit</Label>
                      <Select value={editItemUnit} onValueChange={setEditItemUnit}>
                        <SelectTrigger className="bg-secondary border-border text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((unit) => (
                            <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleUpdateItem} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Save className="h-4 w-4 mr-2" />
                    Update Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Card className="border-border bg-secondary/50">
              <CardContent className="p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items:</span>
                  <span className="text-foreground font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Categories:</span>
                  <span className="text-accent font-medium">{new Set(items.map(i => i.category)).size}</span>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Par Level & Count Tab */}
        {activeTab === "counts" && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" />
                Edit Par Levels & Counts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs text-muted-foreground font-semibold">Item</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold text-center">Par Level</TableHead>
                      <TableHead className="text-xs text-muted-foreground font-semibold text-center">Current Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} className="border-border">
                        <TableCell className="py-3">
                          <span className="text-sm font-medium text-foreground">{item.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({item.unit})</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {editingPar === item.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={editParValue}
                                onChange={(e) => setEditParValue(e.target.value)}
                                className="w-16 h-8 text-center text-sm bg-secondary border-border text-foreground"
                                autoFocus
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-500"
                                onClick={() => handleSavePar(item.id)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => { setEditingPar(null); setEditParValue(""); }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm text-foreground">{item.parLevel}</span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-accent"
                                onClick={() => { setEditingPar(item.id); setEditParValue(item.parLevel.toString()); }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {editingCount === item.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                min="0"
                                value={editCountValue}
                                onChange={(e) => setEditCountValue(e.target.value)}
                                className="w-16 h-8 text-center text-sm bg-secondary border-border text-foreground"
                                autoFocus
                              />
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-500"
                                onClick={() => handleSaveCount(item.id)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-8 w-8 text-muted-foreground"
                                onClick={() => { setEditingCount(null); setEditCountValue(""); }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <span className={`text-sm font-medium ${
                                item.currentStock < item.parLevel * 0.3 
                                  ? "text-primary" 
                                  : item.currentStock < item.parLevel * 0.6 
                                    ? "text-blue-500" 
                                    : "text-green-500"
                              }`}>
                                {item.currentStock}
                              </span>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 text-accent"
                                onClick={() => { setEditingCount(item.id); setEditCountValue(item.currentStock.toString()); }}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Navigation />
    </div>
  );
}
