export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  area: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
}
