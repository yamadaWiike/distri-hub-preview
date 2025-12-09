// React & Router
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// External Libraries
import { Plus, Search, MoreVertical, Package, Eye, Edit, Trash2, X } from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Hooks
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";

// Integrations
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Product {
  id: string;
  name: string;
  brand?: string;
  brand_name?: string;
  category?: string;
  category_name?: string;
  sku: string;
  unit_per_package?: number;
  distributor_price?: number;
  base_distributor_price?: number;
  stock_quantity: number;
  moq?: number;
  base_moq?: number;
  stock_status?: 'available' | 'limited' | 'out_of_stock' | 'purchase_order';
  image_url?: string;
  allow_negative_stock?: boolean;
  created_at?: string;
  images?: string[];
}

export default function ProductManagement() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filter states
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [showNegativeStockOnly, setShowNegativeStockOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  // Image upload states
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    size: '',
    brand: '',
    category: '',
    sku: '',
    image_url: '',
    consumer_price: 0,
    unit_per_package: 1,
    distributor_price: 0,
    stock_quantity: 0,
    moq: 1,
    base_moq: 1,
    is_active: true,
    allow_negative_stock: true,
    has_variants: false,
    single_sku_moq: 0,
    allow_mix_variants: false,
    base_uom: 'pcs',
    moq_uom: 'pcs',
    pricing_uom: 'pcs',
    enable_uom_conversions: false,
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const { user } = useAuth();

  // Variant states
  const [productVariants, setProductVariants] = useState<{variant_name: string, additional_price: number}[]>([]);
  const [newVariant, setNewVariant] = useState({ variant_name: '', additional_price: 0 });
  const [variantPricing, setVariantPricing] = useState<{variant_name: string, area: string, distributor_price: number, moq: number}[]>([]);
  const [showVariantPricing, setShowVariantPricing] = useState(false);

  // Regional pricing states
  const [showRegions, setShowRegions] = useState(false);
  const [regions, setRegions] = useState<{id?: string, area: string, distributor_price: number, moq: number}[]>([]);
  const [newRegion, setNewRegion] = useState({ area: 'Jabodetabek', distributor_price: 0, moq: 1 });
  const [availableAreas, setAvailableAreas] = useState(["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur"]);
  const [showNewAreaInput, setShowNewAreaInput] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');

  // UOM states
  const [availableUOMs, setAvailableUOMs] = useState(["pcs", "box", "carton", "pack", "kg", "gram", "liter", "ml", "meter", "cm"]);
  const [showNewUOMInput, setShowNewUOMInput] = useState(false);
  const [newUOMName, setNewUOMName] = useState('');
  const [uomConversions, setUomConversions] = useState<{from_uom: string, to_uom: string, conversion_factor: number}[]>([]);
  const [uomPricing, setUomPricing] = useState<{uom: string, area: string, distributor_price: number, moq: number, moq_uom: string}[]>([]);
  const [showUOMSettings, setShowUOMSettings] = useState(false);
  const [newConversion, setNewConversion] = useState({ from_uom: '', to_uom: '', conversion_factor: 0 });

  const t = lang === 'id' ? translations.id : translations.en;

  // Statistics
  const totalProducts = products.length;
  const availableStock = products.filter(p => {
    const isNegativeAllowed = p.allow_negative_stock ?? false;
    return p.stock_status === 'available' || p.stock_quantity > p.moq || (isNegativeAllowed && p.stock_quantity < 0);
  }).length;
  const limitedStock = products.filter(p => p.stock_status === 'limited' || (p.stock_quantity > 0 && p.stock_quantity <= p.moq)).length;
  const outOfStock = products.filter(p => p.stock_status === 'out_of_stock' || p.stock_quantity === 0).length;
  const purchaseOrders = 0; // No longer showing purchase orders when allow_negative_stock is enabled

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          brand:brands(id, name),
          category:product_categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const productsWithStatus = (data || []).map((p: any) => ({
        ...p,
        brand_name: p.brand?.name || 'Brands',
        category_name: p.category?.name || '-',
        stock_status: getStockStatus(p.stock_quantity, p.moq || p.base_moq || 1, p.allow_negative_stock ?? false)
      }));

      setProducts(productsWithStatus);
      setFilteredProducts(productsWithStatus);
    } catch (error: unknown) {
      console.error('Error loading products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: t.error,
        description: `Failed to load products: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatus = (quantity: number, moq: number, allowNegative: boolean = true): 'available' | 'limited' | 'out_of_stock' | 'purchase_order' => {
    // If allow_negative_stock is enabled and quantity is 0 or negative, show as available
    if (allowNegative && quantity <= 0) return 'available';
    if (quantity === 0) return 'out_of_stock';
    if (quantity <= moq) return 'limited';
    return 'available';
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.brand_name?.toLowerCase().includes(query) ||
        p.category_name?.toLowerCase().includes(query)
      );
    }

    // Brand filter
    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand_name === selectedBrand);
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(p => p.category_name === selectedCategory);
    }

    // Allow negative stock filter
    if (showNegativeStockOnly) {
      filtered = filtered.filter(p => p.allow_negative_stock === true);
    }

    // Price range filter
    const min = minPrice ? parseFloat(minPrice) : null;
    const max = maxPrice ? parseFloat(maxPrice) : null;
    
    if (min !== null || max !== null) {
      filtered = filtered.filter(p => {
        const price = p.distributor_price || p.base_distributor_price || 0;
        if (min !== null && max !== null) {
          return price >= min && price <= max;
        } else if (min !== null) {
          return price >= min;
        } else if (max !== null) {
          return price <= max;
        }
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      
      if (sortOrder === 'latest') {
        return dateB - dateA;
      } else {
        return dateA - dateB;
      }
    });

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterAndSortProducts();
    setCurrentPage(1); // Reset to first page when filtering/sorting
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortOrder, products, selectedBrand, selectedCategory, minPrice, maxPrice, showNegativeStockOnly]);

  // Update image preview when formData.image_url changes (for existing products)
  useEffect(() => {
    if (formData.image_url && !uploadedImageFile && imageUploadMode === 'url') {
      setImagePreview(formData.image_url);
    }
  }, [formData.image_url, uploadedImageFile, imageUploadMode]);

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setBrands(data || []);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: t.error,
        description: t.brandNameRequired || "Brand name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result: any = await (supabase as any)
        .from('brands')
        .insert([{ name: newBrandName.trim() }])
        .select();

      if (result.error) throw result.error;

      if (result.data && result.data[0]) {
        setBrands([...brands, result.data[0]]);
        setFormData({...formData, brand: result.data[0].id});
        setNewBrandName('');
        setShowNewBrandInput(false);
        toast({
          title: t.success || "Success",
          description: t.brandCreated || `Brand "${newBrandName}" created successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: t.error,
        description: t.categoryNameRequired || "Category name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const result: any = await (supabase as any)
        .from('product_categories')
        .insert([{ name: newCategoryName.trim() }])
        .select();

      if (result.error) throw result.error;

      if (result.data && result.data[0]) {
        setCategories([...categories, result.data[0]]);
        setFormData({...formData, category: result.data[0].id});
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        toast({
          title: t.success || "Success",
          description: t.categoryCreated || `Category "${newCategoryName}" created successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStockBadge = (product: Product) => {
    const moqValue = product.moq || product.base_moq || 1;
    const status = product.stock_status || getStockStatus(product.stock_quantity, moqValue, product.allow_negative_stock ?? false);
    const isNegativeAllowed = product.allow_negative_stock ?? false;
    
    if (status === 'purchase_order') {
      return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">PO: {Math.abs(product.stock_quantity)} {t.boxes}</Badge>;
    } else if (status === 'out_of_stock') {
      return <Badge variant="destructive" className="text-xs">{t.outOfStock}</Badge>;
    } else if (status === 'limited') {
      return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">{product.stock_quantity} {t.boxes}</Badge>;
    } else {
      // If allow_negative_stock is true, always show the stock number (even if 0 or negative)
      if (isNegativeAllowed) {
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">{product.stock_quantity} {t.boxes}</Badge>;
      }
      return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">{product.stock_quantity} {t.boxes}</Badge>;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (product: Product) => {
    navigate(`/admin/products/edit/${product.id}`);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: t.productDeleted || "Product Deleted",
        description: t.productDeletedDesc || "Product has been successfully deleted",
      });

      // Refresh the product list
      fetchProducts();
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddProduct = () => {
    navigate('/admin/products/add');
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: t.error,
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t.error,
          description: "Image size should be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      setUploadedImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setFormData({...formData, image_url: result});
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setUploadedImageFile(null);
    setImagePreview('');
    setFormData({...formData, image_url: ''});
  };

  // Variant Management Functions
  const addVariant = () => {
    if (!newVariant.variant_name.trim()) {
      toast({
        title: t.error,
        description: "Variant name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    setProductVariants([...productVariants, { ...newVariant }]);
    setNewVariant({ variant_name: '', additional_price: 0 });
    setFormData({...formData, has_variants: true});

    // Auto-generate pricing matrix
    generateVariantPricing();
  };

  const removeVariant = (variantName: string) => {
    setProductVariants(productVariants.filter(v => v.variant_name !== variantName));
    setVariantPricing(variantPricing.filter(vp => vp.variant_name !== variantName));
  };

  const generateVariantPricing = () => {
    const newVariantPricing: any[] = [];
    
    productVariants.forEach(variant => {
      availableAreas.forEach(area => {
        const exists = variantPricing.find(vp => 
          vp.variant_name === variant.variant_name && vp.area === area
        );
        
        if (!exists) {
          newVariantPricing.push({
            variant_name: variant.variant_name,
            area: area,
            distributor_price: (formData.distributor_price || Math.round(formData.consumer_price * 0.8)) + variant.additional_price,
            moq: formData.base_moq || formData.moq
          });
        }
      });
    });
    
    if (newVariantPricing.length > 0) {
      setVariantPricing([...variantPricing, ...newVariantPricing]);
    }
  };

  const updateVariantPricing = (variant_name: string, area: string, field: 'distributor_price' | 'moq', value: number) => {
    setVariantPricing(variantPricing.map(vp => 
      vp.variant_name === variant_name && vp.area === area
        ? { ...vp, [field]: value }
        : vp
    ));
  };

  const removeVariantPricing = (variant_name: string, area: string) => {
    setVariantPricing(variantPricing.filter(vp => 
      !(vp.variant_name === variant_name && vp.area === area)
    ));
  };

  // Regional Pricing Functions
  const addRegion = () => {
    if (!newRegion.area) {
      toast({
        title: t.error,
        description: "Please select an area",
        variant: "destructive",
      });
      return;
    }

    // Check if region already exists
    const exists = regions.find(r => r.area === newRegion.area);
    if (exists) {
      toast({
        title: t.error,
        description: "This area already has pricing configured",
        variant: "destructive",
      });
      return;
    }

    setRegions([...regions, { ...newRegion }]);
    setNewRegion({ area: 'Jabodetabek', distributor_price: 0, moq: 1 });
  };

  const removeRegion = (area: string) => {
    setRegions(regions.filter(r => r.area !== area));
  };

  const handleCreateArea = () => {
    if (!newAreaName.trim()) {
      toast({
        title: t.error,
        description: "Area name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (availableAreas.includes(newAreaName.trim())) {
      toast({
        title: t.error,
        description: "Area already exists",
        variant: "destructive",
      });
      return;
    }

    const newArea = newAreaName.trim();
    setAvailableAreas([...availableAreas, newArea]);
    setNewRegion({...newRegion, area: newArea});
    
    // Auto-generate pricing for this new area with existing variants
    if (productVariants.length > 0) {
      const newPricingEntries = productVariants.map(variant => ({
        variant_name: variant.variant_name,
        area: newArea,
        distributor_price: (formData.distributor_price || Math.round(formData.consumer_price * 0.8)) + variant.additional_price,
        moq: formData.base_moq || formData.moq
      }));
      setVariantPricing([...variantPricing, ...newPricingEntries]);
    }
    
    setNewAreaName('');
    setShowNewAreaInput(false);
    toast({
      title: t.success || "Success",
      description: `Area "${newArea}" created successfully`,
    });
  };

  // UOM Management Functions
  const handleCreateUOM = () => {
    if (!newUOMName.trim()) return;
    
    const newUOM = newUOMName.trim();
    setAvailableUOMs([...availableUOMs, newUOM]);
    setNewUOMName('');
    setShowNewUOMInput(false);
    toast({
      title: t.success || "Success",
      description: `UOM "${newUOM}" created successfully`,
    });
  };

  const addUomConversion = () => {
    if (newConversion.from_uom === newConversion.to_uom) {
      toast({
        title: t.error,
        description: "Cannot convert from the same UOM to itself",
        variant: "destructive",
      });
      return;
    }

    if (!newConversion.from_uom || !newConversion.to_uom || !newConversion.conversion_factor) {
      toast({
        title: t.error,
        description: "Please fill in all conversion fields",
        variant: "destructive",
      });
      return;
    }

    const exists = uomConversions.find(conv => 
      conv.from_uom === newConversion.from_uom && conv.to_uom === newConversion.to_uom
    );

    if (exists) {
      setUomConversions(uomConversions.map(conv => 
        conv.from_uom === newConversion.from_uom && conv.to_uom === newConversion.to_uom
          ? { ...newConversion }
          : conv
      ));
    } else {
      setUomConversions([...uomConversions, { ...newConversion }]);
    }

    setNewConversion({ from_uom: '', to_uom: '', conversion_factor: 0 });
    toast({
      title: t.success || "Success",
      description: `UOM conversion ${newConversion.from_uom} → ${newConversion.to_uom} added`,
    });
  };

  const removeUomConversion = (fromUom: string, toUom: string) => {
    setUomConversions(uomConversions.filter(conv => 
      !(conv.from_uom === fromUom && conv.to_uom === toUom)
    ));
  };

  const handleSaveProduct = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.consumer_price) {
        toast({
          title: t.error,
          description: t.fillRequired || "Please fill in all required fields (Name, SKU, Consumer Price)",
          variant: "destructive",
        });
        return;
      }

      // Auto-calculate distributor price if not manually set
      const distPrice = formData.distributor_price || Math.round(formData.consumer_price * 0.8);

      let result: any;
      let productId: string;

      if (editMode && selectedProduct) {
        // Update existing product
        const updateData = {
          name: formData.name,
          description: formData.description || null,
          size: formData.size || null,
          brand: formData.brand || null,
          brand_id: formData.brand || null,
          category: formData.category || null,
          category_id: formData.category || null,
          sku: formData.sku,
          image_url: formData.image_url || null,
          consumer_price: formData.consumer_price,
          unit_per_package: formData.unit_per_package,
          distributor_price: distPrice,
          base_distributor_price: distPrice,
          stock_quantity: formData.stock_quantity,
          moq: formData.moq,
          base_moq: formData.base_moq || formData.moq,
          is_active: formData.is_active,
          allow_negative_stock: formData.allow_negative_stock,
          has_variants: formData.has_variants,
          single_sku_moq: formData.single_sku_moq,
          allow_mix_variants: formData.allow_mix_variants,
          base_uom: formData.base_uom,
          moq_uom: formData.moq_uom,
          pricing_uom: formData.pricing_uom,
          enable_uom_conversions: formData.enable_uom_conversions,
        };

        result = await (supabase as any)
          .from('products')
          .update(updateData)
          .eq('id', selectedProduct.id)
          .select();

        if (result.error) throw result.error;
        productId = selectedProduct.id;

        toast({
          title: t.productUpdated || "Product Updated",
          description: t.productUpdatedDesc || "Product has been successfully updated",
        });
      } else {
        // Create new product
        const insertData = {
          name: formData.name,
          description: formData.description || null,
          size: formData.size || null,
          brand: formData.brand || null,
          brand_id: formData.brand || null,
          category: formData.category || null,
          category_id: formData.category || null,
          sku: formData.sku,
          image_url: formData.image_url || null,
          consumer_price: formData.consumer_price,
          unit_per_package: formData.unit_per_package,
          distributor_price: distPrice,
          base_distributor_price: distPrice,
          stock_quantity: formData.stock_quantity,
          moq: formData.moq,
          base_moq: formData.base_moq || formData.moq,
          is_active: formData.is_active,
          allow_negative_stock: formData.allow_negative_stock,
          has_variants: formData.has_variants,
          single_sku_moq: formData.single_sku_moq,
          allow_mix_variants: formData.allow_mix_variants,
          base_uom: formData.base_uom,
          moq_uom: formData.moq_uom,
          pricing_uom: formData.pricing_uom,
          enable_uom_conversions: formData.enable_uom_conversions,
        };

        result = await (supabase as any)
          .from('products')
          .insert([insertData])
          .select();

        if (result.error) throw result.error;
        productId = result.data?.[0]?.id;

        toast({
          title: t.productCreated || "Product Created",
          description: t.productCreatedDesc || "Product has been successfully created",
        });
      }

      // Save product variants
      if (productId && productVariants.length > 0) {
        try {
          // Delete existing variants
          await supabase
            .from('product_variants')
            .delete()
            .eq('product_id', productId);
            
          // Insert new variants
          const variantsToInsert = productVariants.map(variant => ({
            product_id: productId,
            variant_name: variant.variant_name,
            additional_price: variant.additional_price,
            is_active: true
          }));
          
          await (supabase as any)
            .from('product_variants')
            .insert(variantsToInsert);
        } catch (error) {
          console.error('Error saving variants:', error);
        }
      }

      // Save variant pricing (regional pricing for variants)
      if (productId && variantPricing.length > 0) {
        try {
          // Delete existing region pricing
          await supabase
            .from('region_pricing')
            .delete()
            .eq('product_id', productId);
            
          // Group by area
          const areaGroups = variantPricing.reduce((acc: any, vp) => {
            if (!acc[vp.area]) acc[vp.area] = [];
            acc[vp.area].push(vp);
            return acc;
          }, {});
          
          // Insert region pricing
          const regionPricingToInsert = Object.entries(areaGroups).map(([area, prices]: [string, any]) => {
            const basePrice = Math.min(...prices.map((p: any) => p.distributor_price));
            const baseMoq = prices[0]?.moq || formData.base_moq || formData.moq;
            
            return {
              product_id: productId,
              area: area,
              distributor_price: basePrice,
              moq: baseMoq,
              moq_uom: formData.moq_uom,
              sku_level_moq: formData.single_sku_moq,
              allow_mix_variants: formData.allow_mix_variants
            };
          });
          
          await (supabase as any)
            .from('region_pricing')
            .insert(regionPricingToInsert);
        } catch (error) {
          console.error('Error saving variant pricing:', error);
        }
      }

      // Save regional pricing (if no variants)
      if (productId && showRegions && regions.length > 0 && productVariants.length === 0) {
        try {
          // Delete existing regions
          await supabase
            .from('region_pricing')
            .delete()
            .eq('product_id', productId);
          
          // Insert new regions
          const regionsToInsert = regions.map(region => ({
            product_id: productId,
            area: region.area,
            distributor_price: region.distributor_price,
            moq: region.moq,
            moq_uom: formData.moq_uom
          }));
          
          await (supabase as any)
            .from('region_pricing')
            .insert(regionsToInsert);
        } catch (error) {
          console.error('Error saving regional pricing:', error);
        }
      }

      // Save UOM conversions
      if (productId && formData.enable_uom_conversions && uomConversions.length > 0) {
        try {
          // Delete existing UOM conversions
          await supabase
            .from('uom_conversions')
            .delete()
            .eq('product_id', productId);
          
          // Insert new UOM conversions
          const conversionsToInsert = uomConversions.map(conversion => ({
            product_id: productId,
            from_uom: conversion.from_uom,
            to_uom: conversion.to_uom,
            conversion_factor: conversion.conversion_factor,
            is_active: true
          }));
          
          await (supabase as any)
            .from('uom_conversions')
            .insert(conversionsToInsert);
        } catch (error) {
          console.error('Error saving UOM conversions:', error);
        }
      }

      // Save UOM pricing
      if (productId && formData.enable_uom_conversions && uomPricing.length > 0) {
        try {
          // Delete existing UOM pricing
          await supabase
            .from('uom_pricing')
            .delete()
            .eq('product_id', productId);
          
          // Insert new UOM pricing
          const uomPricingToInsert = uomPricing.map(pricing => ({
            product_id: productId,
            uom: pricing.uom,
            area: pricing.area,
            distributor_price: pricing.distributor_price,
            moq: pricing.moq,
            moq_uom: pricing.moq_uom,
            is_active: true
          }));
          
          await (supabase as any)
            .from('uom_pricing')
            .insert(uomPricingToInsert);
        } catch (error) {
          console.error('Error saving UOM pricing:', error);
        }
      }

      // Refresh the product list
      fetchProducts();
      setIsEditDialogOpen(false);
      setSelectedProduct(null);
      
      // Reset all advanced states
      setProductVariants([]);
      setVariantPricing([]);
      setRegions([]);
      setUomConversions([]);
      setUomPricing([]);
      setShowRegions(false);
      setShowVariantPricing(false);
      setShowUOMSettings(false);
    } catch (error: any) {
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-1">{t.productManagement}</h1>
        <p className="text-sm text-muted-foreground">{t.manageProductsInventory}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.totalProducts}</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
              <p className="text-xs text-muted-foreground">{t.activeSkus}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.available}</p>
              <p className="text-2xl font-bold text-green-600">{availableStock}</p>
              <p className="text-xs text-muted-foreground">{t.readyStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.limitedStock}</p>
              <p className="text-2xl font-bold text-yellow-600">{limitedStock}</p>
              <p className="text-xs text-muted-foreground">{t.needsRestock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.outOfStock}</p>
              <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
              <p className="text-xs text-muted-foreground">{t.emptyStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t.purchaseOrder}</p>
              <p className="text-2xl font-bold text-purple-600">{purchaseOrders}</p>
              <p className="text-xs text-muted-foreground">{t.negativeStock}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Actions */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md">
              <span className="text-xs text-blue-700">
                💡 Produk dengan "Allow Negative Stock" akan menampilkan status "Available" saat stok negatif
              </span>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-orange-50 border-orange-300" : ""}
            >
              {t.filter}
              {(selectedBrand || selectedCategory || minPrice || maxPrice || showNegativeStockOnly) && (
                <span className="ml-2 bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {[selectedBrand, selectedCategory, minPrice, maxPrice, showNegativeStockOnly].filter(Boolean).length}
                </span>
              )}
            </Button>
            
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t.sortBy}:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="border rounded px-3 py-1.5 text-sm"
              >
                <option value="latest">{t.latest}</option>
                <option value="oldest">{t.oldest}</option>
              </select>
            </div>

            <Button className="bg-orange-500 hover:bg-orange-600" onClick={handleAddProduct}>
              <Plus className="h-4 w-4 mr-2" />
              {t.addSku}
            </Button>
          </div>
        </div>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Filter Produk</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedBrand("");
                  setSelectedCategory("");
                  setMinPrice("");
                  setMaxPrice("");
                  setShowNegativeStockOnly(false);
                }}
                className="text-xs"
              >
                Reset Filter
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Brand Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Brand</Label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Semua Brand</option>
                  {Array.from(new Set(products.map(p => p.brand_name || p.brand).filter(Boolean))).map(brand => (
                    <option key={brand} value={brand}>{brand}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-xs">Kategori</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Semua Kategori</option>
                  {Array.from(new Set(products.map(p => p.category_name || p.category).filter(Boolean))).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="space-y-2">
                <Label className="text-xs">Harga Minimum</Label>
                <Input
                  type="number"
                  placeholder="Rp 0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Harga Maximum</Label>
                <Input
                  type="number"
                  placeholder="Rp 999,999,999"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Allow Negative Stock Filter */}
              <div className="space-y-2 col-span-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showNegativeStockOnly}
                    onChange={(e) => setShowNegativeStockOnly(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-xs">Tampilkan hanya produk dengan stok negatif diizinkan</span>
                </label>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedBrand || selectedCategory || minPrice || maxPrice || showNegativeStockOnly) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Filter aktif:</span>
                {selectedBrand && (
                  <Badge variant="secondary" className="text-xs">
                    Brand: {selectedBrand}
                    <button onClick={() => setSelectedBrand("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="secondary" className="text-xs">
                    Kategori: {selectedCategory}
                    <button onClick={() => setSelectedCategory("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {showNegativeStockOnly && (
                  <Badge variant="secondary" className="text-xs">
                    Stok Negatif Diizinkan
                    <button onClick={() => setShowNegativeStockOnly(false)} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {minPrice && (
                  <Badge variant="secondary" className="text-xs">
                    Min: Rp {parseInt(minPrice).toLocaleString('id-ID')}
                    <button onClick={() => setMinPrice("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
                {maxPrice && (
                  <Badge variant="secondary" className="text-xs">
                    Max: Rp {parseInt(maxPrice).toLocaleString('id-ID')}
                    <button onClick={() => setMaxPrice("")} className="ml-1 hover:text-red-600">×</button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Products Table */}
      <Card>
        <div className="p-4 border-b">
          <p className="text-sm text-muted-foreground">
            {t.showing} {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} {t.of} {filteredProducts.length}
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">{t.loading}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.product}</TableHead>
                <TableHead>{t.sku}</TableHead>
                <TableHead>{t.category}</TableHead>
                <TableHead>{t.unitPerPackage}</TableHead>
                <TableHead>{t.distributorPrice}</TableHead>
                <TableHead>{t.stock}</TableHead>
                <TableHead>{t.moq}</TableHead>
                <TableHead>{t.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    {t.noProducts}
                  </TableCell>
                </TableRow>
              ) : (
                currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.brand_name || 'Brands'}</p>
                          <p className="text-sm text-muted-foreground">{product.name}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="text-sm">{product.category_name || '-'}</TableCell>
                    <TableCell className="text-sm">{product.unit_per_package || 1} pcs</TableCell>
                    <TableCell className="text-sm">Rp {(product.distributor_price || product.base_distributor_price || 0).toLocaleString('id-ID')}</TableCell>
                    <TableCell>{getStockBadge(product)}</TableCell>
                    <TableCell className="text-sm">{product.moq || product.base_moq || 1} {t.boxes}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t.viewDetails}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(product)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {!isLoading && filteredProducts.length > 0 && (
          <div className="p-4 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{itemsPerPage} {t.perPage}</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border rounded px-2 py-1"
              >
                <option value="8">8</option>
                <option value="12">12</option>
                <option value="24">24</option>
                <option value="48">48</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                &lt;
              </Button>
              
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className={currentPage === pageNum ? "bg-orange-500 hover:bg-orange-600" : ""}
                  >
                    {pageNum}
                  </Button>
                );
              })}

              {totalPages > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* View Product Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t.productDetails || "Product Details"}</DialogTitle>
            <DialogDescription>
              {t.viewProductInfo || "View detailed product information"}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedProduct.image_url ? (
                    <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{selectedProduct.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedProduct.brand_name || 'Brands'}</p>
                  <p className="text-xs text-muted-foreground mt-1">SKU: {selectedProduct.sku}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.category}</p>
                  <p className="text-sm">{selectedProduct.category_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.unitPerPackage}</p>
                  <p className="text-sm">{selectedProduct.unit_per_package} pcs</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.distributorPrice}</p>
                  <p className="text-sm">Rp {selectedProduct.distributor_price?.toLocaleString('id-ID') || '0'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.moq}</p>
                  <p className="text-sm">{selectedProduct.moq} {t.boxes}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.stock}</p>
                  <div className="mt-1">{getStockBadge(selectedProduct)}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t.close || "Close"}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              if (selectedProduct) handleEdit(selectedProduct);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              {t.edit}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmDelete || "Confirm Deletion"}</DialogTitle>
            <DialogDescription>
              {t.deleteConfirmText || "Are you sure you want to delete this product?"}
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4">
              <p className="text-sm">
                <strong>{selectedProduct.brand_name || 'Brands'}</strong> - {selectedProduct.name}
              </p>
              <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
              <p className="text-sm text-red-600 mt-2">
                {t.cannotUndo || "This action cannot be undone."}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t.cancel || "Cancel"}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open);
        if (!open) {
          // Reset image upload state when dialog closes
          setImageUploadMode('url');
          setUploadedImageFile(null);
          setImagePreview('');
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editMode ? t.editProduct : t.addProduct}</DialogTitle>
            <DialogDescription>
              {editMode ? t.editProductDesc : t.addProductDesc}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t.productName} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={t.productNamePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">{t.size}</Label>
                <Input
                  id="size"
                  value={formData.size}
                  onChange={(e) => setFormData({...formData, size: e.target.value})}
                  placeholder={t.sizePlaceholder || "e.g., 500ml, 1kg"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">{t.brand}</Label>
                {!showNewBrandInput ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        value={formData.brand}
                        onValueChange={(value) => setFormData({...formData, brand: value})}
                      >
                        <SelectTrigger id="brand">
                          <SelectValue placeholder={t.selectBrand || "Select brand"} />
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
                      title={t.addNewBrand || "Add new brand"}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.enterBrandName || "Enter new brand name"}
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
                      {t.add || "Add"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setShowNewBrandInput(false);
                        setNewBrandName('');
                      }}
                      title={t.cancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t.category}</Label>
                {!showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select 
                        value={formData.category}
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder={t.selectCategory || "Select category"} />
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
                      title={t.addNewCategory || "Add new category"}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.enterCategoryName || "Enter new category name"}
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
                      {t.add || "Add"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setShowNewCategoryInput(false);
                        setNewCategoryName('');
                      }}
                      title={t.cancel}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t.description}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                placeholder={t.descriptionPlaceholder || "Enter product description"}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">{t.sku} *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder={t.skuPlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumer_price">{t.consumerPrice} *</Label>
                <Input
                  id="consumer_price"
                  type="number"
                  value={formData.consumer_price}
                  onChange={(e) => setFormData({...formData, consumer_price: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit_per_package">{t.unitPerPackage}</Label>
                <Input
                  id="unit_per_package"
                  type="number"
                  value={formData.unit_per_package}
                  onChange={(e) => setFormData({...formData, unit_per_package: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="distributor_price">{t.distributorPrice}</Label>
                <Input
                  id="distributor_price"
                  type="number"
                  value={formData.distributor_price}
                  onChange={(e) => setFormData({...formData, distributor_price: parseFloat(e.target.value) || 0})}
                  placeholder={t.autoCalculated || "Auto-calculated from consumer price"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock_quantity">{t.stock}</Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moq">{t.moq}</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData({...formData, moq: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image_url">{t.imageUrl}</Label>
              
              {/* Image Mode Toggle */}
              <div className="flex gap-2 mb-2">
                <Button
                  type="button"
                  variant={imageUploadMode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImageUploadMode('url');
                    clearImage();
                  }}
                  className="flex-1"
                >
                  URL
                </Button>
                <Button
                  type="button"
                  variant={imageUploadMode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setImageUploadMode('upload');
                    setFormData({...formData, image_url: ''});
                  }}
                  className="flex-1"
                >
                  Upload
                </Button>
              </div>

              {/* URL Input */}
              {imageUploadMode === 'url' && (
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({...formData, image_url: e.target.value});
                    setImagePreview(e.target.value);
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              )}

              {/* File Upload */}
              {imageUploadMode === 'upload' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="flex-1"
                    />
                    {uploadedImageFile && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearImage}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                  {uploadedImageFile && (
                    <p className="text-xs text-muted-foreground">
                      {uploadedImageFile.name} ({(uploadedImageFile.size / 1024).toFixed(2)} KB)
                    </p>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {(imagePreview || formData.image_url) && (
                <div className="mt-2 border rounded-lg p-2">
                  <img 
                    src={imagePreview || formData.image_url} 
                    alt="Preview" 
                    className="w-full h-48 object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBOb3QgRm91bmQ8L3RleHQ+PC9zdmc+';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allow_negative_stock"
                checked={formData.allow_negative_stock}
                onChange={(e) => setFormData({...formData, allow_negative_stock: e.target.checked})}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="allow_negative_stock" className="cursor-pointer">{t.allowNegativeStock}</Label>
            </div>

            {/* Product Variants Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="has_variants"
                    checked={formData.has_variants}
                    onChange={(e) => setFormData({...formData, has_variants: e.target.checked})}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="has_variants" className="cursor-pointer font-medium">{t.hasVariants || "Has Variants"}</Label>
                </div>
              </div>

              {formData.has_variants && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder={t.variantName || "Variant Name (e.g., Rasa Cokelat)"}
                      value={newVariant.variant_name}
                      onChange={(e) => setNewVariant({...newVariant, variant_name: e.target.value})}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder={t.additionalPrice || "Additional Price"}
                      value={newVariant.additional_price}
                      onChange={(e) => setNewVariant({...newVariant, additional_price: parseFloat(e.target.value) || 0})}
                      className="w-32"
                    />
                    <Button type="button" onClick={addVariant}>
                      <Plus className="h-4 w-4 mr-1" /> {t.add}
                    </Button>
                  </div>

                  {productVariants.length > 0 && (
                    <div className="border rounded-lg p-3 space-y-2">
                      {productVariants.map((variant, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{variant.variant_name}</span>
                            <span className="text-sm text-gray-600 ml-2">+Rp {variant.additional_price.toLocaleString()}</span>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeVariant(variant.variant_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Variant Pricing Matrix */}
                  {productVariants.length > 0 && (
                    <div className="mt-3">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          generateVariantPricing();
                          setShowVariantPricing(!showVariantPricing);
                        }}
                      >
                        {showVariantPricing ? t.hideVariantPricing || "Hide Variant Pricing" : t.showVariantPricing || "Show Variant Pricing by Area"}
                      </Button>

                      {showVariantPricing && variantPricing.length > 0 && (
                        <div className="mt-3 border rounded-lg p-3 max-h-60 overflow-y-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.variant}</TableHead>
                                <TableHead>{t.area}</TableHead>
                                <TableHead>{t.distributorPrice}</TableHead>
                                <TableHead>{t.moq}</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {variantPricing.map((vp, index) => (
                                <TableRow key={index}>
                                  <TableCell>{vp.variant_name}</TableCell>
                                  <TableCell>{vp.area}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={vp.distributor_price}
                                      onChange={(e) => updateVariantPricing(vp.variant_name, vp.area, 'distributor_price', parseFloat(e.target.value) || 0)}
                                      className="w-24"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      value={vp.moq}
                                      onChange={(e) => updateVariantPricing(vp.variant_name, vp.area, 'moq', parseInt(e.target.value) || 1)}
                                      className="w-20"
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeVariantPricing(vp.variant_name, vp.area)}
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
                    </div>
                  )}

                  {/* Mix Variants for MOQ */}
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allow_mix_variants"
                        checked={formData.allow_mix_variants}
                        onChange={(e) => setFormData({...formData, allow_mix_variants: e.target.checked})}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label htmlFor="allow_mix_variants" className="cursor-pointer">{t.allowMixVariants || "Allow Mix Variants for MOQ"}</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="single_sku_moq">{t.singleSkuMoq || "SKU Combined MOQ"}</Label>
                      <Input
                        id="single_sku_moq"
                        type="number"
                        value={formData.single_sku_moq}
                        onChange={(e) => setFormData({...formData, single_sku_moq: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500">{t.singleSkuMoqDesc || "Allow customers to mix variants to reach this total quantity"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Regional Pricing Section */}
            <div className="border-t pt-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => setShowRegions(!showRegions)}
              >
                {showRegions ? t.hideRegionalPricing || "Hide Regional Pricing" : t.showRegionalPricing || "Show Regional Pricing"}
              </Button>

              {showRegions && (
                <div className="mt-3 space-y-3">
                  <div className="flex gap-2">
                    {!showNewAreaInput ? (
                      <>
                        <Select 
                          value={newRegion.area}
                          onValueChange={(value) => setNewRegion({...newRegion, area: value})}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t.selectArea || "Select Area"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableAreas.map((area) => (
                              <SelectItem key={area} value={area}>
                                {area}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowNewAreaInput(true)}
                          title={t.addNewArea || "Add new area"}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          placeholder={t.enterAreaName || "Enter new area name"}
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="default" 
                          size="sm" 
                          onClick={handleCreateArea}
                        >
                          {t.add}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setShowNewAreaInput(false);
                            setNewAreaName('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t.distributorPrice}
                      value={newRegion.distributor_price}
                      onChange={(e) => setNewRegion({...newRegion, distributor_price: parseFloat(e.target.value) || 0})}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder={t.moq}
                      value={newRegion.moq}
                      onChange={(e) => setNewRegion({...newRegion, moq: parseInt(e.target.value) || 1})}
                      className="w-24"
                    />
                    <Button type="button" onClick={addRegion}>
                      <Plus className="h-4 w-4 mr-1" /> {t.add}
                    </Button>
                  </div>

                  {regions.length > 0 && (
                    <div className="border rounded-lg p-3">
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
                          {regions.map((region, index) => (
                            <TableRow key={index}>
                              <TableCell>{region.area}</TableCell>
                              <TableCell>Rp {region.distributor_price.toLocaleString()}</TableCell>
                              <TableCell>{region.moq}</TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRegion(region.area)}
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
                </div>
              )}
            </div>

            {/* UOM Settings Section */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="enable_uom_conversions"
                    checked={formData.enable_uom_conversions}
                    onChange={(e) => {
                      setFormData({...formData, enable_uom_conversions: e.target.checked});
                      setShowUOMSettings(e.target.checked);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="enable_uom_conversions" className="cursor-pointer font-medium">{t.enableUomConversions || "Enable UOM Conversions"}</Label>
                </div>
              </div>

              {showUOMSettings && formData.enable_uom_conversions && (
                <div className="space-y-3">
                  {/* Base UOM Settings */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-2">
                      <Label>{t.baseUom || "Base UOM"}</Label>
                      <Select 
                        value={formData.base_uom}
                        onValueChange={(value) => setFormData({...formData, base_uom: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.moqUom || "MOQ UOM"}</Label>
                      <Select 
                        value={formData.moq_uom}
                        onValueChange={(value) => setFormData({...formData, moq_uom: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t.pricingUom || "Pricing UOM"}</Label>
                      <Select 
                        value={formData.pricing_uom}
                        onValueChange={(value) => setFormData({...formData, pricing_uom: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* UOM Conversions */}
                  <div className="mt-3">
                    <Label className="mb-2 block">{t.uomConversions || "UOM Conversions"}</Label>
                    <div className="flex gap-2 mb-2">
                      <Select 
                        value={newConversion.from_uom}
                        onValueChange={(value) => setNewConversion({...newConversion, from_uom: value})}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t.fromUom || "From UOM"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="flex items-center">→</span>
                      <Select 
                        value={newConversion.to_uom}
                        onValueChange={(value) => setNewConversion({...newConversion, to_uom: value})}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder={t.toUom || "To UOM"} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUOMs.map((uom) => (
                            <SelectItem key={uom} value={uom}>{uom}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={t.factor || "Factor"}
                        value={newConversion.conversion_factor}
                        onChange={(e) => setNewConversion({...newConversion, conversion_factor: parseFloat(e.target.value) || 0})}
                        className="w-24"
                      />
                      <Button type="button" size="sm" onClick={addUomConversion}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {uomConversions.length > 0 && (
                      <div className="border rounded-lg p-2 space-y-1">
                        {uomConversions.map((conv, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span>{conv.from_uom} → {conv.to_uom} (×{conv.conversion_factor})</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUomConversion(conv.from_uom, conv.to_uom)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add New UOM Button */}
                  {!showNewUOMInput && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowNewUOMInput(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> {t.addNewUom || "Add New UOM"}
                    </Button>
                  )}

                  {showNewUOMInput && (
                    <div className="flex gap-2">
                      <Input
                        placeholder={t.enterUomName || "Enter new UOM name"}
                        value={newUOMName}
                        onChange={(e) => setNewUOMName(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleCreateUOM}>
                        {t.add}
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost"
                        onClick={() => {
                          setShowNewUOMInput(false);
                          setNewUOMName('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveProduct}>
              {editMode ? t.saveChanges : t.create}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const translations = {
  id: {
    productManagement: "Product Management",
    manageProductsInventory: "Kelola produk dan inventory",
    totalProducts: "Total Produk",
    activeSkus: "SKU aktif",
    available: "Available",
    readyStock: "Stok tersedia",
    limitedStock: "Limited Stock",
    needsRestock: "Perlu restock",
    outOfStock: "Out of Stock",
    emptyStock: "Stok habis",
    purchaseOrder: "Purchase Order",
    negativeStock: "Stok negatif",
    allowNegativeStock: "Izinkan Stok Negatif (PO)",
    searchPlaceholder: "Cari berdasarkan nama produk, SKU, atau brand...",
    filter: "Filter",
    sortBy: "Urutkan",
    latest: "Terbaru",
    oldest: "Terlama",
    addSku: "Tambah SKU",
    showing: "Ditampilkan",
    of: "dari",
    product: "Produk",
    sku: "SKU",
    brand: "Brand",
    category: "Kategori",
    unitPerPackage: "Isi per unit",
    distributorPrice: "Harga Dist.",
    stock: "Stok",
    moq: "MOQ",
    actions: "Aksi",
    boxes: "karton",
    loading: "Memuat...",
    noProducts: "Tidak ada produk",
    edit: "Edit",
    viewDetails: "Lihat Detail",
    delete: "Hapus",
    perPage: "per halaman",
    error: "Error",
    comingSoon: "Segera Hadir",
    useSkuManager: "Silakan gunakan SKU Manager untuk mengedit/menambah produk",
    productDetails: "Detail Produk",
    viewProductInfo: "Lihat informasi detail produk",
    close: "Tutup",
    confirmDelete: "Konfirmasi Penghapusan",
    deleteConfirmText: "Apakah Anda yakin ingin menghapus produk ini?",
    cannotUndo: "Tindakan ini tidak dapat dibatalkan.",
    cancel: "Batal",
    productDeleted: "Produk Dihapus",
    productDeletedDesc: "Produk berhasil dihapus",
    addProduct: "Tambah Produk",
    editProduct: "Edit Produk",
    addProductDesc: "Tambahkan produk baru ke inventory",
    editProductDesc: "Edit informasi produk",
    productName: "Nama Produk",
    productNamePlaceholder: "Masukkan nama produk",
    brandPlaceholder: "Masukkan nama brand",
    categoryPlaceholder: "Masukkan kategori",
    skuPlaceholder: "Masukkan kode SKU",
    imageUrl: "URL Gambar",
    saveChanges: "Simpan Perubahan",
    create: "Buat",
    fillRequired: "Harap isi semua field yang wajib",
    productCreated: "Produk Dibuat",
    productCreatedDesc: "Produk berhasil ditambahkan",
    productUpdated: "Produk Diperbarui",
    productUpdatedDesc: "Produk berhasil diperbarui",
    size: "Ukuran",
    description: "Deskripsi",
    consumerPrice: "Harga Konsumen",
    selectBrand: "Pilih brand",
    selectCategory: "Pilih kategori",
    addNewBrand: "Tambah brand baru",
    addNewCategory: "Tambah kategori baru",
    enterBrandName: "Masukkan nama brand",
    enterCategoryName: "Masukkan nama kategori",
    add: "Tambah",
    brandNameRequired: "Nama brand harus diisi",
    categoryNameRequired: "Nama kategori harus diisi",
    success: "Berhasil",
    brandCreated: "Brand berhasil dibuat",
    categoryCreated: "Kategori berhasil dibuat",
    autoCalculated: "Auto-hitung dari harga konsumen",
    sizePlaceholder: "mis: 500ml, 1kg",
    descriptionPlaceholder: "Masukkan deskripsi produk",
    advancedSettings: "Pengaturan Lanjutan",
    advancedSettingsDesc: "Untuk fitur lanjutan seperti harga regional, varian produk, dan pengaturan UOM, silakan gunakan SKU Manager lengkap.",
    openSkuManager: "Buka SKU Manager",
    availableFeatures: "Fitur yang tersedia di SKU Manager",
    regionalPricing: "Harga regional per area distribusi",
    productVariants: "Varian produk dengan harga kustom",
    uomSettings: "Konversi Unit of Measure (UOM)",
    mixVariants: "Campur & padankan varian untuk MOQ",
    hasVariants: "Memiliki Varian",
    variantName: "Nama Varian",
    additionalPrice: "Harga Tambahan",
    variant: "Varian",
    area: "Area",
    showVariantPricing: "Tampilkan Harga Varian per Area",
    hideVariantPricing: "Sembunyikan Harga Varian",
    allowMixVariants: "Izinkan Campuran Varian untuk MOQ",
    singleSkuMoq: "MOQ Total SKU",
    singleSkuMoqDesc: "Izinkan pelanggan mencampur varian untuk mencapai total kuantitas ini",
    showRegionalPricing: "Tampilkan Harga Regional",
    hideRegionalPricing: "Sembunyikan Harga Regional",
    selectArea: "Pilih Area",
    addNewArea: "Tambah area baru",
    enterAreaName: "Masukkan nama area baru",
    enableUomConversions: "Aktifkan Konversi UOM",
    baseUom: "UOM Dasar",
    moqUom: "UOM MOQ",
    pricingUom: "UOM Harga",
    uomConversions: "Konversi UOM",
    fromUom: "Dari UOM",
    toUom: "Ke UOM",
    factor: "Faktor",
    addNewUom: "Tambah UOM Baru",
    enterUomName: "Masukkan nama UOM baru",
  },
  en: {
    productManagement: "Product Management",
    manageProductsInventory: "Manage products and inventory",
    totalProducts: "Total Products",
    activeSkus: "Active SKUs",
    available: "Available",
    readyStock: "Ready stock",
    limitedStock: "Limited Stock",
    needsRestock: "Needs restock",
    outOfStock: "Out of Stock",
    emptyStock: "Empty stock",
    purchaseOrder: "Purchase Order",
    negativeStock: "Negative stock",
    allowNegativeStock: "Allow Negative Stock (PO)",
    searchPlaceholder: "Search by product name, SKU, or brand...",
    filter: "Filter",
    sortBy: "Sort by",
    latest: "Latest",
    oldest: "Oldest",
    addSku: "Add SKU",
    showing: "Showing",
    of: "of",
    product: "Product",
    sku: "SKU",
    brand: "Brand",
    category: "Category",
    unitPerPackage: "Unit per pkg",
    distributorPrice: "Dist. Price",
    stock: "Stock",
    moq: "MOQ",
    actions: "Actions",
    boxes: "boxes",
    loading: "Loading...",
    noProducts: "No products",
    edit: "Edit",
    viewDetails: "View Details",
    delete: "Delete",
    perPage: "per page",
    error: "Error",
    comingSoon: "Coming Soon",
    useSkuManager: "Please use SKU Manager to edit/add products",
    productDetails: "Product Details",
    viewProductInfo: "View detailed product information",
    close: "Close",
    confirmDelete: "Confirm Deletion",
    deleteConfirmText: "Are you sure you want to delete this product?",
    cannotUndo: "This action cannot be undone.",
    cancel: "Cancel",
    productDeleted: "Product Deleted",
    productDeletedDesc: "Product has been successfully deleted",
    addProduct: "Add Product",
    editProduct: "Edit Product",
    addProductDesc: "Add a new product to inventory",
    editProductDesc: "Edit product information",
    productName: "Product Name",
    productNamePlaceholder: "Enter product name",
    brandPlaceholder: "Enter brand name",
    categoryPlaceholder: "Enter category",
    skuPlaceholder: "Enter SKU code",
    imageUrl: "Image URL",
    saveChanges: "Save Changes",
    create: "Create",
    fillRequired: "Please fill in all required fields",
    productCreated: "Product Created",
    productCreatedDesc: "Product has been successfully created",
    productUpdated: "Product Updated",
    productUpdatedDesc: "Product has been successfully updated",
    size: "Size",
    description: "Description",
    consumerPrice: "Consumer Price",
    selectBrand: "Select brand",
    selectCategory: "Select category",
    addNewBrand: "Add new brand",
    addNewCategory: "Add new category",
    enterBrandName: "Enter new brand name",
    enterCategoryName: "Enter new category name",
    add: "Add",
    brandNameRequired: "Brand name is required",
    categoryNameRequired: "Category name is required",
    success: "Success",
    brandCreated: "Brand created successfully",
    categoryCreated: "Category created successfully",
    autoCalculated: "Auto-calculated from consumer price",
    sizePlaceholder: "e.g., 500ml, 1kg",
    descriptionPlaceholder: "Enter product description",
    advancedSettings: "Advanced Settings",
    advancedSettingsDesc: "For advanced features like regional pricing, product variants, and UOM settings, please use the full SKU Manager.",
    openSkuManager: "Open SKU Manager",
    availableFeatures: "Available features in SKU Manager",
    regionalPricing: "Regional pricing per distribution area",
    productVariants: "Product variants with custom pricing",
    uomSettings: "Unit of Measure (UOM) conversions",
    mixVariants: "Mix & match variants for MOQ",
    hasVariants: "Has Variants",
    variantName: "Variant Name",
    additionalPrice: "Additional Price",
    variant: "Variant",
    area: "Area",
    showVariantPricing: "Show Variant Pricing by Area",
    hideVariantPricing: "Hide Variant Pricing",
    allowMixVariants: "Allow Mix Variants for MOQ",
    singleSkuMoq: "SKU Combined MOQ",
    singleSkuMoqDesc: "Allow customers to mix variants to reach this total quantity",
    showRegionalPricing: "Show Regional Pricing",
    hideRegionalPricing: "Hide Regional Pricing",
    selectArea: "Select Area",
    addNewArea: "Add new area",
    enterAreaName: "Enter new area name",
    enableUomConversions: "Enable UOM Conversions",
    baseUom: "Base UOM",
    moqUom: "MOQ UOM",
    pricingUom: "Pricing UOM",
    uomConversions: "UOM Conversions",
    fromUom: "From UOM",
    toUom: "To UOM",
    factor: "Factor",
    addNewUom: "Add New UOM",
    enterUomName: "Enter new UOM name",
  }
};
