/**
 * SKU Manager Component
 * 
 * Note on TypeScript errors:
 * --------------------------
 * This component contains type assertions (as any) to work around TypeScript errors
 * with Supabase operations. The primary issues are:
 * 
 * 1. Type mismatches between our defined types and what Supabase client expects
 * 2. Strict typing that doesn't properly match the runtime behavior
 * 
 * Long-term solutions:
 * - Generate proper types from the database schema
 * - Update the Database interface in types.ts to match actual DB schema
 * - Consider using the Supabase CLI to generate types automatically
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Edit, Plus, X, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchAllBrands, getBrandNameFromCache, Brand } from '@/data/brands';

// Use the database types
// Using the products table structure instead of skus
export type SKU = {
  id: string;
  name: string;
  description: string;
  size: string;
  brand?: string;  // Brand might be directly available (migration)
  brand_id?: string;  // Or it might be a brand_id (TypeScript types)
  displayBrand?: string; // Calculated field for display purposes
  sku?: string;
  image_url?: string;
  consumer_price: number;
  is_active?: boolean;
  category?: string;
  category_id?: string;
  distributor_price?: number;
  base_distributor_price?: number;
  moq?: number;
  base_moq?: number;
  created_at?: string;
  updated_at?: string;
  image?: string;
  [key: string]: unknown; // Allow any other properties that might come from the database
};
type SKUInsert = Omit<SKU, 'id'>;
type SKUUpdate = Partial<SKUInsert>;

// Custom region type to match our schema
type Region = {
  id: string;
  product_id: string;
  area: string;
  distributor_price: number;
  moq: number;
  created_at?: string;
};
type RegionInsert = Omit<Region, 'id' | 'created_at'>;
type RegionUpdate = Partial<RegionInsert>;

const SKUManager = () => {
  const { toast } = useToast();
  const { lang } = useLanguage();
  const t = lang === 'id' ? id : en;
  
  const [skus, setSkus] = useState<SKU[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  
  // New brand state
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addingBrand, setAddingBrand] = useState(false);
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentSKU, setCurrentSKU] = useState<SKU | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    size: '',
    brand: '',
    sku: '',
    image_url: '',
    consumer_price: 0,
    is_active: true
  });
  
  // Region form states
  const [showRegions, setShowRegions] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegion, setNewRegion] = useState({
    area: 'Jabodetabek',
    distributor_price: 0,
    moq: 1
  });
  
  // Areas allowed for distribution
  const availableAreas = ["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"];
  
  // Fetch all SKUs
  useEffect(() => {
    fetchSKUs();
    loadBrands(); // Load brands on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load brands from database
  const loadBrands = async () => {
    try {
      // Check if brands table exists
      const { error: tableCheckError } = await supabase
        .from('brands')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.warn('Brands table might not exist:', tableCheckError.message);
        // Use an empty array if table doesn't exist
        setBrands([]);
        return;
      }
      
      const brandData = await fetchAllBrands();
      setBrands(brandData || []);
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: 'destructive',
      });
    }
  };
  
  // Function to create a brand directly (raw helper function)
  const createBrandRaw = async (brandName: string) => {
    try {
      // Check if brand already exists
      const existingBrand = brands.find(
        brand => brand.name.toLowerCase() === brandName.trim().toLowerCase()
      );
      
      if (existingBrand) {
        return existingBrand;
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

      // Cast to appropriate type to handle TypeScript error
      const brandData = newBrands[0] as unknown as { id: string; name: string };
      
      return {
        id: brandData.id,
        name: brandData.name
      };
    } catch (error) {
      console.error('Error in createBrand:', error);
      return null;
    }
  };
  
  // Function to create a new brand
  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Error",
        description: "Brand name cannot be empty",
        variant: 'destructive',
      });
      return;
    }
    
    setAddingBrand(true);
    
    try {
      // Use our helper function to create the brand
      const newBrandResult = await createBrandRaw(newBrandName.trim());
      
      if (!newBrandResult) {
        toast({
          title: "Error",
          description: "Failed to create brand",
          variant: 'destructive',
        });
        return;
      }
      
      // Create a brand object from the result
      const newBrand: Brand = {
        id: newBrandResult.id,
        name: newBrandResult.name
      };
      
      // Add to our brands list
      setBrands(prev => [...prev, newBrand]);
      
      // Set the form to use this brand
      setForm({...form, brand: newBrand.id});
      
      // Reset inputs
      setNewBrandName('');
      setShowNewBrandInput(false);
      
      toast({
        title: "Success",
        description: `Brand "${newBrand.name}" added successfully`,
      });
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: 'destructive',
      });
    } finally {
      setAddingBrand(false);
    }
  };

  const fetchSKUs = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase if available
      try {
        // Try to fetch products and include brand information
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name', { ascending: true });
          
        if (!error && data && data.length > 0) {
          console.log('Fetched product data:', data);
          // Log structure of the first product to debug
          console.log('First product structure:', Object.keys(data[0]));
          console.log('Sample product fields:', JSON.stringify(data[0]));
          
          // Transform data to ensure we have proper brand names
          const transformedData = data.map(product => {
            // Cast the product to a Record<string, any> to access properties
            const p = product as Record<string, unknown>;
            
            // Get actual brand name using the lookup function
            const brandId = (p.brand_id as string) || '';
            const brandName = getBrandNameFromCache(brandId);
            
            return {
              ...p,
              // Set the displayBrand field to the actual brand name
              displayBrand: brandName
            } as SKU;
          });
          
          setSkus(transformedData);
          setIsLoading(false);
          return;
        }
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using mock data instead', supabaseError);
      }
      
      // Fall back to mock data if Supabase fetch fails
      console.log('Using mock SKU data');
      import('@/data/mockData').then(({ mockSKUs }) => {
        console.log('Loaded mock SKU data:', mockSKUs);
        setSkus(mockSKUs);
        setIsLoading(false);
      }).catch(e => {
        console.error('Failed to load mock data:', e);
        setIsLoading(false);
      });
      return; // Early return to avoid setting isLoading=false twice
    } catch (error) {
      console.error('Error fetching SKUs:', error);
      toast({
        title: t.errorFetching,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch regions for a specific SKU
  const fetchRegionsForSKU = async (skuId: string) => {
    try {
      const { data, error } = await supabase
        .from('region_pricing')
        .select('*')
        .eq('product_id', skuId);
        
      if (error) throw error;
      
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
      toast({
        title: t.errorFetchingRegions,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  // Add or update a SKU
  const saveSKU = async () => {
    try {
      let result;
      
      const skuData = {
        name: form.name,
        description: form.description,
        size: form.size,
        brand: form.brand, // For direct brand field in migration schema
        brand_id: form.brand, // For brand_id field in TypeScript types
        sku: form.sku,
        image_url: form.image_url,
        consumer_price: form.consumer_price,
        is_active: form.is_active
      };
      
      if (editMode && currentSKU) {
        // Update existing SKU in the products table
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our SKU type structure
          .update(skuData)
          .eq('id', currentSKU.id);
      } else {
        // Insert new SKU
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our SKU type structure
          .insert(skuData)
          .select();
      }
      
      if (result.error) throw result.error;
      
      // If regions are shown, save them too
      if (showRegions && regions.length > 0) {
        const skuId = editMode && currentSKU ? currentSKU.id : result.data[0].id;
        
        // First delete any existing regions to prevent duplicates
        await supabase
          .from('region_pricing')
          .delete()
          .eq('product_id', skuId);
        
        // Then insert the new regions
        const regionsToInsert = regions.map(region => ({
          product_id: skuId,
          area: region.area,
          distributor_price: region.distributor_price,
          moq: region.moq
        }));
        
        // Using type assertion to work around Supabase type issues
        const { error: regionError } = await supabase
          .from('region_pricing')
          // @ts-expect-error - Supabase types don't match our Region type structure
          .insert(regionsToInsert);
          
        if (regionError) throw regionError;
      }
      
      toast({
        title: editMode ? t.skuUpdated : t.skuCreated,
        description: editMode ? t.skuUpdatedDesc : t.skuCreatedDesc,
      });
      
      // Refresh the SKU list
      fetchSKUs();
      closeDialog();
    } catch (error) {
      console.error('Error saving SKU:', error);
      toast({
        title: t.errorSaving,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };

  // Delete a SKU
  const deleteSKU = async () => {
    if (!currentSKU) return;
    
    try {
      // First delete all regions for this SKU
      await supabase
        .from('region_pricing')
        .delete()
        .eq('product_id', currentSKU.id);
      
      // Then delete the SKU itself from the products table
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', currentSKU.id);
      
      if (error) throw error;
      
      toast({
        title: t.skuDeleted,
        description: t.skuDeletedDesc,
      });
      
      // Refresh the SKU list
      fetchSKUs();
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting SKU:', error);
      toast({
        title: t.errorDeleting,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  // Handle adding a new region
  const addRegion = () => {
    if (newRegion.area && newRegion.distributor_price > 0) {
      const newRegionEntry: Region = { 
        id: Math.random().toString(), 
        product_id: currentSKU?.id || '', 
        area: newRegion.area,
        distributor_price: newRegion.distributor_price,
        moq: newRegion.moq
      };
      setRegions([...regions, newRegionEntry]);
      setNewRegion({ area: 'Jabodetabek', distributor_price: 0, moq: 1 });
    }
  };
  
  // Handle removing a region
  const removeRegion = (index: number) => {
    setRegions(regions.filter((_, i) => i !== index));
  };
  
  // Open dialog to create a new SKU
  const openCreateDialog = () => {
    setEditMode(false);
    setCurrentSKU(null);
    setForm({
      name: '',
      description: '',
      size: '',
      brand: '',
      sku: '',
      image_url: '',
      consumer_price: 0,
      is_active: true
    });
    setRegions([]);
    setShowRegions(false);
    setIsDialogOpen(true);
  };
  
  // Open dialog to edit an existing SKU
  const openEditDialog = async (sku: SKU) => {
    console.log('Opening edit dialog with SKU:', sku);
    console.log('SKU object keys:', Object.keys(sku));
    
    // Get the brand_id - this is what we need for the dropdown
    const brandId = sku.brand_id || '';
    console.log('Brand ID value:', brandId);
    
    setEditMode(true);
    setCurrentSKU(sku);
    setForm({
      name: sku.name,
      description: sku.description || '',
      size: sku.size,
      brand: brandId, // Use the brand ID for the dropdown
      sku: sku.sku || '',
      image_url: sku.image_url || '',
      consumer_price: sku.consumer_price,
      is_active: sku.is_active !== false // Default to true if not set
    });
    
    // Fetch regions for this SKU
    await fetchRegionsForSKU(sku.id);
    
    setShowRegions(false);
    setIsDialogOpen(true);
  };
  
  // Open dialog to confirm deletion
  const openDeleteDialog = (sku: SKU) => {
    setCurrentSKU(sku);
    setIsDeleteDialogOpen(true);
  };
  
  // Close all dialogs
  const closeDialog = () => {
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
  };
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: checked }));
  };
  
  // Handle number input changes
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };
  
  // Filter SKUs based on search query
  const filteredSKUs = skus.filter(sku => 
    sku.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    // Use displayBrand, fallback to brand or brand_id
    (sku.displayBrand || sku.brand || sku.brand_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sku.sku || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{t.skuManagement}</h2>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t.addNewSku}
        </Button>
      </div>
      
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.searchSkus}
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={() => setSearchQuery('')}>
          {t.clear}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.name}</TableHead>
              <TableHead>{t.brand}</TableHead>
              <TableHead>{t.size}</TableHead>
              <TableHead>{t.sku}</TableHead>
              <TableHead className="text-right">{t.consumerPrice}</TableHead>
              <TableHead className="text-right">{t.status}</TableHead>
              <TableHead className="text-right">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-muted-foreground mt-2">{t.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredSKUs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">{t.noSkusFound}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSKUs.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-medium">{sku.name}</TableCell>
                  <TableCell>{sku.displayBrand || getBrandNameFromCache(sku.brand_id || '')}</TableCell>
                  <TableCell>{sku.size}</TableCell>
                  <TableCell>{sku.sku}</TableCell>
                  <TableCell className="text-right">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                    }).format(sku.consumer_price)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${sku.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {sku.is_active ? t.active : t.inactive}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(sku)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(sku)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* SKU Form Dialog */}
      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          if (open) loadBrands(); // Reload brands when dialog opens
          setIsDialogOpen(open);
        }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="sku-form-description">
          <DialogHeader>
            <DialogTitle>
              {editMode ? t.editSku : t.addNewSku}
            </DialogTitle>
            <p id="sku-form-description" className="text-sm text-muted-foreground">
              {editMode ? "Edit product details below" : "Fill in the product details below"}
            </p>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.name}</Label>
                <Input
                  id="name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="brand">{t.brand}</Label>
                {!showNewBrandInput ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        name="brand"
                        value={form.brand}
                        onValueChange={(value) => setForm({...form, brand: value})}
                        required
                      >
                        <SelectTrigger id="brand">
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
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
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowNewBrandInput(true)}
                      title="Add new brand"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new brand name"
                      value={newBrandName}
                      onChange={(e) => setNewBrandName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm" 
                      onClick={handleCreateBrand}
                      disabled={!newBrandName.trim() || addingBrand}
                    >
                      {addingBrand ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : 'Add'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setShowNewBrandInput(false);
                        setNewBrandName('');
                      }}
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">{t.size}</Label>
                <Input
                  id="size"
                  name="size"
                  value={form.size}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sku">{t.sku}</Label>
                <Input
                  id="sku"
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">{t.imageUrl}</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={form.image_url}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consumer_price">{t.consumerPrice}</Label>
                <Input
                  id="consumer_price"
                  name="consumer_price"
                  type="number"
                  value={form.consumer_price}
                  onChange={handleNumberChange}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="is_active">{t.isActive}</Label>
            </div>
            
            {/* Regional pricing section */}
            <div className="pt-4 border-t">
              <button 
                type="button"
                onClick={() => setShowRegions(!showRegions)}
                className="flex items-center text-sm font-medium text-primary"
              >
                {showRegions ? t.hideRegionalPricing : t.showRegionalPricing}
              </button>
              
              {showRegions && (
                <div className="mt-4 space-y-4">
                  <h3 className="font-medium">{t.regionalPricing}</h3>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.area}</TableHead>
                          <TableHead>{t.distributorPrice}</TableHead>
                          <TableHead>{t.moq}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              {t.noRegionalPricing}
                            </TableCell>
                          </TableRow>
                        ) : (
                          regions.map((region, index) => (
                            <TableRow key={region.id || index}>
                              <TableCell>{region.area}</TableCell>
                              <TableCell>
                                {new Intl.NumberFormat('id-ID', {
                                  style: 'currency',
                                  currency: 'IDR',
                                  minimumFractionDigits: 0,
                                }).format(region.distributor_price)}
                              </TableCell>
                              <TableCell>{region.moq}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeRegion(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Add new region form */}
                  <div className="flex gap-3 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="region_area">{t.area}</Label>
                      <Select
                        value={newRegion.area}
                        onValueChange={(value) => setNewRegion({...newRegion, area: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t.selectArea} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAreas.map(area => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="region_price">{t.distributorPrice}</Label>
                      <Input
                        id="region_price"
                        type="number"
                        value={newRegion.distributor_price}
                        onChange={(e) => setNewRegion({
                          ...newRegion, 
                          distributor_price: parseFloat(e.target.value) || 0
                        })}
                      />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="region_moq">{t.moq}</Label>
                      <Input
                        id="region_moq"
                        type="number"
                        value={newRegion.moq}
                        onChange={(e) => setNewRegion({
                          ...newRegion, 
                          moq: parseInt(e.target.value) || 1
                        })}
                        min={1}
                      />
                    </div>
                    
                    <div>
                      <Button type="button" onClick={addRegion}>
                        {t.addRegion}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              {t.cancel}
            </Button>
            <Button onClick={saveSKU}>
              {editMode ? t.saveChanges : t.createSku}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent aria-describedby="delete-confirmation-text">
          <DialogHeader>
            <DialogTitle>{t.confirmDelete}</DialogTitle>
          </DialogHeader>
          <p id="delete-confirmation-text" className="py-4">
            {t.deleteConfirmationText} <strong>{currentSKU?.name} {currentSKU?.size}</strong>?
            {t.thisActionCannot}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button variant="destructive" onClick={deleteSKU}>
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Translations
const id = {
  skuManagement: 'Manajemen SKU',
  addNewSku: 'Tambah SKU Baru',
  editSku: 'Edit SKU',
  searchSkus: 'Cari SKU berdasarkan nama, brand, atau kode SKU...',
  clear: 'Bersihkan',
  name: 'Nama',
  brand: 'Brand',
  size: 'Ukuran',
  sku: 'SKU',
  consumerPrice: 'Harga Konsumen',
  status: 'Status',
  actions: 'Aksi',
  loading: 'Memuat SKU...',
  noSkusFound: 'Tidak ada SKU yang ditemukan.',
  active: 'Aktif',
  inactive: 'Non-aktif',
  description: 'Deskripsi',
  imageUrl: 'URL Gambar',
  isActive: 'SKU Aktif',
  showRegionalPricing: 'Tampilkan Harga Regional',
  hideRegionalPricing: 'Sembunyikan Harga Regional',
  regionalPricing: 'Harga Regional',
  area: 'Area',
  distributorPrice: 'Harga Distributor',
  moq: 'MOQ',
  noRegionalPricing: 'Tidak ada pengaturan harga regional.',
  selectArea: 'Pilih Area',
  addRegion: 'Tambah Area',
  cancel: 'Batal',
  saveChanges: 'Simpan Perubahan',
  createSku: 'Buat SKU',
  confirmDelete: 'Konfirmasi Penghapusan',
  deleteConfirmationText: 'Apakah Anda yakin ingin menghapus SKU',
  thisActionCannot: ' Tindakan ini tidak dapat dibatalkan.',
  delete: 'Hapus',
  errorFetching: 'Gagal memuat SKU',
  errorFetchingRegions: 'Gagal memuat data area',
  errorSaving: 'Gagal menyimpan SKU',
  errorDeleting: 'Gagal menghapus SKU',
  skuCreated: 'SKU berhasil dibuat',
  skuCreatedDesc: 'SKU baru telah berhasil ditambahkan ke database',
  skuUpdated: 'SKU berhasil diperbarui',
  skuUpdatedDesc: 'Perubahan pada SKU telah disimpan',
  skuDeleted: 'SKU berhasil dihapus',
  skuDeletedDesc: 'SKU telah berhasil dihapus dari database',
};

const en = {
  skuManagement: 'SKU Management',
  addNewSku: 'Add New SKU',
  editSku: 'Edit SKU',
  searchSkus: 'Search SKUs by name, brand, or SKU code...',
  clear: 'Clear',
  name: 'Name',
  brand: 'Brand',
  size: 'Size',
  sku: 'SKU',
  consumerPrice: 'Consumer Price',
  status: 'Status',
  actions: 'Actions',
  loading: 'Loading SKUs...',
  noSkusFound: 'No SKUs found.',
  active: 'Active',
  inactive: 'Inactive',
  description: 'Description',
  imageUrl: 'Image URL',
  isActive: 'SKU is Active',
  showRegionalPricing: 'Show Regional Pricing',
  hideRegionalPricing: 'Hide Regional Pricing',
  regionalPricing: 'Regional Pricing',
  area: 'Area',
  distributorPrice: 'Distributor Price',
  moq: 'MOQ',
  noRegionalPricing: 'No regional pricing configured.',
  selectArea: 'Select Area',
  addRegion: 'Add Region',
  cancel: 'Cancel',
  saveChanges: 'Save Changes',
  createSku: 'Create SKU',
  confirmDelete: 'Confirm Deletion',
  deleteConfirmationText: 'Are you sure you want to delete the SKU',
  thisActionCannot: ' This action cannot be undone.',
  delete: 'Delete',
  errorFetching: 'Failed to fetch SKUs',
  errorFetchingRegions: 'Failed to fetch region data',
  errorSaving: 'Failed to save SKU',
  errorDeleting: 'Failed to delete SKU',
  skuCreated: 'SKU created successfully',
  skuCreatedDesc: 'The new SKU has been added to the database',
  skuUpdated: 'SKU updated successfully',
  skuUpdatedDesc: 'Changes to the SKU have been saved',
  skuDeleted: 'SKU deleted successfully',
  skuDeletedDesc: 'The SKU has been removed from the database',
};

export default SKUManager;
