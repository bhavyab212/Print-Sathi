-- ============================================================
-- RPC: admin_create_shop
-- Allows super admins to create a shop for any user bypassing RLS
-- ============================================================

create or replace function public.admin_create_shop(
  owner_uuid uuid,
  shop_name text,
  shop_slug text,
  shop_phone text,
  shop_area text
) returns json as $$
declare
  new_shop_id uuid;
begin
  -- Security check: only super admin is allowed
  if not exists (
    select 1 from public.admin_users where user_id = auth.uid()
  ) then
    raise exception 'Access Denied: Only super admins can create shops';
  end if;

  -- Insert shop
  insert into public.shops (owner_id, name, slug, phone, area)
  values (owner_uuid, shop_name, shop_slug, shop_phone, shop_area)
  returning id into new_shop_id;

  -- Insert default rate cards
  insert into public.rate_cards (shop_id, item_type, label, price, sort_order) values
    (new_shop_id, 'bw_single', 'B&W Single Side', 2.00, 0),
    (new_shop_id, 'bw_double', 'B&W Double Side', 3.00, 1),
    (new_shop_id, 'color_single', 'Color Single Side', 10.00, 2),
    (new_shop_id, 'color_double', 'Color Double Side', 15.00, 3),
    (new_shop_id, 'passport_set', 'Passport Photo Set', 50.00, 4),
    (new_shop_id, 'lamination', 'Lamination', 20.00, 5),
    (new_shop_id, 'spiral_binding', 'Spiral Binding', 40.00, 6);

  return json_build_object('success', true, 'shop_id', new_shop_id);
exception when others then
  return json_build_object('success', false, 'error', SQLERRM);
end;
$$ language plpgsql security definer;
