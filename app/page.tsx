"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
import { Upload, Camera, X, AlertCircle, CheckCircle, Loader2, Plus } from "lucide-react";
import Tesseract from "tesseract.js";
import { processOCRText, validateOCRResult } from "@/lib/ocr-processor";
import { ProductionEntry } from "@/components/production-entry";

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
  cookedBy: string;
  recordedBy: string;
  shift: string;
  timestamp: Date;
  source: "ocr" | "manual";
}

interface ProductionEntryData {
  id: string;
  employeeName: string;
  shift: string;
  date: Date;
  items: Array<{
    name: string;
    quantityCooked: number;
    category: string;
  }>;
  source: "ocr" | "manual";
}

const defaultEmployees: Employee[] = [
  { id: "1", name: "Marcus Johnson", role: "manager", active: true },
  { id: "2", name: "Sarah Williams", role: "employee", active: true },
  { id: "3", name: "David Chen", role: "employee", active: true },
  { id: "4", name: "Emily Rodriguez", role: "employee", active: true },
  { id: "5", name: "James Thompson", role: "employee", active: true },
];

const STORAGE_KEYS = {
  employees: "keiths-employees",
  waste: "keiths-waste-entries",
  production: "keiths-production-entries",
};

export default function WasteTrackingPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [productionEntries, setProductionEntries] = useState<ProductionEntryData[]>([]);
  
  // Form state
  const [formType, setFormType] = useState<"production" | "waste">("waste");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<any>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  // For manual corrections
  const [recordedBy, setRecordedBy] = useState<string>("");
  const [todayTotal, setTodayTotal] = useState(0);

  // Load data
  useEffect(() => {
    const storedEmployees = localStorage.getItem(STORAGE_KEYS.employees);
    const storedWaste = localStorage.getItem(STORAGE_KEYS.waste);
    const storedProduction = localStorage.getItem(STORAGE_KEYS.production);
    
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
        const today = new Date().toDateString();
        const todayEntries = entries.filter((e: WasteEntry) => 
          new Date(e.timestamp).toDateString() === today
        );
        setTodayTotal(todayEntries.length);
      } catch {
        setWasteEntries([]);
      }
    }

    if (storedProduction) {
      try {
        setProductionEntries(JSON.parse(storedProduction));
      } catch {
        setProductionEntries([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleProcessImage = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setOcrProgress(0);

    try {
      const { data: { text } } = await Tesseract.recognize(
        selectedFile,
        'eng',
        {
          logger: (m) => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.round(m.progress * 100));
            }
          },
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ,.-/:',
          preserve_interword_spaces: '1',
        }
      );

      const result = processOCRText(text);
      const validation = validateOCRResult(result);

      setOcrResult({ ...result, validation });

      if (!validation.isValid) {
        showErrorToast("OCR had issues - please review carefully");
      } else if (validation.warnings.length > 0) {
        showSuccessToast("OCR complete - please review extracted data");
      } else {
        showSuccessToast("OCR successful!");
      }

    } catch (error) {
      showErrorToast("Failed to process image");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveOCRData = () => {
    if (!ocrResult || !recordedBy) {
      showErrorToast("Please select who is recording this");
      return;
    }

    const recordedByName = activeEmployees.find(e => e.id === recordedBy)?.name || "Unknown";

    if (formType === "production") {
      // Save production entry
      const newEntry: ProductionEntryData = {
        id: `prod-${Date.now()}`,
        employeeName: ocrResult.employeeName || recordedByName,
        shift: ocrResult.shift || "Morning",
        date: new Date(),
        items: ocrResult.items.map((item: any) => ({
          name: item.name,
          quantityCooked: item.quantity,
          category: "general",
        })),
        source: "ocr",
      };

      const updated = [newEntry, ...productionEntries];
      setProductionEntries(updated);
      localStorage.setItem(STORAGE_KEYS.production, JSON.stringify(updated));
      
      showSuccessToast(`Production logged: ${ocrResult.items.length} items`);
    } else {
      // Save waste entries
      const newEntries: WasteEntry[] = ocrResult.items.map((item: any) => ({
        id: `waste-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        item: item.name,
        category: "general",
        quantity: item.quantity,
        unit: "pcs",
        cookedBy: ocrResult.employeeName || "Unknown",
        recordedBy: recordedByName,
        shift: ocrResult.shift || "Morning",
        timestamp: new Date(),
        source: "ocr",
      }));

      const updated = [...newEntries, ...wasteEntries];
      setWasteEntries(updated);
      localStorage.setItem(STORAGE_KEYS.waste, JSON.stringify(updated));

      const today = new Date().toDateString();
      const todayEntries = updated.filter(e => 
        new Date(e.timestamp).toDateString() === today
      );
      setTodayTotal(todayEntries.length);

      showSuccessToast(`Waste logged: ${newEntries.length} items`);
    }

    // Reset
    setSelectedFile(null);
    setPreviewUrl("");
    setOcrResult(null);
    setRecordedBy("");
  };

  const handleManualSave = (data: any) => {
    const newEntry: ProductionEntryData = {
      id: `prod-${Date.now()}`,
      employeeName: data.employeeName,
      shift: data.shift,
      date: data.date,
      items: data.items,
      source: "manual",
    };

    const updated = [newEntry, ...productionEntries];
    setProductionEntries(updated);
    localStorage.setItem(STORAGE_KEYS.production, JSON.stringify(updated));
    
    showSuccessToast(`Production logged manually: ${data.items.length} items`);
    setShowManualEntry(false);
  };

  const removeEntry = (id: string) => {
    const updated = wasteEntries.filter(e => e.id !== id);
    setWasteEntries(updated);
    localStorage.setItem(STORAGE_KEYS.waste, JSON.stringify(updated));
    
    const today = new Date().toDateString();
    const todayEntries = updated.filter(e => 
      new Date(e.timestamp).toDateString() === today
    );
    setTodayTotal(todayEntries.length);
    
    showSuccessToast("Entry removed");
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <main className="flex-1 overflow-y-auto pb-20 px-4 pt-4 space-y-4">
        {/* Form Type Selection */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              What are you scanning?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={formType === "production" ? "default" : "outline"}
                onClick={() => setFormType("production")}
              >
                Production Report
              </Button>
              <Button
                variant={formType === "waste" ? "default" : "outline"}
                onClick={() => setFormType("waste")}
              >
                Waste Sheet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Image Upload */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              Upload Photo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
              variant="outline"
            >
              <Camera className="h-4 w-4 mr-2" />
              Take Photo
            </Button>

            {previewUrl && (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full rounded-lg border border-border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setOcrResult(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {selectedFile && !ocrResult && (
              <Button
                onClick={handleProcessImage}
                disabled={isProcessing}
                className="w-full bg-blue-500 hover:bg-blue-600"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing {ocrProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process Image
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* OCR Results */}
        {ocrResult && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Review Extracted Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Validation Messages */}
              {ocrResult.validation?.errors?.map((error: string, idx: number) => (
                <div key={idx} className="bg-red-500/10 text-red-500 p-2 rounded text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {error}
                </div>
              ))}
              
              {ocrResult.validation?.warnings?.map((warning: string, idx: number) => (
                <div key={idx} className="bg-orange-500/10 text-orange-500 p-2 rounded text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-2" />
                  {warning}
                </div>
              ))}

              {/* Extracted Info */}
              <div className="bg-secondary/50 rounded p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium capitalize">{ocrResult.formType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employee:</span>
                  <span className="font-medium">{ocrResult.employeeName || "Not detected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shift:</span>
                  <span className="font-medium">{ocrResult.shift || "Not detected"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Found:</span>
                  <span className="font-medium">{ocrResult.items?.length || 0}</span>
                </div>
              </div>

              {/* Items List */}
              {ocrResult.items && ocrResult.items.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Items:</p>
                  <div className="divide-y divide-border border rounded">
                    {ocrResult.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-2">
                        <span className="text-sm">{item.name}</span>
                        <span className="text-sm font-medium">{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Who's recording */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  I am recording this:
                </label>
                <Select value={recordedBy} onValueChange={setRecordedBy}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Select your name" />
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

              {/* Save Button */}
              <Button
                onClick={handleSaveOCRData}
                disabled={!recordedBy}
                className="w-full bg-green-500 hover:bg-green-600"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm & Save
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry Option */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowManualEntry(!showManualEntry)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showManualEntry ? "Hide" : "Show"} Manual Entry
        </Button>

        {showManualEntry && (
          <ProductionEntry
            employees={activeEmployees}
            onSave={handleManualSave}
            onCancel={() => setShowManualEntry(false)}
          />
        )}

        {/* Recent Entries */}
        {wasteEntries.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center justify-between text-foreground">
                Recent Waste Entries
                <span className="text-xs text-muted-foreground">{todayTotal} today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {wasteEntries.slice(0, 15).map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-4 hover:bg-secondary/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {entry.item}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-500">
                          {entry.quantity} {entry.unit}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                          By: {entry.cookedBy}
                        </span>
                        {entry.source === "ocr" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                            OCR
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.shift} • {entry.recordedBy}
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

        {/* Stats */}
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
              <p className="text-xs text-muted-foreground">Production</p>
              <p className="text-2xl font-bold text-foreground">{productionEntries.length}</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Navigation />
    </div>
  );
}
