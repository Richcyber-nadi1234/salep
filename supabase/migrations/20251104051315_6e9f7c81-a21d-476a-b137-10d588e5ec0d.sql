-- Create role enum
CREATE TYPE public.app_role AS ENUM ('ceo', 'manager', 'hr', 'it', 'finance', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to get user roles
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles auto-created on signup"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User roles RLS policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'ceo'));

-- Create employees table (HR section)
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  position TEXT NOT NULL,
  hire_date DATE NOT NULL,
  salary NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "HR can manage all employees"
  ON public.employees FOR ALL
  USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Employees can view own record"
  ON public.employees FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'ceo'));

-- Create leave requests table (HR section)
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own leave requests"
  ON public.leave_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own leave requests"
  ON public.leave_requests FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "HR and managers can update leave requests"
  ON public.leave_requests FOR UPDATE
  USING (public.has_role(auth.uid(), 'hr') OR public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'ceo'));

-- Create IT assets table (IT section)
CREATE TABLE public.it_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  serial_number TEXT UNIQUE,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'maintenance', 'retired')),
  purchase_date DATE,
  warranty_expiry DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.it_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "IT can manage all assets"
  ON public.it_assets FOR ALL
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Users can view all assets"
  ON public.it_assets FOR SELECT
  USING (true);

-- Create IT tickets table (IT section)
CREATE TABLE public.it_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.it_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create tickets"
  ON public.it_tickets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view own tickets"
  ON public.it_tickets FOR SELECT
  USING (auth.uid() = created_by OR auth.uid() = assigned_to OR public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "IT can manage all tickets"
  ON public.it_tickets FOR ALL
  USING (public.has_role(auth.uid(), 'it') OR public.has_role(auth.uid(), 'ceo'));

-- Create expenses table (Finance section)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'reimbursed')),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create own expenses"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own expenses"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Finance can manage all expenses"
  ON public.expenses FOR ALL
  USING (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo'));

-- Update transactions table policies to include finance role
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can create their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Finance can view all transactions"
  ON public.transactions FOR SELECT
  USING (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo') OR auth.uid() = user_id);

CREATE POLICY "Finance can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Finance can update transactions"
  ON public.transactions FOR UPDATE
  USING (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo'));

CREATE POLICY "Finance can delete transactions"
  ON public.transactions FOR DELETE
  USING (public.has_role(auth.uid(), 'finance') OR public.has_role(auth.uid(), 'ceo'));

-- Create trigger function for profile auto-creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create update timestamp triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();

CREATE TRIGGER update_it_assets_updated_at
  BEFORE UPDATE ON public.it_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();

CREATE TRIGGER update_it_tickets_updated_at
  BEFORE UPDATE ON public.it_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_transactions_updated_at();