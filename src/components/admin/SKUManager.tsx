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

// UOM (Unit of Measure) interfaces
interface UOMConversion {
  from_uom: string;
  to_uom: string;
  conversion_factor: number;
}

interface UOMPricing {
  uom: string;
  area: string;
  distributor_price: number;
  moq: number;
  moq_uom: string;
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Trash2, Edit, Plus, X, Search, Loader2, RefreshCw, Info } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { PostgrestError } from '@supabase/supabase-js';
import { fetchAllBrands, getBrandNameFromCache, Brand, createNewBrand } from '@/data/brands';
import { Database } from '@/integrations/supabase/types';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';

// Translation objects
const id = {
  skuManagement: 'Manajemen SKU',
  addNewSku: 'Tambah SKU Baru',
  editSku: 'Edit SKU',
  searchSkus: 'Cari SKU berdasarkan nama, merek, atau kode SKU...',
  clear: 'Hapus',
  name: 'Nama',
  brand: 'Merek',
  category: 'Kategori',
  size: 'Ukuran',
  sku: 'SKU',
  consumerPrice: 'Harga Pelanggan',
  status: 'Status',
  actions: 'Tindakan',
  loading: 'Memuat SKU...',
  noSkusFound: 'Tidak ada SKU ditemukan.',
  active: 'Aktif',
  inactive: 'Tidak Aktif',
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
  duplicateSku: 'SKU Duplikat',
  duplicateSkuDesc: 'SKU sudah ada dalam database. Silakan gunakan kode SKU yang berbeda.',
  generateSku: 'Hasilkan kode SKU unik',
  generate: 'Hasilkan',
  singleSkuMoq: 'MOQ Total SKU',
  allowMixVariants: 'Izinkan Campuran Varian',
  allowMixVariantsDesc: 'Pelanggan dapat mencampur berbagai varian untuk mencapai kuantitas pesanan minimum',
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
  consumerPrice: 'Customer Price',
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
  duplicateSku: 'Duplicate SKU',
  duplicateSkuDesc: 'SKU already exists in the database. Please use a different SKU code.',
  generateSku: 'Generate a unique SKU code',
  generate: 'Generate',
  singleSkuMoq: 'SKU Combined MOQ',
  singleSkuMoqDesc: 'Allow mixing different variants to reach MOQ (combined quantity across all variants)',
  allowMixVariants: 'Allow Mix Variants',
  allowMixVariantsDesc: 'Customers can mix different variants to reach the minimum order quantity',
};

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
  // Mixed variant fields
  single_sku_moq?: number;
  allow_mix_variants?: boolean;
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
    single_sku_moq: 0, // SKU-level MOQ (regardless of variant)
    allow_mix_variants: false, // Allow mixing variants to reach MOQ
    is_active: true,
    has_variants: false, // Add variants flag
    // UOM fields
    base_uom: 'pcs', // Base unit of measure
    moq_uom: 'pcs', // MOQ unit of measure
    pricing_uom: 'pcs', // Pricing unit of measure
    enable_uom_conversions: false // Whether to enable UOM conversions
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
  
  // UOM (Unit of Measure) states
  const [availableUOMs, setAvailableUOMs] = useState([
    "pcs", "box", "carton", "pack", "kg", "gram", "liter", "ml", "meter", "cm"
  ]);
  const [showNewUOMInput, setShowNewUOMInput] = useState(false);
  const [newUOMName, setNewUOMName] = useState('');
  const [uomConversions, setUomConversions] = useState<UOMConversion[]>([]);
  const [uomPricing, setUomPricing] = useState<UOMPricing[]>([]);
  const [showUOMSettings, setShowUOMSettings] = useState(false);
  
  // New conversion form state
  const [newConversion, setNewConversion] = useState({
    from_uom: '',
    to_uom: '',
    conversion_factor: 0
  });
  
  // Fetch all SKUs
  useEffect(() => {
    // Load brands first, then fetch SKUs
    const initializeData = async () => {
      await loadBrands(); // Load brands first to populate cache
      await loadCategories(); // Load categories 
      await fetchSKUs(); // Then fetch SKUs with brand cache populated
    };
    
    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Load categories from database
  const loadCategories = async (): Promise<void> => {
    try {

      const { data, error } = await supabase
        .from('product_categories')
        .select('id, name')
        .order('name', { ascending: true });
        
      if (error) {
        console.error('Error loading categories:', error);
        console.error('Category error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If table doesn't exist, create some fallback categories
        if (error.message?.includes('does not exist') || error.message?.includes('not found')) {
          // Categories table does not exist, using fallback categories
        }
        
        throw error;
      }
      

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      // Set some default categories if the table doesn't exist yet
      // Setting fallback categories due to error
      setCategories([
        { id: 'snack', name: 'Snack' },
        { id: 'beverage', name: 'Beverage' },
        { id: 'food', name: 'Food' },
        { id: 'minuman', name: 'Minuman' },
        { id: 'rokok', name: 'Rokok' },
        { id: 'cokelat', name: 'Cokelat dan Permen' },
        { id: 'bakery', name: 'Bakery' },
      ]);
    }
  };
  
  // Load brands from database
  const loadBrands = async (): Promise<void> => {
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

      if (error) {
        console.error('Insert error details:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // If it's a permissions error, provide more specific guidance
        if (error.message?.includes('permission denied') || error.message?.includes('policy')) {
          throw new Error('Permission denied. Please check if you have admin privileges or if the table policies allow this operation.');
        }
        
        // If it's a table not found error, provide guidance
        if (error.message?.includes('does not exist') || error.message?.includes('not found')) {
          throw new Error('Categories table does not exist. Please ensure database migrations have been applied.');
        }
        
        throw error;
      }

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
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: "Error",
        description: `Failed to create category: ${errorMessage}`,
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
          moq: form.base_moq // Default to base MOQ for individual variants
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
            moq: form.base_moq // Default to base MOQ for individual variants
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
    // Normal update for a single variant/area combo - we no longer force single_sku_moq for individual variants
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

  // UOM (Unit of Measure) Management Functions
  
  // Function to add a new UOM
  const handleCreateUOM = async () => {
    if (!newUOMName.trim()) return;
    
    try {
      const newUOM = newUOMName.trim();
      
      // Add to available UOMs
      setAvailableUOMs(prev => [...prev, newUOM]);
      
      // Reset inputs
      setNewUOMName('');
      setShowNewUOMInput(false);
      
      toast({
        title: "Success",
        description: `UOM "${newUOM}" created successfully`,
      });
    } catch (error) {
      console.error('Error creating UOM:', error);
      toast({
        title: "Error",
        description: "Failed to create UOM",
        variant: 'destructive',
      });
    }
  };

  // Function to add UOM conversion
  const addUomConversion = (fromUom: string, toUom: string, conversionFactor: number) => {
    if (fromUom === toUom) {
      toast({
        title: "Error",
        description: "Cannot convert from the same UOM to itself",
        variant: 'destructive',
      });
      return;
    }

    const newConversion: UOMConversion = {
      from_uom: fromUom,
      to_uom: toUom,
      conversion_factor: conversionFactor
    };

    // Check if conversion already exists
    const exists = uomConversions.find(conv => 
      conv.from_uom === fromUom && conv.to_uom === toUom
    );

    if (exists) {
      // Update existing conversion
      setUomConversions(prev => prev.map(conv => 
        conv.from_uom === fromUom && conv.to_uom === toUom
          ? { ...conv, conversion_factor: conversionFactor }
          : conv
      ));
    } else {
      // Add new conversion
      setUomConversions(prev => [...prev, newConversion]);
    }

    toast({
      title: "Success",
      description: `UOM conversion ${fromUom} → ${toUom} added`,
    });
  };

  // Function to remove UOM conversion
  const removeUomConversion = (fromUom: string, toUom: string) => {
    setUomConversions(prev => prev.filter(conv => 
      !(conv.from_uom === fromUom && conv.to_uom === toUom)
    ));
  };

  // Function to calculate converted quantity
  const convertQuantity = (quantity: number, fromUom: string, toUom: string): number => {
    if (fromUom === toUom) return quantity;

    const conversion = uomConversions.find(conv => 
      conv.from_uom === fromUom && conv.to_uom === toUom
    );

    if (conversion) {
      return quantity * conversion.conversion_factor;
    }

    // Check for reverse conversion
    const reverseConversion = uomConversions.find(conv => 
      conv.from_uom === toUom && conv.to_uom === fromUom
    );

    if (reverseConversion) {
      return quantity / reverseConversion.conversion_factor;
    }

    return quantity; // No conversion found, return original
  };

  // Function to add UOM-based pricing
  const addUomPricing = (uom: string, area: string, distributorPrice: number, moq: number, moqUom: string) => {
    const newUomPricing: UOMPricing = {
      uom,
      area,
      distributor_price: distributorPrice,
      moq,
      moq_uom: moqUom
    };

    // Check if pricing already exists for this UOM and area
    const exists = uomPricing.find(pricing => 
      pricing.uom === uom && pricing.area === area
    );

    if (exists) {
      // Update existing pricing
      setUomPricing(prev => prev.map(pricing => 
        pricing.uom === uom && pricing.area === area
          ? newUomPricing
          : pricing
      ));
    } else {
      // Add new pricing
      setUomPricing(prev => [...prev, newUomPricing]);
    }
  };

  // Function to remove UOM pricing
  const removeUomPricing = (uom: string, area: string) => {
    setUomPricing(prev => prev.filter(pricing => 
      !(pricing.uom === uom && pricing.area === area)
    ));
  };

  // Function to get UOMs relevant to the current SKU
  const getRelevantUOMs = (): string[] => {
    const relevantUOMs = new Set<string>();
    
    // Always include the configured UOMs for this SKU
    relevantUOMs.add(form.base_uom);
    relevantUOMs.add(form.moq_uom);
    relevantUOMs.add(form.pricing_uom);
    
    // Include UOMs that have conversions from/to the base UOM
    uomConversions.forEach(conversion => {
      if (conversion.from_uom === form.base_uom) {
        relevantUOMs.add(conversion.to_uom);
      }
      if (conversion.to_uom === form.base_uom) {
        relevantUOMs.add(conversion.from_uom);
      }
    });
    
    return Array.from(relevantUOMs);
  };

  // Function to generate UOM pricing matrix for SKU-relevant UOMs only
  const generateUomPricingMatrix = () => {
    if (!form.enable_uom_conversions) return;

    const relevantUOMs = getRelevantUOMs();
    const newUomPricing: UOMPricing[] = [];
    
    // Only generate pricing for relevant UOMs
    relevantUOMs.forEach(uom => {
      availableAreas.forEach(area => {
        // Skip if pricing already exists
        const exists = uomPricing.find(pricing => 
          pricing.uom === uom && pricing.area === area
        );
        
        if (!exists) {
          // Calculate converted price and MOQ based on base UOM
          const convertedPrice = convertQuantity(form.base_distributor_price, form.base_uom, uom);
          const convertedMoq = Math.ceil(convertQuantity(form.base_moq, form.moq_uom, uom));
          
          newUomPricing.push({
            uom,
            area,
            distributor_price: convertedPrice,
            moq: convertedMoq,
            moq_uom: uom
          });
        }
      });
    });
    
    if (newUomPricing.length > 0) {
      setUomPricing(prev => [...prev, ...newUomPricing]);
      
      toast({
        title: "Success",
        description: `Generated pricing for ${relevantUOMs.join(', ')} UOMs across ${availableAreas.length} areas`,
      });
    } else {
      toast({
        title: "Info",
        description: "All relevant UOM pricing combinations already exist",
      });
    }
  };

  const fetchSKUs = async (): Promise<void> => {
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
          // Specifically check for mix variant fields in the retrieved data
          const hasMixVariantFields = data.some(product => {
            // Cast to SKU type to ensure TypeScript recognizes the fields
            const skuProduct = product as SKU;
            return skuProduct.single_sku_moq !== undefined || 
                   skuProduct.allow_mix_variants !== undefined;
          });
          
          // Check a few records for mix variant fields
          
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
      // Use mock SKU data
      const { mockSKUs } = await import('@/data/mockData');
      setSkus(mockSKUs);
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
  
  // Fetch UOM conversions for a specific SKU
  const fetchUOMConversionsForSKU = async (skuId: string) => {
    try {
      const { data: conversionsData, error: conversionsError } = await supabase
        .from('uom_conversions')
        .select('from_uom, to_uom, conversion_factor')
        .eq('product_id', skuId)
        .eq('is_active', true);
        
      if (conversionsError) throw conversionsError;
      
      setUomConversions(conversionsData || []);
    } catch (error) {
      console.error('Error fetching UOM conversions:', error);
      // Don't fail if UOM conversions can't be loaded
      setUomConversions([]);
    }
  };
  
  // Fetch UOM pricing for a specific SKU
  const fetchUOMPricingForSKU = async (skuId: string) => {
    try {
      const { data: uomPricingData, error: uomPricingError } = await supabase
        .from('uom_pricing')
        .select('uom, area, distributor_price, moq, moq_uom')
        .eq('product_id', skuId)
        .eq('is_active', true);
        
      if (uomPricingError) throw uomPricingError;
      
      setUomPricing(uomPricingData || []);
    } catch (error) {
      console.error('Error fetching UOM pricing:', error);
      // Don't fail if UOM pricing can't be loaded
      setUomPricing([]);
    }
  };
  
  // Check if a SKU already exists in the database
  const checkIfSkuExists = async (skuCode: string, currentProductId?: string): Promise<boolean> => {
    try {
      const query = supabase
        .from('products')
        .select('id, sku')
        .eq('sku', skuCode);
        
      // If we're in edit mode and have a current product ID, exclude it from the check
      if (currentProductId) {
        query.neq('id', currentProductId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking SKU existence:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Exception checking SKU existence:', error);
      return false;
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

      // Check for duplicate SKU before saving
      const currentProductId = editMode && currentSKU ? currentSKU.id : undefined;
      const skuExists = await checkIfSkuExists(form.sku, currentProductId);
      
      if (skuExists) {
        toast({
          title: t.duplicateSku,
          description: `${form.sku}: ${t.duplicateSkuDesc}`,
          variant: 'destructive',
        });
        return;
      }

      
      
      
      

      // Check if user is authenticated
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to save products",
          variant: 'destructive',
        });
        return;
      }

      
      
      
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
      
      
      

      let result;
      
      if (editMode && currentSKU) {
        
        
        
        
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
          single_sku_moq: form.single_sku_moq, // SKU-level MOQ
          allow_mix_variants: form.allow_mix_variants, // Allow mixing variants to reach MOQ
          // UOM fields
          base_uom: form.base_uom,
          moq_uom: form.moq_uom,
          pricing_uom: form.pricing_uom,
          enable_uom_conversions: form.enable_uom_conversions,
        };
        
        
        
        // Log the exact update data being sent to Supabase
        
        
        // Update existing SKU in the products table
        result = await supabase
          .from('products')
          // @ts-expect-error - Supabase types don't match our data structure
          .update(updateData)
          .eq('id', currentSKU.id)
          .select();
          
        
        
        
        
        // Response received successfully
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
          single_sku_moq: form.single_sku_moq, // SKU-level MOQ
          allow_mix_variants: form.allow_mix_variants, // Allow mixing variants to reach MOQ
          stock_quantity: 0,
          province_id: null,
          distribution_area_id: null,
          regional_group_id: null,
          // UOM fields
          base_uom: form.base_uom,
          moq_uom: form.moq_uom,
          pricing_uom: form.pricing_uom,
          enable_uom_conversions: form.enable_uom_conversions,
          // Added nullable fields explicitly
        };
        
        
        
        // Check current session
        const { data: sessionData } = await supabase.auth.getSession();
        
        
        
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
            
            // Store the minimum MOQ for this area
            // For SKUs with mixed variants, this will be used as a guide
            // but the actual MOQ check will combine quantities across variants
            const baseMoq = prices[0]?.moq || form.base_moq;
            
            return {
              product_id: skuId,
              area: area,
              distributor_price: basePrice,
              moq: baseMoq,
              moq_uom: form.moq_uom, // Store the MOQ UOM with the region pricing
              sku_level_moq: form.single_sku_moq, // Store the SKU-level MOQ
              allow_mix_variants: form.allow_mix_variants // Store whether variants can be mixed
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
      
      // Save UOM conversions if UOM is enabled and conversions exist
      if (form.enable_uom_conversions && uomConversions.length > 0) {
        const skuId = editMode && currentSKU ? currentSKU.id : result.data?.[0]?.id;
        
        if (skuId) {
          try {
            // First delete existing UOM conversions for this product
            await supabase
              .from('uom_conversions')
              .delete()
              .eq('product_id', skuId);
            
            // Then insert the new UOM conversions
            const conversionsToInsert = uomConversions.map(conversion => ({
              product_id: skuId,
              from_uom: conversion.from_uom,
              to_uom: conversion.to_uom,
              conversion_factor: conversion.conversion_factor,
              is_active: true
            }));
            
            const { error: conversionError } = await supabase
              .from('uom_conversions')
              // @ts-expect-error - Supabase types don't include UOM tables yet
              .insert(conversionsToInsert);
              
            if (conversionError) throw conversionError;
            
            
          } catch (conversionError) {
            console.error('Error saving UOM conversions:', conversionError);
            // Don't fail the entire operation if UOM conversions fail
          }
        }
      }
      
      // Save UOM-specific pricing if UOM is enabled and pricing exists
      if (form.enable_uom_conversions && uomPricing.length > 0) {
        const skuId = editMode && currentSKU ? currentSKU.id : result.data?.[0]?.id;
        
        if (skuId) {
          try {
            // First delete existing UOM pricing for this product
            await supabase
              .from('uom_pricing')
              .delete()
              .eq('product_id', skuId);
            
            // Then insert the new UOM pricing
            const uomPricingToInsert = uomPricing.map(pricing => ({
              product_id: skuId,
              uom: pricing.uom,
              area: pricing.area,
              distributor_price: pricing.distributor_price,
              moq: pricing.moq,
              moq_uom: pricing.moq_uom,
              is_active: true
            }));
            
            const { error: uomPricingError } = await supabase
              .from('uom_pricing')
              // @ts-expect-error - Supabase types don't include UOM tables yet
              .insert(uomPricingToInsert);
              
            if (uomPricingError) throw uomPricingError;
            
            
          } catch (uomPricingError) {
            console.error('Error saving UOM pricing:', uomPricingError);
            // Don't fail the entire operation if UOM pricing fails
          }
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
      
      // Handle specific error cases
      const pgError = error as PostgrestError;
      
      // Check if this is a duplicate key error for SKU
      if (pgError?.code === '23505' && pgError?.details?.includes('products_sku_key')) {
        toast({
          title: t.duplicateSku,
          description: `${form.sku}: ${t.duplicateSkuDesc}`,
          variant: "destructive"
        });
        return;
      }
      
      // General error handling
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

  // Delete a SKU with comprehensive error handling and debugging
  const deleteSKU = async () => {
    if (!currentSKU) {
      console.error('SKU deletion failed: No SKU selected');
      return;
    }
    
    // Clear any existing toasts that might be showing misleading messages
    const existingToasts = document.querySelectorAll('[data-sonner-toast]');
    existingToasts.forEach(toast => toast.remove());
    
    // Prevent any concurrent operations that might interfere
    console.log('=== PREVENTING CONCURRENT OPERATIONS ===');
    
    // Clear any pending upload operations that might be running
    interface UploadOperation {
      cancel?: () => void;
      abort?: () => void;
    }
    const windowWithFlags = window as Window & { __pendingUploads?: UploadOperation[]; __skuDeletionInProgress?: boolean };
    const pendingUploads = windowWithFlags.__pendingUploads || [];
    if (pendingUploads.length > 0) {
      console.warn('Found pending upload operations, clearing them:', pendingUploads.length);
      pendingUploads.forEach((upload: UploadOperation) => {
        try {
          if (upload.cancel) upload.cancel();
          if (upload.abort) upload.abort();
        } catch (e) {
          console.warn('Could not cancel pending upload:', e);
        }
      });
      windowWithFlags.__pendingUploads = [];
    }
    
    // Prevent new upload operations during deletion
    windowWithFlags.__skuDeletionInProgress = true;
    
    try {
      console.log('=== SKU DELETION PROCESS STARTED ===');
      console.log('SKU Details:', {
        id: currentSKU.id,
        name: currentSKU.name,
        sku: currentSKU.sku || 'N/A'
      });
      
      // Delete all related data in the correct order (foreign key dependencies)
      
      // 1. Delete UOM pricing for this SKU
      console.log('Step 1: Deleting UOM pricing records...');
      const { error: uomPricingError, count: uomPricingCount } = await supabase
        .from('uom_pricing')
        .delete()
        .eq('product_id', currentSKU.id);
      
      if (uomPricingError) {
        console.error('UOM pricing deletion failed:', uomPricingError);
        // Only fail if it's a critical error, not a "not found" error
        if (uomPricingError.code !== 'PGRST116') { // PGRST116 is "not found"
          throw new Error(`UOM pricing deletion failed: ${uomPricingError.message}`);
        }
      } else {
        console.log(`UOM pricing deleted successfully (${uomPricingCount || 0} records)`);
      }
      
      // 2. Delete UOM conversions for this SKU  
      console.log('Step 2: Deleting UOM conversion records...');
      const { error: uomConversionError, count: uomConversionCount } = await supabase
        .from('uom_conversions')
        .delete()
        .eq('product_id', currentSKU.id);
      
      if (uomConversionError) {
        console.error('UOM conversion deletion failed:', uomConversionError);
        if (uomConversionError.code !== 'PGRST116') {
          throw new Error(`UOM conversion deletion failed: ${uomConversionError.message}`);
        }
      } else {
        console.log(`UOM conversions deleted successfully (${uomConversionCount || 0} records)`);
      }
      
      // 3. Delete product variants for this SKU
      console.log('Step 3: Deleting product variant records...');
      const { error: variantError, count: variantCount } = await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', currentSKU.id);
      
      if (variantError) {
        console.error('Product variant deletion failed:', variantError);
        if (variantError.code !== 'PGRST116') {
          throw new Error(`Product variant deletion failed: ${variantError.message}`);
        }
      } else {
        console.log(`Product variants deleted successfully (${variantCount || 0} records)`);
      }
      
      // 4. Delete regional pricing for this SKU
      console.log('Step 4: Deleting regional pricing records...');
      const { error: regionError, count: regionCount } = await supabase
        .from('region_pricing')
        .delete()
        .eq('product_id', currentSKU.id);
      
      if (regionError) {
        console.error('Regional pricing deletion failed:', regionError);
        if (regionError.code !== 'PGRST116') {
          throw new Error(`Regional pricing deletion failed: ${regionError.message}`);
        }
      } else {
        console.log(`Regional pricing deleted successfully (${regionCount || 0} records)`);
      }
      
      // 5. Finally delete the SKU itself from the products table
      console.log('Step 5: Deleting main product record...');
      const { error: mainProductError, count: productCount } = await supabase
        .from('products')
        .delete()
        .eq('id', currentSKU.id);
      
      if (mainProductError) {
        console.error('Main product deletion failed:', mainProductError);
        throw new Error(`Main product deletion failed: ${mainProductError.message}`);
      }
      
      console.log(`Main product deleted successfully (${productCount || 0} records)`);
      console.log('=== SKU DELETION COMPLETED SUCCESSFULLY ===');
      
      // Show success message (NOT related to photo upload!)
      toast({
        title: lang === 'id' ? 'SKU Berhasil Dihapus' : 'SKU Deleted Successfully',
        description: lang === 'id' 
          ? `${currentSKU.name} telah berhasil dihapus dari sistem`
          : `${currentSKU.name} has been successfully removed from the system`,
        variant: "default",
      });
      
      // Refresh the SKU list and close dialog
      await fetchSKUs();
      setIsDeleteDialogOpen(false);
      setCurrentSKU(null);
      
    } catch (error) {
      console.error('=== SKU DELETION FAILED ===');
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      
      // Provide more specific and helpful error messages
      let errorTitle = lang === 'id' ? 'Gagal Menghapus SKU' : 'SKU Deletion Failed';
      let errorMessage = lang === 'id' ? 'Terjadi kesalahan saat menghapus SKU' : 'An error occurred while deleting the SKU';
      
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        
        // Handle specific database errors
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('foreign key') || errorMsg.includes('violates')) {
          errorTitle = lang === 'id' ? 'Tidak Dapat Menghapus SKU' : 'Cannot Delete SKU';
          errorMessage = lang === 'id' 
            ? 'SKU ini masih memiliki data terkait (order, transaksi). Hubungi administrator untuk bantuan.'
            : 'This SKU has related data (orders, transactions). Contact administrator for assistance.';
        } else if (errorMsg.includes('permission') || errorMsg.includes('denied') || errorMsg.includes('unauthorized')) {
          errorTitle = lang === 'id' ? 'Akses Ditolak' : 'Access Denied';
          errorMessage = lang === 'id'
            ? 'Anda tidak memiliki izin untuk menghapus SKU ini.'
            : 'You do not have permission to delete this SKU.';
        } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('connection')) {
          errorTitle = lang === 'id' ? 'Koneksi Bermasalah' : 'Connection Error';
          errorMessage = lang === 'id'
            ? 'Koneksi internet bermasalah. Periksa koneksi dan coba lagi.'
            : 'Network connection issue. Please check your connection and try again.';
        } else {
          // Show the actual error message for debugging
          errorMessage = `${errorMessage}: ${error.message}`;
        }
      } else if (typeof error === 'object' && error !== null) {
        interface ErrorObject {
          message?: string;
          code?: string;
        }
        const errorObj = error as ErrorObject;
        console.error('Non-Error object:', errorObj);
        if (errorObj.message) {
          errorMessage = `${errorMessage}: ${errorObj.message}`;
        } else if (errorObj.code) {
          errorMessage = `${errorMessage} (Code: ${errorObj.code})`;
        }
      }
      
      // Show error toast (definitely NOT a photo upload error!)
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      // Always clean up the operation flag to allow uploads to resume
      const windowWithFlags = window as Window & { __skuDeletionInProgress?: boolean };
      windowWithFlags.__skuDeletionInProgress = false;
      console.log('=== SKU DELETION PROCESS CLEANUP COMPLETE ===');
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
  
  // Generate a unique SKU code
  const generateUniqueSku = async () => {
    // Generate a prefix based on current date
    const today = new Date();
    const prefix = `BK${today.getFullYear().toString().substring(2)}${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Generate a random suffix with letters and numbers
    const generateRandomSuffix = () => {
      // Generate a random 4-character alphanumeric string
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed similar looking characters (I, O, 1, 0)
      let result = '';
      for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    
    // Try up to 10 times to generate a unique SKU
    for (let attempt = 0; attempt < 10; attempt++) {
      const suffix = generateRandomSuffix();
      const candidateSku = `${prefix}-${suffix}`;
      
      const exists = await checkIfSkuExists(candidateSku);
      if (!exists) {
        return candidateSku;
      }
    }
    
    // If we couldn't generate a unique SKU after 10 attempts, use timestamp as fallback
    return `${prefix}-${Date.now().toString().substring(7)}`;
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
      single_sku_moq: 0, // SKU-level MOQ (combined across variants)
      allow_mix_variants: false, // Allow mixing variants to reach MOQ
      is_active: true,
      has_variants: false,
      base_uom: 'pcs',
      moq_uom: 'pcs',
      pricing_uom: 'pcs',
      enable_uom_conversions: false
    });
    setProductVariants([]);
    setVariantPricing([]);
    setRegions([]);
    setUomConversions([]);
    setUomPricing([]);
    setShowRegions(false);
    setShowVariantPricing(false);
    setIsDialogOpen(true);
  };
  
  // Open dialog to edit an existing SKU
  const openEditDialog = async (sku: SKU) => {
    
    
    
    // Get the brand_id - this is what we need for the dropdown
    const brandId = sku.brand_id || '';
    
    
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
      has_variants: Boolean(sku.has_variants) || false, // Add variants flag
      // @ts-expect-error - UOM fields may not exist in existing SKUs
      base_uom: sku.base_uom || 'pcs', // Use actual data or default to pcs
      // @ts-expect-error - UOM fields may not exist in existing SKUs
      moq_uom: sku.moq_uom || 'pcs',
      // @ts-expect-error - UOM fields may not exist in existing SKUs
      pricing_uom: sku.pricing_uom || 'pcs',
      // @ts-expect-error - UOM fields may not exist in existing SKUs
      enable_uom_conversions: sku.enable_uom_conversions || false,
      // Mix variant fields
      single_sku_moq: sku.single_sku_moq || 0,
      allow_mix_variants: sku.allow_mix_variants || false
    });
    
    // Fetch regions for this SKU
    await fetchRegionsForSKU(sku.id);
    
    // Fetch variants for this SKU
    await fetchVariantsForSKU(sku.id);
    
    // Fetch variant pricing for this SKU
    await fetchVariantPricingForSKU(sku.id);
    
    // Fetch UOM conversions for this SKU
    await fetchUOMConversionsForSKU(sku.id);
    
    // Fetch UOM pricing for this SKU
    await fetchUOMPricingForSKU(sku.id);
    
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
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    const updatedForm = { ...form, [name]: checked };
    setForm(updatedForm);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editMode ? t.editSku : t.addNewSku}
            </DialogTitle>
            <DialogDescription>
              {editMode ? "Edit product details below" : "Fill in the product details below"}
            </DialogDescription>
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
                <div className="flex gap-2">
                  <Input
                    id="sku"
                    name="sku"
                    value={form.sku}
                    onChange={handleChange}
                    required
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={async () => {
                      const uniqueSku = await generateUniqueSku();
                      setForm(prev => ({ ...prev, sku: uniqueSku }));
                    }}
                    title={t.generateSku}
                  >
                    {t.generate}
                  </Button>
                </div>
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
                <Label htmlFor="consumer_price">{t.consumerPrice} (per {form.pricing_uom})</Label>
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
            
            {/* MOQ and Mix Variants Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="space-y-4">
                {/* SKU-level MOQ Field */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="single_sku_moq">{t.singleSkuMoq || 'SKU Combined MOQ'}</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Set the minimum order quantity for this SKU</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      id="single_sku_moq"
                      name="single_sku_moq"
                      type="number"
                      value={form.single_sku_moq}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        // Update the form
                        setForm(prev => ({ ...prev, single_sku_moq: value }));
                      }}
                      placeholder="0 = No minimum"
                    />
                    <div className="w-20">
                      <Select
                        value={form.moq_uom}
                        onValueChange={(value) => {
                          // Update form with new UOM
                          setForm(prev => ({ ...prev, moq_uom: value }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="UOM" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {form.single_sku_moq > 0 ? `Minimum ${form.single_sku_moq} ${form.moq_uom} order required` : 'No minimum order quantity'}
                  </div>
                </div>

                {/* Allow Mix Variants Checkbox */}
                <div className="flex items-center space-x-2 py-2">
                  <input
                    type="checkbox"
                    id="allow_mix_variants"
                    name="allow_mix_variants"
                    checked={form.allow_mix_variants}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <div className="space-y-1">
                    <Label htmlFor="allow_mix_variants">{t.allowMixVariants || 'Allow Mix Variants'}</Label>
                    <p className="text-sm text-muted-foreground">
                      {form.allow_mix_variants 
                        ? 'Different variants can be combined to reach minimum order quantity' 
                        : 'Each variant must meet its own minimum order quantity'}
                    </p>
                  </div>
                </div>
              </div>
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
                          <TableHead>{t.distributorPrice} ({form.pricing_uom})</TableHead>
                          <TableHead>{t.moq} ({form.moq_uom})</TableHead>
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
                      <Label htmlFor="distributor_price">{t.distributorPrice} ({form.pricing_uom})</Label>
                      <Input
                        id="distributor_price"
                        type="number"
                        value={newRegion.distributor_price}
                        onChange={(e) => setNewRegion({...newRegion, distributor_price: parseFloat(e.target.value) || 0})}
                      />
                    </div>
                    
                    <div className="flex-none space-y-2" style={{width: '100px'}}>
                      <Label htmlFor="moq">{t.moq} ({form.moq_uom})</Label>
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
                    <Label htmlFor="additional_price">{t.additionalPrice || 'Additional Price'} (per {form.pricing_uom})</Label>
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
                                    <TableHead>Distributor Price ({form.pricing_uom})</TableHead>
                                    <TableHead>
                                      MOQ ({form.moq_uom})
                                      {form.allow_mix_variants && form.single_sku_moq > 0 && (
                                        <span className="ml-2 text-xs text-muted-foreground">(Combined across variants)</span>
                                      )}
                                    </TableHead>
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
                                          <div className="flex items-center gap-2">
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
                                            <span className="text-xs text-muted-foreground">{form.moq_uom}</span>
                                            {form.allow_mix_variants && form.single_sku_moq > 0 && (
                                              <TooltipProvider>
                                                <Tooltip>
                                                  <TooltipTrigger asChild>
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                  </TooltipTrigger>
                                                  <TooltipContent>
                                                    <p>Variants can be mixed to reach combined MOQ of {form.single_sku_moq} {form.moq_uom}</p>
                                                  </TooltipContent>
                                                </Tooltip>
                                              </TooltipProvider>
                                            )}
                                          </div>
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
            
            {/* Step 4: UOM (Unit of Measure) Management */}
            <div className="pt-4 border-t space-y-4">
              <div className="mb-4">
                <h3 className="font-medium text-lg mb-2">Step 4: Unit of Measure (UOM) Settings</h3>
                <p className="text-sm text-muted-foreground">Configure different units of measure, conversion factors, and UOM-specific pricing.</p>
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700">
                    <strong>How it works:</strong> Set your base UOM (e.g., pieces), then define conversions (e.g., 1 box = 12 pcs). 
                    You can then set different prices and MOQs for each unit. All pricing above will display the selected UOM units.
                  </p>
                </div>
              </div>

              {/* Enable UOM Conversions Toggle */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable_uom_conversions"
                  checked={form.enable_uom_conversions}
                  onCheckedChange={(checked) => setForm({...form, enable_uom_conversions: !!checked})}
                />
                <Label htmlFor="enable_uom_conversions">Enable UOM Conversions & Per-UOM Pricing</Label>
              </div>

              {/* Base UOM Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_uom">Base UOM</Label>
                  <Select
                    value={form.base_uom}
                    onValueChange={(value) => setForm({...form, base_uom: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select base UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUOMs.map((uom) => (
                        <SelectItem key={uom} value={uom}>
                          {uom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moq_uom">MOQ UOM</Label>
                  <Select
                    value={form.moq_uom}
                    onValueChange={(value) => setForm({...form, moq_uom: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select MOQ UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUOMs.map((uom) => (
                        <SelectItem key={uom} value={uom}>
                          {uom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricing_uom">Pricing UOM</Label>
                  <Select
                    value={form.pricing_uom}
                    onValueChange={(value) => setForm({...form, pricing_uom: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select pricing UOM" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUOMs.map((uom) => (
                        <SelectItem key={uom} value={uom}>
                          {uom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Add New UOM */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Available UOMs:</Label>
                  <Badge variant="outline">
                    {availableUOMs.join(', ')}
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewUOMInput(!showNewUOMInput)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add UOM
                  </Button>
                </div>

                {showNewUOMInput && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="new_uom_name">New UOM Name</Label>
                      <Input
                        id="new_uom_name"
                        value={newUOMName}
                        onChange={(e) => setNewUOMName(e.target.value)}
                        placeholder="e.g., box, carton, kg, liter"
                      />
                    </div>
                    <Button type="button" onClick={handleCreateUOM}>
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewUOMInput(false);
                        setNewUOMName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* UOM Conversion Settings */}
              {form.enable_uom_conversions && (
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-3">UOM Conversion Factors</h4>
                    
                    {/* Existing conversions */}
                    {uomConversions.length > 0 && (
                      <div className="mb-4">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>From UOM</TableHead>
                              <TableHead>To UOM</TableHead>
                              <TableHead>Conversion Factor</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {uomConversions.map((conversion, index) => (
                              <TableRow key={index}>
                                <TableCell>{conversion.from_uom}</TableCell>
                                <TableCell>{conversion.to_uom}</TableCell>
                                <TableCell>{conversion.conversion_factor}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeUomConversion(conversion.from_uom, conversion.to_uom)}
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

                    {/* Add new conversion */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                      <div className="space-y-2">
                        <Label>From UOM</Label>
                        <Select
                          value={newConversion.from_uom}
                          onValueChange={(value) => setNewConversion({...newConversion, from_uom: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select UOM" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUOMs.map((uom) => (
                              <SelectItem key={uom} value={uom}>
                                {uom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>To UOM</Label>
                        <Select
                          value={newConversion.to_uom}
                          onValueChange={(value) => setNewConversion({...newConversion, to_uom: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select UOM" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUOMs.map((uom) => (
                              <SelectItem key={uom} value={uom}>
                                {uom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Conversion Factor</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={newConversion.conversion_factor}
                          onChange={(e) => setNewConversion({
                            ...newConversion,
                            conversion_factor: parseFloat(e.target.value) || 0
                          })}
                          placeholder="e.g., 12 (1 box = 12 pcs)"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={() => {
                          if (newConversion.from_uom && newConversion.to_uom && newConversion.conversion_factor > 0) {
                            addUomConversion(
                              newConversion.from_uom,
                              newConversion.to_uom,
                              newConversion.conversion_factor
                            );
                            setNewConversion({ from_uom: '', to_uom: '', conversion_factor: 0 });
                          }
                        }}
                      >
                        Add Conversion
                      </Button>
                    </div>
                  </div>

                  {/* UOM-specific Pricing */}
                  <div className="border rounded-md p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium">UOM-specific Pricing</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateUomPricingMatrix}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Generate SKU UOM Pricing
                      </Button>
                    </div>

                    {uomPricing.length > 0 ? (
                      <div className="space-y-4">
                        {/* Get unique UOMs from existing pricing and filter to only show those with pricing */}
                        {Array.from(new Set(uomPricing.map(pricing => pricing.uom))).map((uom) => {
                          const uomPricings = uomPricing.filter(pricing => pricing.uom === uom);
                          if (uomPricings.length === 0) return null;

                          return (
                            <div key={uom} className="border rounded-md p-3">
                              <h5 className="font-medium mb-2">Pricing for {uom}</h5>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Area</TableHead>
                                    <TableHead>Distributor Price</TableHead>
                                    <TableHead>MOQ</TableHead>
                                    <TableHead>MOQ UOM</TableHead>
                                    <TableHead></TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {uomPricings.map((pricing, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{pricing.area}</TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={pricing.distributor_price}
                                          onChange={(e) => {
                                            const newPrice = parseFloat(e.target.value) || 0;
                                            addUomPricing(pricing.uom, pricing.area, newPrice, pricing.moq, pricing.moq_uom);
                                          }}
                                          className="w-32"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Input
                                          type="number"
                                          value={pricing.moq}
                                          onChange={(e) => {
                                            const newMoq = parseInt(e.target.value) || 1;
                                            addUomPricing(pricing.uom, pricing.area, pricing.distributor_price, newMoq, pricing.moq_uom);
                                          }}
                                          className="w-20"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <Select
                                          value={pricing.moq_uom}
                                          onValueChange={(value) => {
                                            addUomPricing(pricing.uom, pricing.area, pricing.distributor_price, pricing.moq, value);
                                          }}
                                        >
                                          <SelectTrigger className="w-20">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {availableUOMs.map((uom) => (
                                              <SelectItem key={uom} value={uom}>
                                                {uom}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </TableCell>
                                      <TableCell>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => removeUomPricing(pricing.uom, pricing.area)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground border rounded-md">
                        <p>No UOM-specific pricing configured. Click "Generate SKU UOM Pricing" to auto-generate pricing for this SKU's relevant UOMs.</p>
                      </div>
                    )}
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

export default SKUManager;

