-- Add discount and offer columns to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS discount_percentage integer DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS offer_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_start_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS offer_end_date timestamp with time zone;

-- Create or replace function to assign admin role on signup
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if the new user's email is the admin email
  IF NEW.email = 'admin@gmail.com' THEN
    -- Insert admin role, ignore if already exists
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_admin_user_created ON auth.users;

CREATE TRIGGER on_admin_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_on_signup();