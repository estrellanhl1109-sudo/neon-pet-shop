-- Fix foreign key constraint to be deferrable
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- Add deferrable constraint
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE
DEFERRABLE INITIALLY DEFERRED;