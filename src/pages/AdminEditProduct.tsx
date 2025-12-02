import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SEO from "@/components/seo/SEO";
import Navbar from "@/components/layout/Navbar";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { uploadFileToS3, getImageUrl } from "@/lib/s3-upload";
import { ArrowLeft, Plus, Trash2, X, Save, AlertCircle, Upload, Link } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function AdminEditProduct() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { lang } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state - mapped to products table
  const [formData, setFormData] = useState({
    name: '',                        // products.name
    description: '',                 // products.description
    size: '',                        // products.size
    brand_id: '',                    // products.brand_id (FK to brands)
    category_id: '',                 // products.category_id (FK to categories)
    sku: '',                         // products.sku
    image_url: '',                   // products.image_url
    consumer_price: 0,               // products.consumer_price
    retail_price: 0,                 // products.retail_price
    distributor_price: 0,            // products.distributor_price
    // base_distributor_price removed
    stock_quantity: 0,               // products.stock_quantity
    moq: 1,                          // products.moq
    // base_moq removed
    unit_per_package: 1,             // products.unit_per_package
    is_active: true,                 // products.is_active
    allow_negative_stock: false,     // products.allow_negative_stock
    has_variants: false,             // products.has_variants
    single_sku_moq: 0,               // products.single_sku_moq
    allow_mix_variants: false,       // products.allow_mix_variants
    base_uom: 'pcs',                 // products.base_uom
    moq_uom: 'pcs',                  // products.moq_uom
    pricing_uom: 'pcs',              // products.pricing_uom
    enable_uom_conversions: false,   // products.enable_uom_conversions
  });

  // Dropdown data
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Image upload states
  const [productImages, setProductImages] = useState<string[]>([]);
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('upload');
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Product variants state - mapped to product_variants table
  const [productVariants, setProductVariants] = useState<{
    variant_name: string;           // product_variants.variant_name
    additional_price: number;        // product_variants.additional_price
  }[]>([]);
  const [newVariant, setNewVariant] = useState({ variant_name: '', additional_price: 0 });
  
  // Variant pricing state - mapped to region_pricing table (for variants)
  const [variantPricing, setVariantPricing] = useState<{
    variant_name: string;
    area: string;                    // region_pricing.area
    distributor_price: number;       // region_pricing.distributor_price
    moq: number;                     // region_pricing.moq
  }[]>([]);
  const [showVariantPricing, setShowVariantPricing] = useState(false);

  // Regional pricing state - mapped to region_pricing table
  const [regions, setRegions] = useState<{
    area: string;                    // region_pricing.area
    distributor_price: number;       // region_pricing.distributor_price
    moq: number;                     // region_pricing.moq
  }[]>([]);
  const [newRegion, setNewRegion] = useState({ area: 'Jabodetabek', distributor_price: 0, moq: 1 });
  const [availableAreas, setAvailableAreas] = useState(["Jabodetabek", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Bali", "Sumatera"]);
  const [showNewAreaInput, setShowNewAreaInput] = useState(false);
  const [newAreaName, setNewAreaName] = useState('');
  const [showRegions, setShowRegions] = useState(false);

  // UOM state - mapped to uom_conversions and uom_pricing tables
  const [availableUOMs, setAvailableUOMs] = useState(["pcs", "box", "carton", "pack", "kg", "gram", "liter", "ml", "dozen", "unit"]);
  const [showNewUOMInput, setShowNewUOMInput] = useState(false);
  const [newUOMName, setNewUOMName] = useState('');
  
  // UOM conversions - mapped to uom_conversions table
  const [uomConversions, setUomConversions] = useState<{
    from_uom: string;                // uom_conversions.from_uom
    to_uom: string;                  // uom_conversions.to_uom
    conversion_factor: number;       // uom_conversions.conversion_factor
  }[]>([]);
  const [newConversion, setNewConversion] = useState({ from_uom: '', to_uom: '', conversion_factor: 0 });
  
  // UOM pricing - mapped to uom_pricing table
  const [uomPricing, setUomPricing] = useState<{
    uom: string;                     // uom_pricing.uom
    area: string;                    // uom_pricing.area
    distributor_price: number;       // uom_pricing.distributor_price
    moq: number;                     // uom_pricing.moq
    moq_uom: string;                 // uom_pricing.moq_uom
  }[]>([]);
  const [showUOMSettings, setShowUOMSettings] = useState(false);

  const t = lang === 'id' ? translations.id : translations.en;

  useEffect(() => {
    fetchBrands();
    fetchCategories();
    if (id) {
      loadProduct();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Image upload handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    const remainingSlots = 5 - productImages.length;
    const filesToProcess = fileArray.slice(0, remainingSlots);

    setIsUploadingImage(true);

    try {
      for (const file of filesToProcess) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({
            title: "Error",
            description: "Please upload only image files",
            variant: "destructive",
          });
          continue;
        }

        // Upload to S3 (with automatic compression to max 2MB)
        const result = await uploadFileToS3(file, 'products');
        
        if (result.success && result.url) {
          setProductImages(prev => [...prev, result.url!]);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to upload image",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload images",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
      // Clear input
      e.target.value = '';
    }
  };

  const addImageFromUrl = () => {
    if (!tempImageUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    if (productImages.length >= 5) {
      toast({
        title: "Error",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    // Always store full S3 URL if relative path is entered
    const S3_BASE_URL = "https://your-bucket.s3.amazonaws.com/"; // TODO: Replace with your actual S3/public base URL
    const url = tempImageUrl.trim();
    const finalUrl = url.startsWith('http') || url.startsWith('https') ? url : S3_BASE_URL + url;
    setProductImages(prev => [...prev, finalUrl]);
    setTempImageUrl("");
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const setAsPrimaryImage = (index: number) => {
    setMainImageIndex(index);
  };

  const loadProduct = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      // Load product data
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (product) {
        setFormData({
          name: (product as any).name || '',
          description: (product as any).description || '',
          size: (product as any).size || '',
          brand_id: (product as any).brand_id || '',
          category_id: (product as any).category_id || '',
          sku: (product as any).sku || '',
          image_url: (product as any).image_url || '',
          consumer_price: (product as any).consumer_price || 0,
          retail_price: (product as any).retail_price || 0,
          distributor_price: (product as any).distributor_price || 0,
          base_distributor_price: (product as any).base_distributor_price || 0,
          stock_quantity: (product as any).stock_quantity || 0,
          moq: (product as any).moq || 1,
          base_moq: (product as any).base_moq || 1,
          unit_per_package: (product as any).unit_per_package || 1,
          is_active: (product as any).is_active ?? true,
          allow_negative_stock: (product as any).allow_negative_stock ?? false,
          has_variants: (product as any).has_variants ?? false,
          single_sku_moq: (product as any).single_sku_moq || 0,
          allow_mix_variants: (product as any).allow_mix_variants ?? false,
          base_uom: (product as any).base_uom || 'pcs',
          moq_uom: (product as any).moq_uom || 'pcs',
          pricing_uom: (product as any).pricing_uom || 'pcs',
          enable_uom_conversions: (product as any).enable_uom_conversions ?? false,
        });

        // Load existing images from product_images table
        const { data: imagesData } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', id)
          .order('display_order', { ascending: true });
        
        if (imagesData && imagesData.length > 0) {
          setProductImages(imagesData.map((img: any) => img.image_url));
          const primaryIndex = imagesData.findIndex((img: any) => img.is_primary);
          setMainImageIndex(primaryIndex >= 0 ? primaryIndex : 0);
        } else if ((product as any).image_url) {
          // Fallback to old single image_url field
          setProductImages([(product as any).image_url]);
          setMainImageIndex(0);
        }
      }

      // Load variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', id);
      
      if (variantsData) {
        setProductVariants(variantsData.map((v: any) => ({
          variant_name: v.variant_name,
          additional_price: v.additional_price
        })));
      }

      // Load regional pricing
      const { data: regionData } = await supabase
        .from('region_pricing')
        .select('*')
        .eq('product_id', id);
      
      if (regionData) {
        setRegions(regionData.map((r: any) => ({
          area: r.area,
          distributor_price: r.distributor_price,
          moq: r.moq
        })));
        if (regionData.length > 0) {
          setShowRegions(true);
        }
      }

      // Load UOM conversions
      const { data: conversionData } = await supabase
        .from('uom_conversions')
        .select('*')
        .eq('product_id', id);
      
      if (conversionData) {
        setUomConversions(conversionData.map((c: any) => ({
          from_uom: c.from_uom,
          to_uom: c.to_uom,
          conversion_factor: c.conversion_factor
        })));
      }

      // Load UOM pricing
      const { data: uomPricingData } = await supabase
        .from('uom_pricing')
        .select('*')
        .eq('product_id', id);
      
      if (uomPricingData) {
        setUomPricing(uomPricingData.map((up: any) => ({
          uom: up.uom,
          area: up.area,
          distributor_price: up.distributor_price,
          moq: up.moq,
          moq_uom: up.moq_uom
        })));
        if (uomPricingData.length > 0) {
          setShowUOMSettings(true);
        }
      }
    } catch (error: any) {
      console.error('Error loading product:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('id, name')
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
        .select('id, name')
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
        description: t.brandNameRequired,
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
        setFormData({...formData, brand_id: result.data[0].id});
        setNewBrandName('');
        setShowNewBrandInput(false);
        toast({ title: t.success, description: t.brandCreated });
      }
    } catch (error: any) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: t.error,
        description: t.categoryNameRequired,
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
        setFormData({...formData, category_id: result.data[0].id});
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        toast({ title: t.success, description: t.categoryCreated });
      }
    } catch (error: any) {
      toast({ title: t.error, description: error.message, variant: "destructive" });
    }
  };

  // Variant management
  const addVariant = () => {
    if (!newVariant.variant_name.trim()) {
      toast({ title: t.error, description: "Variant name is required", variant: "destructive" });
      return;
    }

    setProductVariants([...productVariants, { ...newVariant }]);
    setNewVariant({ variant_name: '', additional_price: 0 });
    setFormData({...formData, has_variants: true});
    generateVariantPricing();
  };

  const removeVariant = (variantName: string) => {
    setProductVariants(productVariants.filter(v => v.variant_name !== variantName));
    setVariantPricing(variantPricing.filter(vp => vp.variant_name !== variantName));
  };

  const generateVariantPricing = () => {
    const basePrice = formData.distributor_price || formData.base_distributor_price || Math.round(formData.consumer_price * 0.8);
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
            distributor_price: basePrice + variant.additional_price,
            moq: formData.moq || formData.base_moq
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
      vp.variant_name === variant_name && vp.area === area ? { ...vp, [field]: value } : vp
    ));
  };

  const removeVariantPricing = (variant_name: string, area: string) => {
    setVariantPricing(variantPricing.filter(vp => 
      !(vp.variant_name === variant_name && vp.area === area)
    ));
  };

  // Regional pricing management
  const addRegion = () => {
    if (!newRegion.area) {
      toast({ title: t.error, description: "Please select an area", variant: "destructive" });
      return;
    }

    const exists = regions.find(r => r.area === newRegion.area);
    if (exists) {
      toast({ title: t.error, description: "This area already exists", variant: "destructive" });
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
      toast({ title: t.error, description: "Area name is required", variant: "destructive" });
      return;
    }

    if (availableAreas.includes(newAreaName.trim())) {
      toast({ title: t.error, description: "Area already exists", variant: "destructive" });
      return;
    }

    const newArea = newAreaName.trim();
    setAvailableAreas([...availableAreas, newArea]);
    setNewRegion({...newRegion, area: newArea});
    setNewAreaName('');
    setShowNewAreaInput(false);
    toast({ title: t.success, description: `Area "${newArea}" created` });
  };

  // UOM management
  const handleCreateUOM = () => {
    if (!newUOMName.trim()) return;
    
    const newUOM = newUOMName.trim();
    setAvailableUOMs([...availableUOMs, newUOM]);
    setNewUOMName('');
    setShowNewUOMInput(false);
    toast({ title: t.success, description: `UOM "${newUOM}" created` });
  };

  const addUomConversion = () => {
    if (newConversion.from_uom === newConversion.to_uom) {
      toast({ title: t.error, description: "Cannot convert from the same UOM", variant: "destructive" });
      return;
    }

    if (!newConversion.from_uom || !newConversion.to_uom || !newConversion.conversion_factor) {
      toast({ title: t.error, description: "Please fill in all conversion fields", variant: "destructive" });
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
    toast({ title: t.success, description: `UOM conversion added` });
  };

  const removeUomConversion = (fromUom: string, toUom: string) => {
    setUomConversions(uomConversions.filter(conv => 
      !(conv.from_uom === fromUom && conv.to_uom === toUom)
    ));
  };

  const handleSubmit = async () => {
    if (!id) return;
    
    try {
      // Validate required fields
      if (!formData.name || !formData.sku || !formData.consumer_price) {
        toast({
          title: t.error,
          description: "Please fill in all required fields (Name, SKU, Consumer Price)",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);

      // Auto-calculate prices if not set
      const distPrice = formData.distributor_price || formData.base_distributor_price || Math.round(formData.consumer_price * 0.8);
      const baseDistPrice = formData.base_distributor_price || distPrice;
      const retailPrice = formData.retail_price || Math.round(formData.consumer_price * 1.2);

      // Update products table
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        size: formData.size || null,
        brand_id: formData.brand_id || null,
        category_id: formData.category_id || null,
        sku: formData.sku,
        image_url: productImages.length > 0 ? productImages[0] : null,
        consumer_price: formData.consumer_price,
        retail_price: retailPrice,
        distributor_price: distPrice,
        base_distributor_price: baseDistPrice,
        stock_quantity: formData.stock_quantity,
        moq: formData.moq,
        base_moq: formData.base_moq,
        unit_per_package: formData.unit_per_package,
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

      const result: any = await (supabase as any)
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select();

      if (result.error) throw result.error;

      // Delete and re-insert product_images
      await supabase.from('product_images').delete().eq('product_id', id);
      
      if (productImages.length > 0) {
        const imagesToInsert = productImages.map((imageUrl, index) => ({
          product_id: id,
          image_url: imageUrl,
          is_primary: index === mainImageIndex,
          display_order: index,
        }));
        
        await (supabase as any)
          .from('product_images')
          .insert(imagesToInsert);
      }

      // Delete and re-insert product_variants
      if (productVariants.length > 0) {
        await supabase.from('product_variants').delete().eq('product_id', id);
        
        const variantsToInsert = productVariants.map(variant => ({
          product_id: id,
          variant_name: variant.variant_name,
          additional_price: variant.additional_price,
          is_active: true
        }));
        
        await (supabase as any)
          .from('product_variants')
          .insert(variantsToInsert);
      } else {
        await supabase.from('product_variants').delete().eq('product_id', id);
      }

      // Delete and re-insert region_pricing
      await supabase.from('region_pricing').delete().eq('product_id', id);
      
      if (variantPricing.length > 0) {
        const areaGroups = variantPricing.reduce((acc: any, vp) => {
          if (!acc[vp.area]) acc[vp.area] = [];
          acc[vp.area].push(vp);
          return acc;
        }, {});
        
        const regionPricingToInsert = Object.entries(areaGroups).map(([area, prices]: [string, any]) => {
          const basePrice = Math.min(...prices.map((p: any) => p.distributor_price));
          const baseMoq = prices[0]?.moq || formData.moq || formData.base_moq;
          
          return {
            product_id: id,
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
      } else if (regions.length > 0) {
        const regionsToInsert = regions.map(region => ({
          product_id: id,
          area: region.area,
          distributor_price: region.distributor_price,
          moq: region.moq,
          moq_uom: formData.moq_uom
        }));
        
        await (supabase as any)
          .from('region_pricing')
          .insert(regionsToInsert);
      }

      // Delete and re-insert uom_conversions
      await supabase.from('uom_conversions').delete().eq('product_id', id);
      
      if (formData.enable_uom_conversions && uomConversions.length > 0) {
        const conversionsToInsert = uomConversions.map(conversion => ({
          product_id: id,
          from_uom: conversion.from_uom,
          to_uom: conversion.to_uom,
          conversion_factor: conversion.conversion_factor,
          is_active: true
        }));
        
        await (supabase as any)
          .from('uom_conversions')
          .insert(conversionsToInsert);
      }

      // Delete and re-insert uom_pricing
      await supabase.from('uom_pricing').delete().eq('product_id', id);
      
      if (formData.enable_uom_conversions && uomPricing.length > 0) {
        const uomPricingToInsert = uomPricing.map(pricing => ({
          product_id: id,
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
      }

      toast({
        title: t.success,
        description: "Product updated successfully",
      });

      navigate('/admin/products');
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: t.error,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO title={t.editProduct} description={t.editProductDesc} />
      <Navbar />
      <div className="flex">
        <AdminSidebar lang={lang} />
        <main className="flex-1 py-8 px-4 lg:px-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">{t.loading}</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => navigate('/admin/products')}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">{t.editProduct}</h1>
                    <p className="text-sm text-muted-foreground">{t.editProductDesc}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => navigate('/admin/products')}>
                    {t.cancel}
                  </Button>
                  <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>{t.saving}...</>
                    ) : (
                      <><Save className="h-4 w-4 mr-2" /> {t.saveChanges}</>
                    )}
                  </Button>
                </div>
              </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left Column (2/3) */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="basic">{t.basicInformation}</TabsTrigger>
                    <TabsTrigger value="pricing">{t.pricingAndStock}</TabsTrigger>
                    <TabsTrigger value="variants">{t.productVariants}</TabsTrigger>
                    <TabsTrigger value="regional">{t.regionalPricing}</TabsTrigger>
                    <TabsTrigger value="uom">{t.uomSettings}</TabsTrigger>
                  </TabsList>

                  {/* Basic Information Tab */}
                  <TabsContent value="basic" className="space-y-4 mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t.productName} <span className="text-red-500">*</span></Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sku">{t.sku} <span className="text-red-500">*</span></Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        placeholder="Enter SKU code"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t.description}</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      rows={3}
                      placeholder="Enter product description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="size">{t.size}</Label>
                      <Input
                        id="size"
                        value={formData.size}
                        onChange={(e) => setFormData({...formData, size: e.target.value})}
                        placeholder="e.g., 500ml, 1kg"
                      />
                    </div>
                    
                    {/* Multi-Image Upload Section */}
                    <div className="space-y-2 col-span-2">
                      <Label>{lang === 'id' ? 'Gambar Produk (1-5 gambar)' : 'Product Images (1-5 images)'}</Label>
                      
                      {/* Toggle Upload Mode */}
                      <div className="flex gap-2 mb-3">
                        <Button
                          type="button"
                          variant={imageUploadMode === 'upload' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageUploadMode('upload')}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {lang === 'id' ? 'Upload File' : 'Upload File'}
                        </Button>
                        <Button
                          type="button"
                          variant={imageUploadMode === 'url' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setImageUploadMode('url')}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          {lang === 'id' ? 'URL' : 'URL'}
                        </Button>
                      </div>

                      {/* Upload Mode */}
                      {imageUploadMode === 'upload' && (
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            disabled={productImages.length >= 5 || isUploadingImage}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            {lang === 'id' 
                              ? `Maksimal 5 gambar, akan dikompres otomatis maks 2MB per gambar. ${productImages.length}/5 gambar`
                              : `Maximum 5 images, automatically compressed to max 2MB each. ${productImages.length}/5 images`}
                          </p>
                          {isUploadingImage && (
                            <p className="text-sm text-orange-500">{lang === 'id' ? 'Mengunggah...' : 'Uploading...'}</p>
                          )}
                        </div>
                      )}

                      {/* URL Mode */}
                      {imageUploadMode === 'url' && (
                        <div className="flex gap-2">
                          <Input
                            type="url"
                            value={tempImageUrl}
                            onChange={(e) => setTempImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            disabled={productImages.length >= 5}
                          />
                          <Button
                            type="button"
                            onClick={addImageFromUrl}
                            disabled={productImages.length >= 5 || !tempImageUrl.trim()}
                          >
                            {lang === 'id' ? 'Tambah' : 'Add'}
                          </Button>
                        </div>
                      )}

                      {/* Image Preview Grid */}
                      {productImages.length > 0 && (
                        <div className="grid grid-cols-5 gap-3 mt-4">
                          {productImages.map((image, index) => (
                            <div 
                              key={index} 
                              className="relative group aspect-square border rounded-lg overflow-hidden bg-muted"
                            >
                              <img 
                                src={getImageUrl(image) || image} 
                                alt={`Product ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              {index === mainImageIndex && (
                                <div className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-2 py-0.5 rounded font-semibold">
                                  {lang === 'id' ? 'Gambar Utama' : 'Main Image'}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                {index !== mainImageIndex && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setAsPrimaryImage(index)}
                                    className="h-8 text-xs"
                                  >
                                    {lang === 'id' ? 'Jadikan Utama' : 'Set as Main'}
                                  </Button>
                                )}
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => removeImage(index)}
                                  className="h-8"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="text-md font-semibold mb-4">{t.categoryAndBrand}</h3>
                    <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t.brand}</Label>
                    {!showNewBrandInput ? (
                      <div className="flex gap-2">
                        <Select 
                          value={formData.brand_id}
                          onValueChange={(value) => setFormData({...formData, brand_id: value})}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t.selectBrand} />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>
                                {brand.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowNewBrandInput(true)}
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
                        <Button onClick={handleCreateBrand}>Add</Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setShowNewBrandInput(false);
                            setNewBrandName('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t.category}</Label>
                    {!showNewCategoryInput ? (
                      <div className="flex gap-2">
                        <Select 
                          value={formData.category_id}
                          onValueChange={(value) => setFormData({...formData, category_id: value})}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder={t.selectCategory} />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setShowNewCategoryInput(true)}
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
                        <Button onClick={handleCreateCategory}>Add</Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setShowNewCategoryInput(false);
                            setNewCategoryName('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Pricing & Stock Tab */}
            <TabsContent value="pricing" className="space-y-4 mt-6">
              <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="consumer_price">{t.consumerPrice} <span className="text-red-500">*</span></Label>
                      <Input
                        id="consumer_price"
                        type="number"
                        value={formData.consumer_price || ''}
                        onChange={(e) => setFormData({...formData, consumer_price: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retail_price">Harga Retail</Label>
                      <Input
                        id="retail_price"
                        type="number"
                        value={formData.retail_price || ''}
                        onChange={(e) => setFormData({...formData, retail_price: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="distributor_price">Harga Distributor</Label>
                      <Input
                        id="distributor_price"
                        type="number"
                        value={formData.distributor_price || ''}
                        onChange={(e) => setFormData({...formData, distributor_price: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    {/* Removed base_distributor_price field, only using distributor_price */}
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stock_quantity">{t.stockQuantity}</Label>
                      <Input
                        id="stock_quantity"
                        type="number"
                        value={formData.stock_quantity || ''}
                        onChange={(e) => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="moq">MOQ</Label>
                      <Input
                        id="moq"
                        type="number"
                        value={formData.moq || ''}
                        onChange={(e) => setFormData({...formData, moq: parseInt(e.target.value) || 1})}
                        placeholder="1"
                      />
                    </div>
                    {/* Removed base_moq field, only using moq */}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unit_per_package">Unit per Package</Label>
                    <Input
                      id="unit_per_package"
                      type="number"
                      value={formData.unit_per_package || ''}
                      onChange={(e) => setFormData({...formData, unit_per_package: parseInt(e.target.value) || 1})}
                      placeholder="1"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="single_sku_moq">{t.singleSkuMoq}</Label>
                    <Input
                      id="single_sku_moq"
                      type="number"
                      value={formData.single_sku_moq || ''}
                      onChange={(e) => setFormData({...formData, single_sku_moq: parseInt(e.target.value) || 0})}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">{t.singleSkuMoqDesc}</p>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_negative_stock"
                        checked={formData.allow_negative_stock}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, allow_negative_stock: checked as boolean })
                        }
                      />
                      <Label htmlFor="allow_negative_stock">Allow Negative Stock</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData({...formData, is_active: checked as boolean})}
                      />
                      <Label htmlFor="is_active" className="cursor-pointer">{t.isActive}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow_mix_variants"
                        checked={formData.allow_mix_variants}
                        onCheckedChange={(checked) => setFormData({...formData, allow_mix_variants: checked as boolean})}
                      />
                      <Label htmlFor="allow_mix_variants" className="cursor-pointer">{t.allowMixVariants}</Label>
                    </div>
                  </div>
                </div>
            </TabsContent>

            {/* Product Variants Tab */}
            <TabsContent value="variants" className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                        <Checkbox
                          id="has_variants"
                          checked={formData.has_variants}
                          onCheckedChange={(checked) => setFormData({...formData, has_variants: checked as boolean})}
                        />
                        <Label htmlFor="has_variants" className="cursor-pointer">{t.enableVariants}</Label>
                      </div>
                    </div>

                {formData.has_variants && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-6 space-y-2">
                        <Label>{t.variantName || "Variant Name"}</Label>
                        <Input
                          placeholder="e.g., Chocolate Flavor"
                          value={newVariant.variant_name}
                          onChange={(e) => setNewVariant({...newVariant, variant_name: e.target.value})}
                        />
                      </div>
                      <div className="col-span-4 space-y-2">
                        <Label>{t.additionalPrice || "Additional Price"}</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={newVariant.additional_price || ''}
                          onChange={(e) => setNewVariant({...newVariant, additional_price: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      <div className="col-span-2">
                        <Button onClick={addVariant} className="w-full">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>

                    {productVariants.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.variantName}</TableHead>
                              <TableHead>{t.additionalPrice}</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {productVariants.map((variant, index) => (
                              <TableRow key={index}>
                                <TableCell>{variant.variant_name}</TableCell>
                                <TableCell>Rp {variant.additional_price.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => removeVariant(variant.variant_name)}
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

                    {productVariants.length > 0 && (
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            generateVariantPricing();
                            setShowVariantPricing(!showVariantPricing);
                          }}
                        >
                          {showVariantPricing ? t.hideVariantPricing : t.showVariantPricing}
                        </Button>

                        {showVariantPricing && variantPricing.length > 0 && (
                          <div className="mt-3 border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>{t.variant}</TableHead>
                                  <TableHead>{t.area}</TableHead>
                                  <TableHead>{t.distributorPrice}</TableHead>
                                  <TableHead>{t.moq}</TableHead>
                                  <TableHead className="w-12"></TableHead>
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
                                        className="w-32"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={vp.moq}
                                        onChange={(e) => updateVariantPricing(vp.variant_name, vp.area, 'moq', parseInt(e.target.value) || 1)}
                                        className="w-24"
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Button
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
                  </div>
                )}
              </TabsContent>

              {/* Regional Pricing Tab */}
              <TabsContent value="regional" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowRegions(!showRegions)}
                  >
                    {showRegions ? t.hideRegionalPricing : t.showRegionalPricing}
                  </Button>
                </div>                {showRegions && (
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      {!showNewAreaInput ? (
                        <>
                          <Select 
                            value={newRegion.area}
                            onValueChange={(value) => setNewRegion({...newRegion, area: value})}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select area" />
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
                            variant="outline" 
                            size="icon" 
                            onClick={() => setShowNewAreaInput(true)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            placeholder="Enter new area name"
                            value={newAreaName}
                            onChange={(e) => setNewAreaName(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleCreateArea}>Add</Button>
                          <Button 
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
                        placeholder="Distributor price"
                        value={newRegion.distributor_price || ''}
                        onChange={(e) => setNewRegion({...newRegion, distributor_price: parseFloat(e.target.value) || 0})}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="MOQ"
                        value={newRegion.moq || ''}
                        onChange={(e) => setNewRegion({...newRegion, moq: parseInt(e.target.value) || 1})}
                        className="w-32"
                      />
                      <Button onClick={addRegion}>
                        <Plus className="h-4 w-4 mr-1" /> Add
                      </Button>
                    </div>

                    {regions.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t.area}</TableHead>
                              <TableHead>{t.distributorPrice}</TableHead>
                              <TableHead>{t.moq}</TableHead>
                              <TableHead className="w-12"></TableHead>
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
              </TabsContent>

              {/* UOM Settings Tab */}
              <TabsContent value="uom" className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable_uom_conversions"
                      checked={formData.enable_uom_conversions}
                      onCheckedChange={(checked) => {
                        setFormData({...formData, enable_uom_conversions: checked as boolean});
                        setShowUOMSettings(checked as boolean);
                      }}
                    />
                    <Label htmlFor="enable_uom_conversions" className="cursor-pointer">{t.enableUom}</Label>
                  </div>
                </div>

                {showUOMSettings && formData.enable_uom_conversions && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>{t.baseUom}</Label>
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
                        <Label>{t.moqUom}</Label>
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
                        <Label>{t.pricingUom}</Label>
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

                    <div>
                      <Label className="mb-2 block">{t.uomConversions}</Label>
                      <div className="flex gap-2 mb-3">
                        <Select 
                          value={newConversion.from_uom}
                          onValueChange={(value) => setNewConversion({...newConversion, from_uom: value})}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="From UOM" />
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
                            <SelectValue placeholder="To UOM" />
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
                          placeholder="Factor"
                          value={newConversion.conversion_factor || ''}
                          onChange={(e) => setNewConversion({...newConversion, conversion_factor: parseFloat(e.target.value) || 0})}
                          className="w-24"
                        />
                        <Button size="sm" onClick={addUomConversion}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {uomConversions.length > 0 && (
                        <div className="border rounded-lg p-3 space-y-2">
                          {uomConversions.map((conv, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{conv.from_uom} → {conv.to_uom} (×{conv.conversion_factor})</span>
                              <Button
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

                    {!showNewUOMInput && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowNewUOMInput(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" /> {t.addNewUom}
                      </Button>
                    )}

                    {showNewUOMInput && (
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter new UOM name"
                          value={newUOMName}
                          onChange={(e) => setNewUOMName(e.target.value)}
                          className="flex-1"
                        />
                        <Button onClick={handleCreateUOM}>Add</Button>
                        <Button 
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
              </TabsContent>
            </Tabs>
          </Card>
        </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-3">{t.quickInfo}</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.requiredFields}</p>
                      <p className="text-muted-foreground text-xs">Name, SKU, and Consumer Price are required</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="font-medium">{t.autoPricing}</p>
                      <p className="text-muted-foreground text-xs">Distributor price auto-calculated at 80% of consumer price</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Summary */}
              <Card className="p-6">
                <h3 className="text-sm font-semibold mb-3">{t.summary}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Variants:</span>
                    <span className="font-medium">{productVariants.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Regional Pricing:</span>
                    <span className="font-medium">{regions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">UOM Conversions:</span>
                    <span className="font-medium">{uomConversions.length}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="font-medium">{formData.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const translations = {
  id: {
    editProduct: "Edit Produk",
    editProductDesc: "Edit informasi produk dan konfigurasi",
    cancel: "Batal",
    saveChanges: "Simpan Perubahan",
    saving: "Menyimpan",
    loading: "Memuat...",
    basicInformation: "Informasi Dasar",
    productName: "Nama Produk",
    sku: "SKU",
    description: "Deskripsi",
    size: "Ukuran",
    imageUrl: "URL Gambar",
    categoryAndBrand: "Kategori & Brand",
    brand: "Brand",
    category: "Kategori",
    selectBrand: "Pilih brand",
    selectCategory: "Pilih kategori",
    pricingAndStock: "Harga & Stok",
    consumerPrice: "Harga Konsumen",
    retailPrice: "Harga Retail",
    distributorPrice: "Harga Distributor",
    unitPerPackage: "Unit per Paket",
    stockQuantity: "Jumlah Stok",
    moq: "MOQ",
    singleSkuMoq: "SKU MOQ Gabungan",
    singleSkuMoqDesc: "Izinkan mencampur varian untuk mencapai kuantitas total ini",
    isActive: "Aktif",
    allowNegativeStock: "Izinkan Stok Negatif (PO)",
    allowMixVariants: "Izinkan Campur Varian",
    productVariants: "Varian Produk",
    enableVariants: "Aktifkan Varian",
    variantName: "Nama Varian",
    additionalPrice: "Harga Tambahan",
    hideVariantPricing: "Sembunyikan Harga Varian",
    showVariantPricing: "Tampilkan Harga Varian per Area",
    variant: "Varian",
    area: "Area",
    regionalPricing: "Harga Regional",
    hideRegionalPricing: "Sembunyikan Harga Regional",
    showRegionalPricing: "Tampilkan Harga Regional",
    uomSettings: "Pengaturan UOM",
    enableUom: "Aktifkan Konversi UOM",
    baseUom: "UOM Dasar",
    moqUom: "UOM MOQ",
    pricingUom: "UOM Harga",
    uomConversions: "Konversi UOM",
    addNewUom: "Tambah UOM Baru",
    quickInfo: "Info Cepat",
    requiredFields: "Field Wajib",
    autoPricing: "Harga Otomatis",
    summary: "Ringkasan",
    error: "Error",
    success: "Berhasil",
    brandNameRequired: "Nama brand harus diisi",
    categoryNameRequired: "Nama kategori harus diisi",
    brandCreated: "Brand berhasil dibuat",
    categoryCreated: "Kategori berhasil dibuat",
  },
  en: {
    editProduct: "Edit Product",
    editProductDesc: "Edit product information and configurations",
    cancel: "Cancel",
    saveChanges: "Save Changes",
    saving: "Saving",
    loading: "Loading...",
    basicInformation: "Basic Information",
    productName: "Product Name",
    sku: "SKU",
    description: "Description",
    size: "Size",
    imageUrl: "Image URL",
    categoryAndBrand: "Category & Brand",
    brand: "Brand",
    category: "Category",
    selectBrand: "Select brand",
    selectCategory: "Select category",
    pricingAndStock: "Pricing & Stock",
    consumerPrice: "Consumer Price",
    retailPrice: "Retail Price",
    distributorPrice: "Distributor Price",
    unitPerPackage: "Unit per Package",
    stockQuantity: "Stock Quantity",
    moq: "MOQ",
    singleSkuMoq: "SKU Combined MOQ",
    singleSkuMoqDesc: "Allow mixing variants to reach this total quantity",
    isActive: "Active",
    allowNegativeStock: "Allow Negative Stock (PO)",
    allowMixVariants: "Allow Mix Variants",
    productVariants: "Product Variants",
    enableVariants: "Enable Variants",
    variantName: "Variant Name",
    additionalPrice: "Additional Price",
    hideVariantPricing: "Hide Variant Pricing",
    showVariantPricing: "Show Variant Pricing by Area",
    variant: "Variant",
    area: "Area",
    regionalPricing: "Regional Pricing",
    hideRegionalPricing: "Hide Regional Pricing",
    showRegionalPricing: "Show Regional Pricing",
    uomSettings: "UOM Settings",
    enableUom: "Enable UOM Conversions",
    baseUom: "Base UOM",
    moqUom: "MOQ UOM",
    pricingUom: "Pricing UOM",
    uomConversions: "UOM Conversions",
    addNewUom: "Add New UOM",
    quickInfo: "Quick Info",
    requiredFields: "Required Fields",
    autoPricing: "Auto Pricing",
    summary: "Summary",
    error: "Error",
    success: "Success",
    brandNameRequired: "Brand name is required",
    categoryNameRequired: "Category name is required",
    brandCreated: "Brand created successfully",
    categoryCreated: "Category created successfully",
  }
};
