export interface OCRResult {
  formType: "production" | "waste" | "unknown";
  employeeName: string | null;
  shift: "Morning" | "Afternoon" | "Night" | null;
  date: Date;
  items: Array<{
    name: string;
    quantity: number;
    confidence: number;
  }>;
  rawText: string;
}

// All known items from Keith's Superstore
const KNOWN_ITEMS = [
  // Breakfast
  "Bacon", "Stuffed Waffles", "Little Pigs in a Blanket", 
  "Big Pigs in a Blanket", "Kolache", "Boudin",
  // Roller Items
  "Egg Rolls", "Tornados", "Chicken Stick", "Corn Dog", 
  "Hot Dog", "Sausage", "Crispitos",
  // Deli
  "Hamburger", "Pulled Pork", "Brisket", 
  "Country Fried Steak", "Pork Chop", "Steak",
  // Bakery
  "Cinnamon Rolls", "Large Cookies", "Small Cookies", 
  "Muffins", "Brownies", "Danishes", "Donuts",
  // Branded
  "Pizza", "Pizza Whole", "Pizza Hunk", "Wings", 
  "Chicken Wings", "Bites",
];

const EMPLOYEE_NAMES = [
  "Shaun Dubuisson", "Sarah Williams", "David Chen", 
  "Emily Rodriguez", "James Thompson"
];

// Detect form type from text
export function detectFormType(text: string): "production" | "waste" | "unknown" {
  const lower = text.toLowerCase();
  
  if (lower.includes("production") || 
      lower.includes("cooked") || 
      lower.includes("prepared") ||
      lower.includes("qty 1") || lower.includes("qty 2")) {
    return "production";
  }
  
  if (lower.includes("waste") || 
      lower.includes("discard") || 
      lower.includes("throw") ||
      lower.includes("time discarded")) {
    return "waste";
  }
  
  return "unknown";
}

// Extract employee name from text
export function extractEmployee(text: string): string | null {
  for (const name of EMPLOYEE_NAMES) {
    // Check full name
    if (text.includes(name)) {
      return name;
    }
    
    // Check first name only
    const firstName = name.split(" ")[0];
    if (text.includes(firstName)) {
      return name;
    }
    
    // Check last name only
    const lastName = name.split(" ")[1];
    if (lastName && text.includes(lastName)) {
      return name;
    }
  }
  
  return null;
}

// Extract shift from text
export function extractShift(text: string): "Morning" | "Afternoon" | "Night" | null {
  const lower = text.toLowerCase();
  
  if (lower.includes("morning") || lower.includes("6am") || lower.includes("6:00")) {
    return "Morning";
  }
  
  if (lower.includes("afternoon") || lower.includes("2pm") || lower.includes("14:")) {
    return "Afternoon";
  }
  
  if (lower.includes("night") || lower.includes("10pm") || lower.includes("22:")) {
    return "Night";
  }
  
  return null;
}

// Clean OCR text to fix common errors
function cleanOCRText(text: string): string {
  return text
    .replace(/[|\\]/g, 'I')        // Pipe/backslash to I
    .replace(/[1!]/g, 'i')         // 1 or ! to i
    .replace(/[0]/g, 'O')          // 0 to O in words
    .replace(/[5]/g, 'S')          // 5 to S in words (context dependent)
    .replace(/\s+/g, ' ')          // Multiple spaces to single
    .trim();
}

// Calculate similarity between two strings (Levenshtein-ish)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Check word-by-word match
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  
  let matchCount = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2 || word1.includes(word2) || word2.includes(word1)) {
        matchCount++;
        break;
      }
    }
  }
  
  const maxWords = Math.max(words1.length, words2.length);
  return matchCount / maxWords;
}

// Find best matching known item
function findBestItemMatch(ocrText: string): { name: string; confidence: number } | null {
  const cleaned = cleanOCRText(ocrText);
  
  let bestMatch: string | null = null;
  let bestScore = 0;
  
  for (const knownItem of KNOWN_ITEMS) {
    const score = stringSimilarity(cleaned, knownItem);
    
    if (score > bestScore && score > 0.5) { // At least 50% match
      bestScore = score;
      bestMatch = knownItem;
    }
  }
  
  if (bestMatch) {
    return { name: bestMatch, confidence: bestScore };
  }
  
  return null;
}

// Extract item-quantity pairs from text
export function extractItemQuantities(text: string): Array<{ name: string; quantity: number; confidence: number }> {
  const results: Array<{ name: string; quantity: number; confidence: number }> = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines or obvious headers
    if (!trimmed || 
        trimmed.length < 3 ||
        /^(item|name|qty|quantity|shift|total|waste|production)/i.test(trimmed)) {
      continue;
    }
    
    // Pattern 1: "Item name ... 25" or "Item name....25"
    let match = trimmed.match(/^([A-Za-z\s'&]+?)[\s\.]{2,}(\d{1,3})$/);
    
    // Pattern 2: "Item name 25" (space before number)
    if (!match) {
      match = trimmed.match(/^([A-Za-z\s'&]+?)\s+(\d{1,3})$/);
    }
    
    // Pattern 3: "Item name: 25" or "Item name - 25"
    if (!match) {
      match = trimmed.match(/^([A-Za-z\s'&]+?)[\s:\-]+(\d{1,3})$/);
    }
    
    if (match) {
      const itemText = match[1].trim();
      const quantity = parseInt(match[2]);
      
      // Validate quantity range
      if (quantity < 1 || quantity > 500) continue;
      
      // Try to match against known items
      const matchedItem = findBestItemMatch(itemText);
      
      if (matchedItem) {
        // Check for duplicates
        const existing = results.find(r => r.name === matchedItem.name);
        if (!existing) {
          results.push({
            name: matchedItem.name,
            quantity: quantity,
            confidence: matchedItem.confidence,
          });
        }
      }
    }
  }
  
  return results;
}

// Main OCR processing function
export function processOCRText(text: string): OCRResult {
  const formType = detectFormType(text);
  const employeeName = extractEmployee(text);
  const shift = extractShift(text);
  const items = extractItemQuantities(text);
  
  return {
    formType,
    employeeName,
    shift,
    date: new Date(),
    items,
    rawText: text,
  };
}

// Validate OCR results
export function validateOCRResult(result: OCRResult): {
  isValid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Check critical fields
  if (!result.employeeName) {
    errors.push("Could not detect employee name");
  }
  
  if (!result.shift) {
    warnings.push("Could not detect shift - you'll need to select it");
  }
  
  if (result.formType === "unknown") {
    warnings.push("Could not determine form type - assuming waste sheet");
  }
  
  if (result.items.length === 0) {
    errors.push("No items found in the image");
  }
  
  // Check for low confidence items
  const lowConfidence = result.items.filter(item => item.confidence < 0.7);
  if (lowConfidence.length > 0) {
    warnings.push(`${lowConfidence.length} item(s) may need verification`);
  }
  
  const isValid = errors.length === 0;
  
  return { isValid, warnings, errors };
}

// Format result for display
export function formatOCRResultForDisplay(result: OCRResult): string {
  let output = "";
  
  output += `Form Type: ${result.formType.toUpperCase()}\n`;
  output += `Employee: ${result.employeeName || "Unknown"}\n`;
  output += `Shift: ${result.shift || "Unknown"}\n`;
  output += `\nItems Found (${result.items.length}):\n`;
  output += "-".repeat(40) + "\n";
  
  result.items.forEach(item => {
    const confidence = Math.round(item.confidence * 100);
    const flag = confidence < 70 ? " ⚠️" : "";
    output += `${item.name.padEnd(25)} ${String(item.quantity).padStart(3)}${flag}\n`;
  });
  
  return output;
}