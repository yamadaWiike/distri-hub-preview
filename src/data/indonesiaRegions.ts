import { supabase } from '@/integrations/supabase/client';

/**
 * Types for Indonesia administrative regions
 * Province = Provinsi
 * Regency = Kota/Kabupaten
 * District = Kecamatan
 */

export type Province = {
  id: string;
  name: string;
};

export type Regency = {
  id: string;
  province_id: string;
  name: string;
};

export type District = {
  id: string;
  regency_id: string;
  name: string;
};

/**
 * Fetch all provinces from Supabase
 */
export async function fetchProvinces(): Promise<Province[]> {
  try {
    const { data, error } = await supabase
      .from('reg_provinces')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching provinces:', error);
    return [];
  }
}

/**
 * Fetch all regencies (kota/kabupaten)
 */
export async function fetchAllRegencies(): Promise<Regency[]> {
  try {
    const { data, error } = await supabase
      .from('reg_regencies')
      .select('id, province_id, name')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching all regencies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all regencies:', error);
    return [];
  }
}

/**
 * Fetch regencies (kota/kabupaten) by province ID
 */
export async function fetchRegenciesByProvince(provinceId: string): Promise<Regency[]> {
  try {
    const { data, error } = await supabase
      .from('reg_regencies')
      .select('id, province_id, name')
      .eq('province_id', provinceId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching regencies:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching regencies:', error);
    return [];
  }
}

/**
 * Fetch districts (kecamatan) by regency ID
 */
export async function fetchDistrictsByRegency(regencyId: string): Promise<District[]> {
  try {
    const { data, error } = await supabase
      .from('reg_districts')
      .select('id, regency_id, name')
      .eq('regency_id', regencyId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching districts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

/**
 * Get province by ID
 */
export async function getProvinceById(provinceId: string): Promise<Province | null> {
  try {
    const { data, error } = await supabase
      .from('reg_provinces')
      .select('id, name')
      .eq('id', provinceId)
      .single();

    if (error) {
      console.error('Error fetching province:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching province:', error);
    return null;
  }
}

/**
 * Get regency by ID
 */
export async function getRegencyById(regencyId: string): Promise<Regency | null> {
  try {
    const { data, error } = await supabase
      .from('reg_regencies')
      .select('id, province_id, name')
      .eq('id', regencyId)
      .single();

    if (error) {
      console.error('Error fetching regency:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching regency:', error);
    return null;
  }
}

/**
 * Get district by ID
 */
export async function getDistrictById(districtId: string): Promise<District | null> {
  try {
    const { data, error } = await supabase
      .from('reg_districts')
      .select('id, regency_id, name')
      .eq('id', districtId)
      .single();

    if (error) {
      console.error('Error fetching district:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching district:', error);
    return null;
  }
}
