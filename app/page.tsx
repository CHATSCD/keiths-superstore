"use client";

import React from "react";

import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "@/components/header";
import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Check, User, FileText, Loader2, Package, X, AlertCircle, CheckCircle, ImageIcon } from "lucide-react";
import Tesseract from "tesseract.js";

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

const defaultEmployees: Employee[] = [
  { id: "1", name: "Shaun Dubuisson", role: "manager", active: true },
  { id: "2", name: "Sarah Williams", role: "employee", active: true },
  { id: "3", name: "David Chen", role: "employee", active: true },
  { id: "4", name: "Emily Rodriguez", role: "employee", active: true },
  { id: "5", name: "James Thompson", role: "employee", active: true },
];

const STORAGE_KEYS = {
  employees: "keiths-employees",
  items: "keiths-inventory-items",
};

const STORAGE_KEY = STORAGE_KEYS.employees; // Declare the STORAGE_KEY variable

// Category mapping for item names
const categoryMapping = [
  { keywords: ["chicken", "wing", "tender", "breast", "nugget"], category: "Protein" },
  { keywords: ["pizza", "slice"], category: "Protein" },
  { keywords: ["wedge", "potato", "fry", "fries"], category: "Sides" },
  { keywords: ["corn", "dog"], category: "Protein" },
  { keywords: ["hot dog", "sausage", "frank"], category: "Protein" },
  { keywords: ["taquito", "burrito"], category: "Protein" },
  { keywords: ["egg", "roll"], category: "Protein" },
  { keywords: ["sandwich", "sub"], category: "Bread" },
  { keywords: ["salad", "coleslaw"], category: "Sides" },
  { keywords: ["wrap"], category: "Bread" },
  { keywords: ["donut", "doughnut", "pastry"], category: "Bread" },
  { keywords: ["muffin", "cookie"], category: "Bread" },
  { keywords: ["cheese", "milk", "cream"], category: "Dairy" },
  { keywords: ["sauce", "bbq", "ranch", "mayo", "mustard", "ketchup"], category: "Sauces" },
  { keywords: ["lettuce", "tomato", "onion", "pickle", "jalapeno", "pepper"], category: "Toppings" },
];

// Categorize a single item name
const categorizeItem = (itemName: string): string => {
  const lowerName = itemName.toLowerCase();
  
  for (const cat of categoryMapping) {
    for (const keyword of cat.keywords) {
      if (lowerName.includes(keyword)) {
        return cat.category;
      }
    }
  }
  
  // Default fallback
  return "Protein";
};

// Parse file content to extract item names
const parseFileContent = (content: string): string[] => {
  const items: string[] = [];
  
  // Split by common delimiters: newlines, commas, semicolons, tabs
  const lines = content.split(/[\n\r]+/).filter(line => line.trim());
  
  for (const line of lines) {
    // Check if line contains commas (CSV-like)
    if (line.includes(",")) {
      const parts = line.split(",").map(p => p.trim()).filter(p => p);
      // Take first column as item name (skip header-like content)
      const firstPart = parts[0];
      if (firstPart && !isHeaderRow(firstPart)) {
        items.push(cleanItemName(firstPart));
      }
    } else if (line.includes("\t")) {
      // Tab-separated
      const parts = line.split("\t").map(p => p.trim()).filter(p => p);
      const firstPart = parts[0];
      if (firstPart && !isHeaderRow(firstPart)) {
        items.push(cleanItemName(firstPart));
      }
    } else {
      // Plain text - each line is an item
      const trimmed = line.trim();
      if (trimmed && !isHeaderRow(trimmed)) {
        items.push(cleanItemName(trimmed));
      }
    }
  }
  
  return items.filter(item => item.length > 0 && item.length < 100);
};

// Check if a row looks like a header
const isHeaderRow = (text: string): boolean => {
  const headerKeywords = ["item", "name", "product", "description", "sku", "id", "code", "category", "#", "no.", "number"];
  const lower = text.toLowerCase();
  return headerKeywords.some(keyword => lower === keyword || lower.startsWith(keyword + " "));
};

// Clean up item name
const cleanItemName = (name: string): string => {
  return name
    .replace(/^[\d\.\-\)\s]+/, "") // Remove leading numbers, dots, dashes
    .replace(/["']/g, "") // Remove quotes
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase()); // Title case
};

interface ProcessedItem {
  id: string;
  name: string;
  category: string;
  parLevel: number;
  addedBy: string;
  timestamp: Date;
  status: "success" | "duplicate" | "error";
  message?: string;
}

interface UploadResult {
  added: number;
  duplicates: number;
  errors: number;
}

export default function UploadPage() {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number>(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);
  const [processedItems, setProcessedItems] = useState<ProcessedItem[]>([]);
  const [recentUploads, setRecentUploads] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load employees and inventory from localStorage
  useEffect(() => {
    const storedEmployees = localStorage.getItem(STORAGE_KEYS.employees);
    const storedItems = localStorage.getItem(STORAGE_KEYS.items);
    
    if (storedEmployees) {
      try {
        setEmployees(JSON.parse(storedEmployees));
      } catch {
        setEmployees(defaultEmployees);
      }
    } else {
      setEmployees(defaultEmployees);
    }
    
    if (storedItems) {
      try {
        setInventoryItems(JSON.parse(storedItems));
      } catch {
        setInventoryItems([]);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Get only active employees for the dropdown
  const activeEmployees = employees.filter(emp => emp.active);

  // Show toast notifications
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

  const showWarningToast = useCallback((message: string) => {
    toast({
      description: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <span>{message}</span>
        </div>
      ),
    });
  }, [toast]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFiles = async (files: FileList) => {
    if (!selectedEmployee) return;

    setIsProcessing(true);
    setOcrProgress(0);
    const employeeName = activeEmployees.find((e) => e.id === selectedEmployee)?.name || "Unknown";

    // Get current inventory from localStorage (fresh read)
    let currentInventory: InventoryItem[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.items);
      if (stored) {
        currentInventory = JSON.parse(stored);
      }
    } catch {
      currentInventory = inventoryItems;
    }

    const newProcessedItems: ProcessedItem[] = [];
    const itemsToAdd: InventoryItem[] = [];
    const result: UploadResult = { added: 0, duplicates: 0, errors: 0 };

    for (const file of Array.from(files)) {
      // Check if it's a text-based file we can parse
      const isTextFile = file.name.match(/\.(txt|csv|tsv|text)$/i) || 
                         file.type.includes("text") || 
                         file.type.includes("csv");
      
      // Check if it's an image file
      const isImageFile = file.type.startsWith("image/") || 
                          file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
      
      if (isTextFile) {
        // Read and parse file content
        try {
          const content = await file.text();
          const extractedItems = parseFileContent(content);
          
          if (extractedItems.length === 0) {
            newProcessedItems.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              category: "Unknown",
              parLevel: 0,
              addedBy: employeeName,
              timestamp: new Date(),
              status: "error",
              message: "No valid items found in file",
            });
            result.errors++;
            continue;
          }

          // Process each extracted item
          for (const itemName of extractedItems) {
            const category = categorizeItem(itemName);
            
            // Check for duplicates (case-insensitive)
            const isDuplicate = currentInventory.some(
              item => item.name.toLowerCase() === itemName.toLowerCase()
            );

            if (isDuplicate) {
              newProcessedItems.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: itemName,
                category,
                parLevel: 0,
                addedBy: employeeName,
                timestamp: new Date(),
                status: "duplicate",
                message: "Item already exists in inventory",
              });
              result.duplicates++;
              continue;
            }

            // Create new inventory item
            const newItemId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newInventoryItem: InventoryItem = {
              id: newItemId,
              name: itemName,
              category,
              parLevel: 0,
              currentStock: 0,
              unit: "pcs",
            };

            itemsToAdd.push(newInventoryItem);
            currentInventory.push(newInventoryItem);

            newProcessedItems.push({
              id: newItemId,
              name: itemName,
              category,
              parLevel: 0,
              addedBy: employeeName,
              timestamp: new Date(),
              status: "success",
              message: `Added from ${file.name}`,
            });
            result.added++;
          }
        } catch {
          newProcessedItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            category: "Unknown",
            parLevel: 0,
            addedBy: employeeName,
            timestamp: new Date(),
            status: "error",
            message: "Failed to read file",
          });
          result.errors++;
        }
      } else if (isImageFile) {
        // Process image with OCR
        try {
          setProcessingStatus(`Processing ${file.name} with OCR...`);
          
          const { data: { text } } = await Tesseract.recognize(
            file,
            'eng',
            {
              logger: (m) => {
                if (m.status === 'recognizing text') {
                  setOcrProgress(Math.round(m.progress * 100));
                }
              },
              tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
              tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ,.-/&\'',
              preserve_interword_spaces: '1',
            }
          );

          setProcessingStatus("Extracting waste items from form...");
          
          // Split text into lines
          const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
          
          // Look for item names - these are typically food items
          const wasteItems: string[] = [];
          let inWasteSection = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lowerLine = line.toLowerCase();
            
            // Detect waste section headers
            if (lowerLine.includes('waste') || lowerLine.includes('item')) {
              inWasteSection = true;
              continue;
            }
            
            // Skip header rows
            if (lowerLine.includes('time') || lowerLine.includes('quantity') || 
                lowerLine.includes('reason') || lowerLine.includes('shift') ||
                lowerLine.includes('discarded')) {
              continue;
            }
            
            // Skip branded items section markers
            if (lowerLine.includes('pizza') || lowerLine.includes('wings') || 
                lowerLine.includes('bites') || lowerLine.match(/^\d+\s*$/)) {
              continue;
            }
            
            // Extract item names - look for food-related words
            if (inWasteSection && line.length > 2 && line.length < 50) {
              // Clean up the line
              const cleanedLine = line
                .replace(/[|\\]/g, 'I')
                .replace(/\s+/g, ' ')
                .replace(/^\d+\s*/, '') // Remove leading numbers
                .replace(/\s*\d+$/, '') // Remove trailing numbers
                .trim();
              
              // Check if it looks like a food item name
              if (cleanedLine.length >= 3 && 
                  !cleanedLine.match(/^(qty|total|shift)$/i) &&
                  cleanedLine.match(/[a-zA-Z]{3,}/)) {
                
                // Capitalize properly
                const properName = cleanedLine
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(' ');
                
                wasteItems.push(properName);
              }
            }
          }
          
          // Remove duplicates and filter out common false positives
          const uniqueItems = [...new Set(wasteItems)].filter(item => {
            const lower = item.toLowerCase();
            return !['waste', 'item', 'branded', 'breakfast', 'roller', 'deli', 
                     'bakery', 'dinner', 'sandwiches', 'items', 'keith', 'superstore',
                     'time', 'quantity', 'reason'].includes(lower);
          });
          
          const extractedItems = uniqueItems;
          
          if (extractedItems.length === 0) {
            newProcessedItems.push({
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              category: "Unknown",
              parLevel: 0,
              addedBy: employeeName,
              timestamp: new Date(),
              status: "error",
              message: "No valid items found in image",
            });
            result.errors++;
            continue;
          }

          // Process each extracted item
          for (const itemName of extractedItems) {
            const category = categorizeItem(itemName);
            
            // Check for duplicates (case-insensitive)
            const isDuplicate = currentInventory.some(
              item => item.name.toLowerCase() === itemName.toLowerCase()
            );

            if (isDuplicate) {
              newProcessedItems.push({
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: itemName,
                category,
                parLevel: 0,
                addedBy: employeeName,
                timestamp: new Date(),
                status: "duplicate",
                message: "Item already exists in inventory",
              });
              result.duplicates++;
              continue;
            }

            // Create new inventory item
            const newItemId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newInventoryItem: InventoryItem = {
              id: newItemId,
              name: itemName,
              category,
              parLevel: 0,
              currentStock: 0,
              unit: "pcs",
            };

            itemsToAdd.push(newInventoryItem);
            currentInventory.push(newInventoryItem);

            newProcessedItems.push({
              id: newItemId,
              name: itemName,
              category,
              parLevel: 0,
              addedBy: employeeName,
              timestamp: new Date(),
              status: "success",
              message: `Added from ${file.name} (OCR)`,
            });
            result.added++;
          }
        } catch (error) {
          newProcessedItems.push({
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            category: "Unknown",
            parLevel: 0,
            addedBy: employeeName,
            timestamp: new Date(),
            status: "error",
            message: "OCR processing failed",
          });
          result.errors++;
        }
      } else {
        // For non-supported files, show error with helpful message
        newProcessedItems.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          category: "Unknown",
          parLevel: 0,
          addedBy: employeeName,
          timestamp: new Date(),
          status: "error",
          message: "Use .txt, .csv, or image files",
        });
        result.errors++;
      }
    }

    // Save new items to localStorage
    if (itemsToAdd.length > 0) {
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.items);
        let existingItems: InventoryItem[] = stored ? JSON.parse(stored) : [];
        existingItems = [...existingItems, ...itemsToAdd];
        localStorage.setItem(STORAGE_KEYS.items, JSON.stringify(existingItems));
        setInventoryItems(existingItems);
      } catch {
        showErrorToast("Failed to save items to inventory");
      }
    }

    setProcessedItems((prev) => [...newProcessedItems, ...prev]);
    setRecentUploads((prev) => prev + result.added);
    setIsProcessing(false);
    setOcrProgress(0);
    setProcessingStatus("");

    // Show result notifications
    if (result.added > 0) {
      showSuccessToast(`${result.added} item${result.added > 1 ? "s" : ""} added to inventory`);
    }
    if (result.duplicates > 0) {
      showWarningToast(`${result.duplicates} duplicate${result.duplicates > 1 ? "s" : ""} skipped`);
    }
    if (result.errors > 0) {
      showErrorToast(`${result.errors} file${result.errors > 1 ? "s" : ""} could not be processed`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && selectedEmployee) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeItem = (id: string) => {
    setProcessedItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <Header title="Document Upload" />
        <main className="px-4 py-4 flex items-center justify-center h-[60vh]">
          <div className="text-muted-foreground">Loading...</div>
        </main>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title="Document Upload" />

      <main className="px-4 py-4 space-y-4">
        {/* Employee Selection */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <User className="h-4 w-4 text-primary" />
              Employee Selection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select employee..." />
              </SelectTrigger>
              <SelectContent>
                {activeEmployees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEmployee && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-500">
                <Check className="h-3 w-3" />
                <span>
                  Uploading as{" "}
                  {activeEmployees.find((e) => e.id === selectedEmployee)?.name}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Interface */}
        <Card className="border-border bg-card overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Upload className="h-4 w-4 text-primary" />
              Upload Waste Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-border bg-secondary/50"
              } ${!selectedEmployee ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => selectedEmployee && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.csv,.tsv,text/plain,text/csv,image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={!selectedEmployee}
              />
              
              <div className="flex flex-col items-center justify-center py-12 px-6">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-sm text-foreground font-medium">
                      {processingStatus || "Processing documents..."}
                    </p>
                    {ocrProgress > 0 && (
                      <div className="w-full max-w-xs mt-3">
                        <Progress value={ocrProgress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1 text-center">
                          OCR Progress: {ocrProgress}%
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-categorizing items
                    </p>
                  </>
                ) : (
                  <>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      dragActive ? "bg-blue-500/20" : "bg-secondary"
                    }`}>
                      {dragActive ? (
                        <Upload className="h-8 w-8 text-blue-500" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-foreground font-medium text-center">
                      {selectedEmployee
                        ? "Drop files or images here, or tap to upload"
                        : "Select an employee first"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      Upload .txt, .csv files or images (JPG, PNG, etc.)
                    </p>
                    <p className="text-xs text-blue-500 mt-1 text-center">
                      Images will be processed with OCR
                    </p>
                    {selectedEmployee && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 border-blue-500 text-blue-500 hover:bg-blue-500/10 bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3 text-center">
              Items from files or images will be auto-categorized and added to Manager &gt; Items with Par Level 0
            </p>
          </CardContent>
        </Card>

        {/* Processed Items */}
        {processedItems.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-500" />
                  Upload Results
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setProcessedItems([])}
                >
                  Clear All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {processedItems.slice(0, 8).map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-4 transition-colors ${
                      item.status === "error" ? "bg-primary/5" : 
                      item.status === "duplicate" ? "bg-amber-500/5" : 
                      "hover:bg-secondary/50"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.status === "success" && (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        )}
                        {item.status === "duplicate" && (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        )}
                        {item.status === "error" && (
                          <AlertCircle className="h-4 w-4 text-primary shrink-0" />
                        )}
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1 ml-6">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          item.status === "success" ? "bg-blue-500/20 text-blue-500" :
                          item.status === "duplicate" ? "bg-amber-500/20 text-amber-500" :
                          "bg-primary/20 text-primary"
                        }`}>
                          {item.status === "success" ? item.category : 
                           item.status === "duplicate" ? "Duplicate" : "Error"}
                        </span>
                        {item.message && (
                          <span className="text-xs text-muted-foreground">
                            {item.message}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 ml-6">
                        {item.status === "success" ? `Added by ${item.addedBy}` : `Processed by ${item.addedBy}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                      onClick={() => removeItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {processedItems.length > 8 && (
                <div className="p-3 text-center border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    +{processedItems.length - 8} more items processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Session Uploads</p>
              <p className="text-2xl font-bold text-foreground">{recentUploads}</p>
              <p className="text-xs text-green-500">
                {processedItems.filter(i => i.status === "success").length} successful
              </p>
            </CardContent>
          </Card>
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Items Pending Par</p>
              <p className="text-2xl font-bold text-foreground">
                {inventoryItems.filter(i => i.parLevel === 0).length}
              </p>
              <p className="text-xs text-primary">Manager review needed</p>
            </CardContent>
          </Card>
        </div>

        {/* Total Inventory Count */}
        <Card className="border-border bg-secondary/50">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Total Inventory Items</p>
                <p className="text-lg font-bold text-foreground">{inventoryItems.length}</p>
              </div>
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </main>

      <Navigation />
    </div>
  );
}
