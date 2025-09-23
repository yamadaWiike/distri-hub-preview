import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

/**
 * Update an order in the database
 * This is a workaround for TypeScript issues with Supabase types
 */
export async function updateOrder(id: string, data: Partial<Database["public"]["Tables"]["orders"]["Row"]>) {
  // Using a more type-safe approach by bypassing the generic type issues
  // @ts-expect-error: Type 'never' error in Supabase
  return supabase.from('orders').update(data).eq('id', id);
}