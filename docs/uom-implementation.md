# UOM (Unit of Measure) Implementation

This document describes the comprehensive UOM (Unit of Measure) system implemented for the Baskit Distributor Hub.

## 🎯 Overview

The UOM system allows products to be sold, priced, and managed in multiple units of measure (e.g., pieces, boxes, cartons, kilograms) with automatic conversion between units and unit-specific pricing.

## 🏗️ Database Schema

### New Tables Created

#### 1. `uom_units`
Stores available units of measure.
```sql
- id (UUID, Primary Key)
- name (VARCHAR, Unique) - Unit name (e.g., 'pcs', 'box', 'kg')
- description (TEXT) - Human-readable description
- is_active (BOOLEAN) - Whether unit is active
- created_at, updated_at (TIMESTAMP)
```

#### 2. `uom_conversions`
Stores conversion factors between units for specific products.
```sql
- id (UUID, Primary Key)
- product_id (VARCHAR, Foreign Key to products.id)
- from_uom (VARCHAR) - Source unit
- to_uom (VARCHAR) - Target unit
- conversion_factor (DECIMAL) - Multiplier for conversion
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(product_id, from_uom, to_uom)
```

#### 3. `uom_pricing`
Stores UOM-specific pricing per distribution area.
```sql
- id (UUID, Primary Key)
- product_id (VARCHAR, Foreign Key to products.id)
- uom (VARCHAR) - Unit of measure
- area (VARCHAR) - Distribution area
- distributor_price (INTEGER) - Price in IDR
- moq (INTEGER) - Minimum order quantity
- moq_uom (VARCHAR) - MOQ unit of measure
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
- UNIQUE(product_id, uom, area)
```

### Updated Tables

#### `products` Table - New Columns
```sql
- base_uom (VARCHAR) - Base unit of measure (default: 'pcs')
- moq_uom (VARCHAR) - MOQ unit of measure (default: 'pcs')
- pricing_uom (VARCHAR) - Pricing unit of measure (default: 'pcs')
- enable_uom_conversions (BOOLEAN) - Enable UOM system (default: false)
```

## 🔧 Implementation Features

### 1. **UOM Configuration**
- **Base UOM**: Primary unit for the product
- **MOQ UOM**: Unit used for minimum order quantities
- **Pricing UOM**: Unit used for pricing display
- **Enable UOM Conversions**: Toggle for UOM functionality

### 2. **Conversion Management**
- Define conversion factors between units
- Example: 1 box = 12 pcs (conversion_factor = 12)
- Bidirectional conversion support
- Product-specific conversions

### 3. **UOM-Specific Pricing**
- Set different prices per UOM and distribution area
- Independent MOQ settings per UOM
- Automatic pricing matrix generation
- Smart pricing calculation based on conversions

### 4. **User Interface Enhancements**
- UOM labels in all pricing fields
- Clear indication of units throughout the interface
- Step-by-step UOM configuration wizard
- Auto-generation tools for bulk pricing setup

## 📋 Usage Workflow

### Setting Up UOM for a Product

1. **Enable UOM System**
   ```
   ✅ Enable UOM Conversions & Per-UOM Pricing
   ```

2. **Configure Base Units**
   ```
   Base UOM: pcs
   MOQ UOM: box
   Pricing UOM: pcs
   ```

3. **Add Unit Conversions**
   ```
   From: pcs → To: box, Factor: 0.0833 (1 pcs = 0.0833 box)
   From: box → To: pcs, Factor: 12 (1 box = 12 pcs)
   ```

4. **Generate Pricing Matrix**
   - Click "Generate SKU UOM Pricing"
   - System creates pricing for all relevant UOMs across all areas
   - Prices calculated using conversion factors

5. **Fine-tune Pricing**
   - Adjust prices per UOM and area as needed
   - Set specific MOQs per UOM

### Example Configuration

**Product**: Snack Crackers
- **Base UOM**: pcs (pieces)
- **MOQ UOM**: box
- **Pricing UOM**: pcs

**Conversions**:
- 1 box = 12 pcs
- 1 carton = 10 boxes = 120 pcs

**Pricing** (Jakarta area):
- Price per pcs: Rp 2,500
- Price per box: Rp 28,000 (12 × 2,500 - 10% bulk discount)
- MOQ: 2 boxes (24 pcs)

## 🚀 Migration and Setup

### 1. Apply Database Migration
```bash
# Option 1: Using shell script
./scripts/apply-uom-migration.sh

# Option 2: Using Node.js script
node scripts/apply-uom-migration.mjs

# Option 3: Manual Supabase CLI
supabase db reset --local
```

### 2. Default UOM Units
The migration automatically creates these default units:
- **pcs** (Pieces)
- **box** (Box)
- **carton** (Carton)
- **kg** (Kilogram)
- **gram** (Gram)
- **liter** (Liter)
- **ml** (Milliliter)
- **dozen** (Dozen)
- **pack** (Pack)
- **bottle** (Bottle)

## 💡 Technical Implementation

### Frontend Components

#### SKUManager.tsx - Enhanced Features
- UOM configuration interface
- Conversion factor management
- UOM-specific pricing tables
- Auto-generation functions

#### Key Functions
```typescript
// Get relevant UOMs for a product
getRelevantUOMs(): string[]

// Calculate quantity conversions
convertQuantity(qty: number, fromUOM: string, toUOM: string): number

// Add UOM conversion
addUomConversion(fromUom: string, toUom: string, factor: number)

// Generate pricing matrix
generateUomPricingMatrix()

// Save UOM data
saveSKU() // Enhanced to save conversions and pricing
```

### Backend Integration

#### Supabase Operations
```typescript
// Save UOM conversions
await supabase.from('uom_conversions').insert(conversions)

// Save UOM pricing
await supabase.from('uom_pricing').insert(pricing)

// Load UOM data
await fetchUOMConversionsForSKU(skuId)
await fetchUOMPricingForSKU(skuId)
```

## 🔍 Benefits

### For Distributors
- **Flexible Ordering**: Order in preferred units (pieces, boxes, cartons)
- **Clear Pricing**: Transparent pricing per unit type
- **Bulk Discounts**: Different pricing tiers per UOM
- **Accurate MOQs**: Unit-specific minimum quantities

### For Administrators
- **Easy Management**: Centralized UOM configuration
- **Bulk Operations**: Auto-generate pricing matrices
- **Consistent Display**: Clear unit labeling throughout
- **Flexible Pricing**: Support complex pricing structures

### For Business Operations
- **Inventory Accuracy**: Precise unit tracking
- **Pricing Flexibility**: Multiple pricing strategies
- **Order Processing**: Seamless unit conversions
- **Reporting**: Unit-aware analytics

## 🧪 Testing

### Test Scenarios

1. **Create Product with UOM**
   - Add conversions (1 box = 12 pcs)
   - Generate pricing matrix
   - Verify calculations

2. **Edit Existing Product**
   - Enable UOM system
   - Add conversions
   - Update pricing

3. **Complex Conversions**
   - Multi-level conversions (pcs → box → carton)
   - Verify bidirectional calculations

4. **Pricing Validation**
   - Check price per unit accuracy
   - Verify MOQ calculations
   - Test bulk pricing discounts

## 📈 Future Enhancements

### Planned Features
- **Weight/Volume Conversions**: Support for dimensional conversions
- **Dynamic Pricing**: Time-based or quantity-based pricing
- **Inventory Integration**: UOM-aware stock management
- **Reporting Dashboard**: UOM-specific analytics
- **API Extensions**: UOM endpoints for external integrations

### Performance Optimizations
- **Caching**: Store frequently used conversions
- **Indexing**: Optimize database queries
- **Bulk Operations**: Batch UOM updates
- **Background Jobs**: Async pricing calculations

## 🔗 Related Files

### Database
- `supabase/migrations/20251008000001_create_uom_tables.sql`
- `src/integrations/supabase/types.ts`

### Frontend
- `src/components/admin/SKUManager.tsx`
- `src/types/uom.ts` (interfaces)

### Scripts
- `scripts/apply-uom-migration.sh`
- `scripts/apply-uom-migration.mjs`

---

**Status**: ✅ Fully Implemented and Tested
**Version**: 1.0
**Last Updated**: October 8, 2025