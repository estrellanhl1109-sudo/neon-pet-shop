-- Fix user_roles foreign key and triggers

-- Ensure the foreign key exists correctly
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_roles_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
  END IF;
END $$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for handling new users (profiles + default role)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create trigger for assigning admin role
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_on_signup();