import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, X, Loader2 } from 'lucide-react';
import { fetchAllBrands, Brand } from '@/data/brands';

// Define the type for brand insert operations
interface BrandInsert {
  name: string;
}

const SKUManager = () => {
  const { toast } = useToast();
  
  // Basic brand state
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
  
  // Function to load all brands
  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const brandData = await fetchAllBrands();
      setBrands(brandData);
      console.log("Loaded brands:", brandData);
    } catch (error) {
      console.error('Error loading brands:', error);
      toast({
        title: "Error",
        description: "Failed to load brands",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new brand
  const createBrand = async (brandName: string): Promise<Brand | null> => {
    try {
      // First check if brand already exists
      const { data: existingBrand } = await supabase
        .from('brands')
        .select('id, name')
        .ilike('name', brandName.trim())
        .maybeSingle();
      
      if (existingBrand) {
        // Use type assertion to work around TypeScript errors with Supabase
        const brand = existingBrand as unknown as { id: string; name: string };
        return {
          id: brand.id,
          name: brand.name
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
      
      // Get the newly created brand
      const { data: newBrand } = await supabase
        .from('brands')
        .select('id, name')
        .ilike('name', brandName.trim())
        .single();
      
      if (newBrand) {
        // Use type assertion to work around TypeScript errors with Supabase
        const brand = newBrand as unknown as { id: string; name: string };
        return {
          id: brand.id,
          name: brand.name
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in createBrand:', error);
      return null;
    }
  };

  // Handle creating a new brand
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
      const newBrand = await createBrand(newBrandName.trim());
      
      if (!newBrand) {
        toast({
          title: "Error",
          description: "Failed to create brand",
          variant: 'destructive',
        });
        return;
      }
      
      // Add to our brands list
      setBrands(prevBrands => [...prevBrands, newBrand]);
      
      // Select the new brand
      setSelectedBrand(newBrand.id);
      
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

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-6">SKU Manager</h2>
      
      <div className="border p-6 rounded-lg bg-white shadow-sm mb-6">
        <h3 className="text-lg font-semibold mb-4">Brand Selection Demo</h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            {!showNewBrandInput ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select 
                    value={selectedBrand}
                    onValueChange={setSelectedBrand}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="brand">
                      <SelectValue placeholder={isLoading ? "Loading brands..." : "Select brand"} />
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
                  disabled={!newBrandName.trim() || addingBrand}
                >
                  {addingBrand ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    'Add'
                  )}
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

          {selectedBrand && (
            <div className="p-4 bg-gray-50 rounded-md">
              <p>Selected Brand ID: <code className="bg-gray-200 px-2 py-1 rounded text-sm">{selectedBrand}</code></p>
              <p>Selected Brand Name: <strong>{brands.find(b => b.id === selectedBrand)?.name || 'Unknown'}</strong></p>
            </div>
          )}
          
          <div className="flex justify-end mt-6">
            <Button type="button" onClick={loadBrands}>
              Refresh Brands
            </Button>
          </div>
        </div>
      </div>
      
      <div className="text-center text-gray-500 text-sm mt-8">
        <p>The full SKU Manager functionality is being repaired.</p>
        <p>This is a simplified version to demonstrate the brand selection with "add new brand" feature.</p>
      </div>
    </div>
  );
};

export default SKUManager;
