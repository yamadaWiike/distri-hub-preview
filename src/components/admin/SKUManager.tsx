/**
 * IMPORTANT: TypeScript Error Handling
 * 
 * This file uses @ts-expect-error comments to work around Supabase typing issues.
 * 
 * Current issues:
 * - Mismatches between our SKU/Region types and Supabase's      } else {
        // Insert new SKU into the products table
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our SKU type structure
          .insert([skuData])
          .select();ations
 * - 'never' type errors when trying to update or insert data
 * 
 * Recommended fixes (TODO):
 * 1. Use Supabase CLI to generate accurate types from the DB schema
 *    npx supabase gen types typescript --project-id <your-project-id>
 * 2. Update the Database interface in types.ts properly
 * 3. Remove type assertions once proper types are in place
 */

// Local interfaces for database operations
interface CategoryRow {
  id: string;
  name: string;
}

interface RegionRow {
  id: string;
  name: string;
  province?: string;
}

interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

// Variant pricing structure
interface VariantPricing {
  variant_name: string;
  area: string;
  distributor_price: number;
  moq: number;
}
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
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Edit, Plus, X, Search, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PostgrestError } from '@supabase/supabase-js';
import { fetchAllBrands, getBrandNameFromCache, Brand, createNewBrand } from '@/data/brands';
import { Database } from '@/integrations/supabase/types';

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
  // Use a more specific union type instead of any
  [key: string]: string | number | boolean | undefined;
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
  const { user } = useAuth(); // Add auth context
  
  const [skus, setSkus] = useState<SKU[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [variantOptions, setVariantOptions] = useState<{id: string, group_id: string, name: string}[]>([]);
  
  // New brand state
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New category state
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // New area state
  const [showNewAreaInput, setShowNewAreaInput] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  
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
    category: '', // Add category to form
    sku: '',
    image_url: '',
    consumer_price: 0,
    base_distributor_price: 0,
    base_moq: 1,
    is_active: true,
    has_variants: false // Add variants flag
  });
  
  // Variant states
  const [productVariants, setProductVariants] = useState<{variant_name: string, additional_price: number}[]>([]);
  const [newVariant, setNewVariant] = useState({
    variant_name: '',
    additional_price: 0
  });
  
  // Variant pricing per area states
  const [variantPricing, setVariantPricing] = useState<VariantPricing[]>([]);
  const [showVariantPricing, setShowVariantPricing] = useState(false);
  
  // Region form states
  const [showRegions, setShowRegions] = useState(false);
  const [regions, setRegions] = useState<Region[]>([]);
  const [newRegion, setNewRegion] = useState({
    area: 'Jabodetabek',
    distributor_price: 0,
    moq: 1
  });
  
  // Areas allowed for distribution (now as state to allow adding new ones)
  const [availableAreas, setAvailableAreas] = useState(["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"]);
  
  // Fetch all SKUs
  useEffect(() => {
    fetchSKUs();
    loadBrands(); // Load brands on component mount
    loadCategories(); // Load categories on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load categories from database
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set some default categories if the table doesn't exist yet
      setCategories([
        { id: 'snack', name: 'Snack' },
        { id: 'beverage', name: 'Beverage' },
        { id: 'food', name: 'Food' },
      ]);
    }
  };
  
  // Load brands from database
  const loadBrands = async () => {
    try {
      const brandData = await fetchAllBrands();
      setBrands(brandData);
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: 'destructive',
      });
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

    try {
      // Use our helper function to create the brand
      const newBrandResult = await createNewBrand(newBrandName.trim());
      
      if (!newBrandResult) {
        toast({
          title: "Error",
          description: "Failed to create brand",
          variant: 'destructive',
        });
        return;
      }
      
      // Add to our brands list
      setBrands(prev => [...prev, newBrandResult]);
      
      // Set the form to use this brand
      setForm({...form, brand: newBrandResult.id});
      
      // Reset inputs
      setNewBrandName('');
      setShowNewBrandInput(false);
      
      toast({
        title: "Success",
        description: `Brand "${newBrandResult.name}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating brand:', error);
      toast({
        title: "Error",
        description: "Failed to create brand",
        variant: 'destructive',
      });
    }
  };

  // Function to create a new category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: 'destructive',
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create categories",
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_categories')
        // @ts-expect-error - Temporary fix until database types are regenerated
        .insert([{ name: newCategoryName.trim() }])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // @ts-expect-error - Data typing issue with Supabase
        const newCategory = { id: data[0].id, name: data[0].name };
        
        // Add to our categories list
        setCategories(prev => [...prev, newCategory]);
        
        // Set the form to use this category
        setForm({...form, category: newCategory.id});
        
        // Reset inputs
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        
        toast({
          title: "Success",
          description: `Category "${newCategory.name}" created successfully`,
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: 'destructive',
      });
    }
  };

  // Function to create a new distribution area
  const handleCreateArea = async () => {
    if (!newAreaName.trim()) {
      toast({
        title: "Error",
        description: "Area name cannot be empty",
        variant: 'destructive',
      });
      return;
    }

    // Check if area already exists
    if (availableAreas.includes(newAreaName.trim())) {
      toast({
        title: "Error",
        description: "Area already exists",
        variant: 'destructive',
      });
      return;
    }

    try {
      const newArea = newAreaName.trim();
      
      // Add to available areas
      setAvailableAreas(prev => [...prev, newArea]);
      
      // Set the form to use this area
      setNewRegion({...newRegion, area: newArea});
      
      // Auto-generate pricing for this new area with existing variants
      if (productVariants.length > 0) {
        const newPricingEntries: VariantPricing[] = productVariants.map(variant => ({
          variant_name: variant.variant_name,
          area: newArea,
          distributor_price: form.base_distributor_price + variant.additional_price,
          moq: form.base_moq
        }));
        setVariantPricing(prev => [...prev, ...newPricingEntries]);
      }
      
      // Reset inputs
      setNewAreaName('');
      setShowNewAreaInput(false);
      
      toast({
        title: "Success",
        description: `Area "${newArea}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating area:', error);
      toast({
        title: "Error",
        description: "Failed to create area",
        variant: 'destructive',
      });
    }
  };

  // Function to generate variant pricing matrix for all combinations
  const generateVariantPricing = () => {
    const newVariantPricing: VariantPricing[] = [];
    
    productVariants.forEach(variant => {
      availableAreas.forEach(area => {
        // Check if this combination already exists
        const exists = variantPricing.find(vp => 
          vp.variant_name === variant.variant_name && vp.area === area
        );
        
        if (!exists) {
          newVariantPricing.push({
            variant_name: variant.variant_name,
            area: area,
            distributor_price: form.base_distributor_price + variant.additional_price,
            moq: form.base_moq
          });
        }
      });
    });
    
    if (newVariantPricing.length > 0) {
      setVariantPricing(prev => [...prev, ...newVariantPricing]);
    }
  };

  // Function to update variant pricing
  const updateVariantPricing = (variant_name: string, area: string, field: 'distributor_price' | 'moq', value: number) => {
    setVariantPricing(prev => prev.map(vp => 
      vp.variant_name === variant_name && vp.area === area
        ? { ...vp, [field]: value }
        : vp
    ));
  };

  // Function to remove variant pricing entry
  const removeVariantPricing = (variant_name: string, area: string) => {
    setVariantPricing(prev => prev.filter(vp => 
      !(vp.variant_name === variant_name && vp.area === area)
    ));
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
  
  // Fetch variants for a specific SKU
  const fetchVariantsForSKU = async (skuId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('variant_name, additional_price')
        .eq('product_id', skuId)
        .eq('is_active', true);
        
      if (error) throw error;
      
      setProductVariants(data || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast({
        title: t.errorFetchingVariants,
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    }
  };
  
  // Fetch variant pricing for a specific SKU
  const fetchVariantPricingForSKU = async (skuId: string) => {
    try {
      // Fetch variants for this product
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('variant_name, additional_price')
        .eq('product_id', skuId)
        .eq('is_active', true);
        
      if (variantsError) throw variantsError;
      
      // Fetch regional pricing for this product
      const { data: regionPricingData, error: regionError } = await supabase
        .from('region_pricing')
        .select('area, distributor_price, moq')
        .eq('product_id', skuId);
        
      if (regionError) throw regionError;
      
      // Combine variant and pricing data
      const combinedPricing: VariantPricing[] = [];
      
      if (variantsData && regionPricingData) {
        variantsData.forEach((variant) => {
          regionPricingData.forEach((pricing) => {
            combinedPricing.push({
              // @ts-expect-error - Type casting for variant properties
              variant_name: variant.variant_name,
              // @ts-expect-error - Type casting for pricing properties
              area: pricing.area,
              // @ts-expect-error - Type casting for pricing calculation
              distributor_price: pricing.distributor_price + (variant.additional_price || 0),
              // @ts-expect-error - Type casting for moq property
              moq: pricing.moq
            });
          });
        });
      }
      
      setVariantPricing(combinedPricing);
    } catch (error) {
      console.error('Error fetching variant pricing:', error);
      // Don't show toast for this as it's not critical
    }
  };
  
  // Add or update a SKU
  const saveSKU = async () => {
    try {
      // Validate required fields
      if (!form.name || !form.sku || !form.consumer_price) {
        toast({
          title: "Error",
          description: "Please fill in all required fields (Name, SKU, Consumer Price)",
          variant: 'destructive',
        });
        return;
      }

      console.log('Save SKU called');
      console.log('Edit mode:', editMode);
      console.log('Current form data:', form);

      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save products",
          variant: 'destructive',
        });
        return;
      }

      console.log('User authentication state:', user);
      console.log('User role:', user.role);
      
      // Warn about role requirements for admin operations
      if (user.role !== 'admin') {
        console.warn('User does not have admin role - this may cause permission issues');
        console.warn('Current role:', user.role, 'Required role: admin');
      }
      
      // Get current Supabase session to ensure we're properly authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast({
          title: "Error", 
          description: "Authentication session invalid. Please log in again.",
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Supabase session user:', sessionData.session.user);
      console.log('Session user role:', sessionData.session.user.role);

      let result;
      
      if (editMode && currentSKU) {
        console.log('Update mode detected');
        console.log('Current SKU:', currentSKU);
        console.log('Current SKU ID:', currentSKU.id);
        
        // For updates, only update the fields that can be safely changed
        const updateData = {
          name: form.name,
          description: form.description || null,
          size: form.size || null,
          brand_id: form.brand || null,
          category_id: form.category || null,
          sku: form.sku,
          image_url: form.image_url || null,
          consumer_price: form.consumer_price,
          is_active: form.is_active,
          has_variants: form.has_variants,
          base_distributor_price: Math.round(form.consumer_price * 0.8), // Update distributor price based on consumer price
        };
        
        console.log('Update data being sent:', updateData);
        
        // Update existing SKU in the products table
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our data structure
          .update(updateData)
          .eq('id', currentSKU.id)
          .select();
          
        console.log('Update result:', result);
        console.log('Update result data:', result.data);
        console.log('Number of rows updated:', result.data?.length || 0);
      } else {
        // For new SKUs, include all required fields
        const insertData = {
          name: form.name,
          description: form.description || null,
          size: form.size || null,
          brand_id: form.brand || null,
          category_id: form.category || null,
          sku: form.sku,
          image_url: form.image_url || null,
          consumer_price: form.consumer_price,
          is_active: form.is_active,
          has_variants: form.has_variants,
          base_distributor_price: Math.round(form.consumer_price * 0.8),
          base_moq: 1,
          stock_quantity: 0,
          province_id: null,
          distribution_area_id: null,
          regional_group_id: null
          // Added nullable fields explicitly
        };
        
        console.log('Insert data being sent:', insertData);
        
        // Check current session
        const { data: sessionData } = await supabase.auth.getSession();
        console.log('Current session:', sessionData.session?.user?.id);
        console.log('Session role:', sessionData.session?.user?.role);
        
        // Insert new SKU into the products table
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our data structure
          .insert([insertData])
          .select();
      }
      
      if (result.error) {
        console.error('Supabase error details:', result.error);
        throw result.error;
      }

      // Check if any rows were affected (especially important for updates)
      if (editMode && (!result.data || result.data.length === 0)) {
        console.error('Update operation completed but no rows were affected');
        console.error('This is likely due to RLS policy restrictions');
        console.error('User role:', user.role, 'Session role:', sessionData.session.user.role);
        toast({
          title: "Permission Denied",
          description: `Update failed: Your account (role: ${user.role}) doesn't have permission to modify products. Please contact an administrator to grant admin privileges.`,
          variant: 'destructive',
        });
        return;
      }
      
      console.log('Save operation successful:', result.data);
      
      // Get the SKU ID for saving variants
      const skuId = editMode && currentSKU ? currentSKU.id : result.data?.[0]?.id;
      
      // Save variants if any are defined
      if (skuId && productVariants.length > 0) {
        try {
          // First delete existing variants
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', skuId);
            
          // Then insert new variants
          const variantsToInsert = productVariants.map(variant => ({
            product_id: skuId,
            variant_name: variant.variant_name,
            additional_price: variant.additional_price,
            is_active: true
          }));
          
          const { error: variantError } = await supabase
            .from('product_variants')
            // @ts-expect-error - Supabase types don't match our variant structure
            .insert(variantsToInsert);
            
          if (variantError) throw variantError;
        } catch (variantError) {
          console.error('Error saving variants:', variantError);
          // Don't fail the entire operation if variants fail
        }
      }
      
      // Save variant pricing if any are defined
      if (skuId && variantPricing.length > 0) {
        try {
          // First delete existing region pricing for this product
          await supabase
            .from('region_pricing')
            .delete()
            .eq('product_id', skuId);
            
          // Group variant pricing by area to create base regional pricing
          const areaGroups = variantPricing.reduce((acc, vp) => {
            if (!acc[vp.area]) {
              acc[vp.area] = [];
            }
            acc[vp.area].push(vp);
            return acc;
          }, {} as Record<string, VariantPricing[]>);
          
          // Insert region pricing for each area (using base product price)
          const regionPricingToInsert = Object.entries(areaGroups).map(([area, prices]) => {
            // Use the minimum price as base price for the area
            const basePrice = Math.min(...prices.map(p => p.distributor_price));
            const baseMoq = prices[0]?.moq || form.base_moq;
            
            return {
              product_id: skuId,
              area: area,
              distributor_price: basePrice,
              moq: baseMoq
            };
          });
          
          const { error: variantPricingError } = await supabase
            .from('region_pricing')
            // @ts-expect-error - Supabase types don't match our region pricing structure
            .insert(regionPricingToInsert);
            
          if (variantPricingError) throw variantPricingError;
        } catch (variantPricingError) {
          console.error('Error saving variant pricing:', variantPricingError);
          // Don't fail the entire operation if variant pricing fails
        }
      }
      
      // If regions are shown, save them too
      if (showRegions && regions.length > 0) {
        const skuId = editMode && currentSKU ? currentSKU.id : result.data?.[0]?.id;
        
        if (skuId) {
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
      console.error('Form data at time of error:', form);
      console.error('Current SKU at time of error:', currentSKU);
      console.error('Edit mode:', editMode);
      
      let errorMessage = 'Unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      } else {
        errorMessage = String(error);
      }
      
      toast({
        title: t.errorSaving,
        description: errorMessage,
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
      
      // Automatically generate variant pricing for this new area for all existing variants
      if (form.has_variants && productVariants.length > 0) {
        const newVariantPricing: VariantPricing[] = [];
        productVariants.forEach(variant => {
          // Check if pricing already exists for this variant-area combination
          const exists = variantPricing.find(vp => 
            vp.variant_name === variant.variant_name && vp.area === newRegion.area
          );
          
          if (!exists) {
            newVariantPricing.push({
              variant_name: variant.variant_name,
              area: newRegion.area,
              distributor_price: newRegion.distributor_price + variant.additional_price,
              moq: newRegion.moq
            });
          }
        });
        
        if (newVariantPricing.length > 0) {
          setVariantPricing(prev => [...prev, ...newVariantPricing]);
          // Auto-show variant pricing section when areas are added with variants
          setShowVariantPricing(true);
        }
      }
      
      setNewRegion({ area: 'Jabodetabek', distributor_price: 0, moq: 1 });
    }
  };
  
  // Handle removing a region
  const removeRegion = (index: number) => {
    setRegions(regions.filter((_, i) => i !== index));
  };
  
  // Handle adding a new variant
  const addVariant = () => {
    if (newVariant.variant_name.trim()) {
      const updatedVariants = [...productVariants, { ...newVariant }];
      setProductVariants(updatedVariants);
      
      // Automatically generate pricing for this new variant in all existing areas
      const newVariantPricing: VariantPricing[] = [];
      regions.forEach(region => {
        // Check if pricing already exists for this variant-area combination
        const exists = variantPricing.find(vp => 
          vp.variant_name === newVariant.variant_name && vp.area === region.area
        );
        
        if (!exists) {
          newVariantPricing.push({
            variant_name: newVariant.variant_name,
            area: region.area,
            distributor_price: region.distributor_price + newVariant.additional_price,
            moq: region.moq
          });
        }
      });
      
      if (newVariantPricing.length > 0) {
        setVariantPricing(prev => [...prev, ...newVariantPricing]);
        // Auto-show variant pricing section when variants are added
        setShowVariantPricing(true);
      }
      
      setNewVariant({ variant_name: '', additional_price: 0 });
    }
  };
  
  // Handle removing a variant
  const removeVariant = (index: number) => {
    setProductVariants(productVariants.filter((_, i) => i !== index));
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
      category: '',
      sku: '',
      image_url: '',
      consumer_price: 0,
      base_distributor_price: 0,
      base_moq: 1,
      is_active: true,
      has_variants: false
    });
    setProductVariants([]);
    setVariantPricing([]);
    setRegions([]);
    setShowRegions(false);
    setShowVariantPricing(false);
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
      category: sku.category_id || '', // Add category
      sku: sku.sku,
      image_url: sku.image_url || '',
      consumer_price: sku.consumer_price,
      base_distributor_price: sku.base_distributor_price || Math.round(sku.consumer_price * 0.8),
      base_moq: sku.base_moq || 1,
      is_active: sku.is_active,
      has_variants: Boolean(sku.has_variants) || false // Add variants flag
    });
    
    // Fetch regions for this SKU
    await fetchRegionsForSKU(sku.id);
    
    // Fetch variants for this SKU
    await fetchVariantsForSKU(sku.id);
    
    // Fetch variant pricing for this SKU
    await fetchVariantPricingForSKU(sku.id);
    
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
              <TableHead>{t.category}</TableHead>
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
                <TableCell colSpan={8} className="text-center py-8">
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                  <p className="text-muted-foreground mt-2">{t.loading}</p>
                </TableCell>
              </TableRow>
            ) : filteredSKUs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">{t.noSkusFound}</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSKUs.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-medium">{sku.name}</TableCell>
                  <TableCell>{sku.displayBrand || getBrandNameFromCache(sku.brand_id || '')}</TableCell>
                  <TableCell>{categories.find(c => c.id === sku.category_id)?.name || sku.category_id}</TableCell>
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
                <Label htmlFor="category">{t.category}</Label>
                {!showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        name="category"
                        value={form.category}
                        onValueChange={(value) => setForm({...form, category: value})}
                        required
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setShowNewCategoryInput(true)}
                      title="Add new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter new category name"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      variant="default" 
                      size="sm" 
                      onClick={handleCreateCategory}
                      disabled={!newCategoryName.trim()}
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
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
                      disabled={!newBrandName.trim()}
                    >
                      Add
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
            
            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="has_variants"
                name="has_variants"
                checked={form.has_variants}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="has_variants">{t.hasVariants || 'Has Variants'}</Label>
            </div>
            
            {/* Step 1: Distribution Areas */}
            <div className="pt-4 border-t">
              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Step 1: Distribution Areas</h3>
                <p className="text-sm text-muted-foreground">First, configure the areas where this product will be distributed.</p>
              </div>
              
              <button 
                type="button"
                onClick={() => setShowRegions(!showRegions)}
                className="flex items-center text-sm font-medium text-primary mb-4"
              >
                {showRegions ? t.hideRegionalPricing : t.showRegionalPricing}
              </button>
              
              {showRegions && (
                <div className="space-y-4">
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
                      {!showNewAreaInput ? (
                        <div className="flex gap-2">
                          <div className="flex-1">
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
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            onClick={() => setShowNewAreaInput(true)}
                            title="Add new area"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter new area name"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            className="flex-1"
                          />
                          <Button 
                            type="button" 
                            variant="default" 
                            size="sm" 
                            onClick={handleCreateArea}
                            disabled={!newAreaName.trim()}
                          >
                            Add
                          </Button>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                              setShowNewAreaInput(false);
                              setNewAreaName('');
                            }}
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="distributor_price">{t.distributorPrice}</Label>
                      <Input
                        id="distributor_price"
                        type="number"
                        value={newRegion.distributor_price}
                        onChange={(e) => setNewRegion({...newRegion, distributor_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="flex-none space-y-2" style={{width: '100px'}}>
                      <Label htmlFor="moq">{t.moq}</Label>
                      <Input
                        id="moq"
                        type="number"
                        value={newRegion.moq}
                        onChange={(e) => setNewRegion({...newRegion, moq: parseInt(e.target.value) || 1})}
                      />
                    </div>
                    
                    <div className="flex-none">
                      <Button type="button" onClick={addRegion}>
                        {t.addRegion}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step 2: Variant management section */}
            {form.has_variants && (
              <div className="pt-4 border-t space-y-4">
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Step 2: Product Variants</h3>
                  <p className="text-sm text-muted-foreground">Add product variants and their additional pricing. Pricing for each area will be automatically calculated.</p>
                </div>
                
                {/* Existing variants */}
                {productVariants.length > 0 && (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.variantName || 'Variant Name'}</TableHead>
                          <TableHead>{t.additionalPrice || 'Additional Price'}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productVariants.map((variant, index) => (
                          <TableRow key={index}>
                            <TableCell>{variant.variant_name}</TableCell>
                            <TableCell>
                              {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              }).format(variant.additional_price)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeVariant(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                
                {/* Add new variant form */}
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="variant_name">{t.variantName || 'Variant Name'}</Label>
                    <Input
                      id="variant_name"
                      value={newVariant.variant_name}
                      onChange={(e) => setNewVariant({...newVariant, variant_name: e.target.value})}
                      placeholder="e.g., Original, Spicy, Large"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="additional_price">{t.additionalPrice || 'Additional Price'}</Label>
                    <Input
                      id="additional_price"
                      type="number"
                      value={newVariant.additional_price}
                      onChange={(e) => setNewVariant({
                        ...newVariant, 
                        additional_price: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Button type="button" onClick={addVariant}>
                      {t.addVariant || 'Add Variant'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Step 3: Automatic Variant Pricing per Area */}
            {form.has_variants && productVariants.length > 0 && regions.length > 0 && (
              <div className="pt-4 border-t">
                <div className="mb-4">
                  <h3 className="font-medium text-lg mb-2">Step 3: Variant Pricing per Area</h3>
                  <p className="text-sm text-muted-foreground">Pricing is automatically generated when you add variants and areas. You can edit the prices below.</p>
                </div>
                
                <div className="space-y-4">
                  {variantPricing.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border rounded-md">
                      <p>Variant pricing will be generated automatically when you add variants.</p>
                      <p className="text-sm">Make sure you have both areas and variants configured above.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {productVariants.map(variant => {
                        const variantPricings = variantPricing.filter(vp => vp.variant_name === variant.variant_name);
                        
                        return (
                          <div key={variant.variant_name} className="border rounded-md p-4">
                            <h4 className="font-medium mb-3 text-primary">
                              {variant.variant_name} (Base + {new Intl.NumberFormat('id-ID', {
                                style: 'currency',
                                currency: 'IDR',
                                minimumFractionDigits: 0,
                              }).format(variant.additional_price)})
                            </h4>
                            
                            <div className="border rounded-md overflow-hidden">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Distributor Price</TableHead>
                                    <TableHead>MOQ</TableHead>
                                    <TableHead className="w-20"></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {variantPricings.length === 0 ? (
                                    <TableRow>
                                      <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        No pricing configured for this variant
                                      </TableCell>
                                    </TableRow>
                                  ) : (
                                    variantPricings.map((vp, index) => (
                                      <TableRow key={`${vp.variant_name}-${vp.area}`}>
                                        <TableCell className="font-medium">{vp.area}</TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={vp.distributor_price}
                                            onChange={(e) => updateVariantPricing(
                                              vp.variant_name, 
                                              vp.area, 
                                              'distributor_price', 
                                              parseFloat(e.target.value) || 0
                                            )}
                                            className="w-32"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            value={vp.moq}
                                            onChange={(e) => updateVariantPricing(
                                              vp.variant_name, 
                                              vp.area, 
                                              'moq', 
                                              parseInt(e.target.value) || 1
                                            )}
                                            className="w-20"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeVariantPricing(vp.variant_name, vp.area)}
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
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
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
            <p id="delete-confirmation-text" className="text-sm text-muted-foreground">
              {t.deleteConfirmationText} <strong>{currentSKU?.name} {currentSKU?.size}</strong>?
              {t.thisActionCannot}
            </p>
          </DialogHeader>
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
  category: 'Kategori',
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
  hasVariants: 'Memiliki Varian',
  productVariants: 'Varian Produk',
  variantName: 'Nama Varian',
  additionalPrice: 'Harga Tambahan',
  addVariant: 'Tambah Varian',
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
  errorFetchingVariants: 'Gagal memuat data varian',
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
  category: 'Category',
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
  hasVariants: 'Has Variants',
  productVariants: 'Product Variants',
  variantName: 'Variant Name',
  additionalPrice: 'Additional Price',
  addVariant: 'Add Variant',
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
  errorFetchingVariants: 'Failed to fetch variant data',
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
