# SKU Manager Implementation Guide

This guide provides steps to implement the full SKU Manager with brand integration. The temporary component `SKUManager.temp.tsx` demonstrates how to add the brand selection and creation functionality, but the complete implementation needs to be merged into the main `SKUManager.tsx` component.

## Implementation Steps

### 1. Fix the 500 Internal Server Error

The 500 Internal Server Error in `SKUManager.tsx` is likely due to syntax errors. Make sure:

- All imports are correctly specified
- All components are properly closed
- No missing dependencies in useEffect hooks

### 2. Implement Brand Management

Copy these key elements from `SKUManager.temp.tsx` to `SKUManager.tsx`:

```tsx
// State for brand management
const [brands, setBrands] = useState<Brand[]>([]);
const [selectedBrand, setSelectedBrand] = useState('');
const [showNewBrandInput, setShowNewBrandInput] = useState(false);
const [newBrandName, setNewBrandName] = useState('');
const [addingBrand, setAddingBrand] = useState(false);
const [isLoading, setIsLoading] = useState(true);

// Load brands on component mount
useEffect(() => {
  loadBrands();
  // We only want to load brands once on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// Load all brands from the database
const loadBrands = async () => {
  setIsLoading(true);
  try {
    const brandsData = await fetchAllBrands();
    setBrands(brandsData || []);
  } catch (error) {
    console.error('Error loading brands:', error);
    toast({
      title: 'Error',
      description: 'Failed to load brands. Please try again.',
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
};

// Handle brand selection
const handleBrandSelect = (value: string) => {
  if (value === 'new') {
    setShowNewBrandInput(true);
  } else {
    setSelectedBrand(value);
  }
};

// Create a new brand
const createBrand = async (brandName: string) => {
  try {
    // Check if brand already exists
    const existingBrand = brands.find(
      brand => brand.name.toLowerCase() === brandName.trim().toLowerCase()
    );
    
    if (existingBrand) {
      setSelectedBrand(existingBrand.id);
      setShowNewBrandInput(false);
      setNewBrandName('');
      return {
        id: existingBrand.id,
        name: existingBrand.name
      };
    }

    // Insert the new brand with proper type casting
    const { error } = await supabase
      .from('brands')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ name: brandName.trim() } as any);

    if (error) {
      console.error('Error creating brand:', error);
      return null;
    }

    // Fetch the newly created brand
    const { data: newBrands, error: fetchError } = await supabase
      .from('brands')
      .select('*')
      .eq('name', brandName.trim())
      .limit(1);

    if (fetchError || !newBrands || newBrands.length === 0) {
      console.error('Error fetching new brand:', fetchError);
      return null;
    }

    const newBrand = {
      id: newBrands[0].id,
      name: newBrands[0].name
    };

    // Update the brands list
    setBrands([...brands, newBrand]);
    setSelectedBrand(newBrand.id);
    
    return newBrand;
  } catch (error) {
    console.error('Error in createBrand:', error);
    return null;
  }
};

// Handle adding a new brand
const handleAddBrand = async () => {
  if (!newBrandName.trim()) {
    toast({
      title: 'Error',
      description: 'Brand name cannot be empty',
      variant: 'destructive',
    });
    return;
  }

  setAddingBrand(true);
  try {
    const newBrand = await createBrand(newBrandName);
    
    if (newBrand) {
      toast({
        title: 'Success',
        description: `Brand "${newBrand.name}" created successfully`,
      });
      setNewBrandName('');
      setShowNewBrandInput(false);
    } else {
      toast({
        title: 'Error',
        description: 'Failed to create brand. Please try again.',
        variant: 'destructive',
      });
    }
  } finally {
    setAddingBrand(false);
  }
};

// Cancel adding a new brand
const handleCancelAddBrand = () => {
  setShowNewBrandInput(false);
  setNewBrandName('');
};
```

### 3. Add the Brand Selection UI

In your main SKU form, add this UI component for brand selection:

```tsx
<div className="space-y-2">
  <Label htmlFor="brand">Brand</Label>
  {showNewBrandInput ? (
    <div className="flex items-center gap-2">
      <Input
        id="newBrand"
        placeholder="Enter new brand name"
        value={newBrandName}
        onChange={(e) => setNewBrandName(e.target.value)}
      />
      <Button 
        variant="outline" 
        size="icon" 
        onClick={handleCancelAddBrand}
        disabled={addingBrand}
      >
        <X className="h-4 w-4" />
      </Button>
      <Button onClick={handleAddBrand} disabled={addingBrand}>
        {addingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Brand'}
      </Button>
    </div>
  ) : (
    <Select value={selectedBrand} onValueChange={handleBrandSelect}>
      <SelectTrigger>
        <SelectValue placeholder="Select brand" />
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
          </div>
        ) : (
          <>
            {brands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
            <SelectItem value="new">
              <div className="flex items-center">
                <Plus className="mr-2 h-4 w-4" />
                Add New Brand
              </div>
            </SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  )}
</div>
```

### 4. Update SKU Creation/Editing Logic

When creating or updating an SKU, make sure to include the brand ID:

```tsx
// Example for creating a new SKU
const createSKU = async () => {
  // Validate form data
  if (!selectedBrand) {
    toast({
      title: 'Error',
      description: 'Please select a brand',
      variant: 'destructive',
    });
    return;
  }
  
  // Other validation...

  // Create SKU object with brand ID
  const skuData = {
    // Other SKU fields...
    brand_id: selectedBrand,
  };

  // Save to database
  // ...
};
```

### 5. Handle TypeScript Errors with Supabase

For TypeScript errors related to Supabase types, you can use type assertions as shown in the temporary component:

```tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
.insert({ name: brandName.trim() } as any)
```

For a more type-safe approach, consider generating proper TypeScript types from your Supabase schema using the Supabase CLI.

## Testing

Make sure to test the following scenarios:

1. Selecting an existing brand from the dropdown
2. Adding a new brand
3. Handling errors (duplicate brands, empty brand names)
4. SKU creation with the selected brand
5. Loading UI states (loading indicators, disabled buttons during operations)

## Production Improvements

For a production-ready implementation, consider:

1. Moving brand creation logic to a centralized utility function
2. Adding proper error handling with specific error messages
3. Implementing caching for brand data to reduce database queries
4. Adding validation for brand names (length, format, etc.)
5. Generating proper TypeScript types from your Supabase schema
