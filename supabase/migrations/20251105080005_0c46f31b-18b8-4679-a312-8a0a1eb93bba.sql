-- Fix profiles RLS policy to prevent PII exposure
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy: users can only view their own profile, or HR/CEO can view all
CREATE POLICY "Users can view own profile or HR/CEO can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'hr'::app_role) 
  OR has_role(auth.uid(), 'ceo'::app_role)
);