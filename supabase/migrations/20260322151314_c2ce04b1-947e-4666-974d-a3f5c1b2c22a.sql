
-- Expense Categories
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expense_categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage expense_categories" ON public.expense_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Income Categories
CREATE TABLE public.income_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  remarks TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.income_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read income_categories" ON public.income_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage income_categories" ON public.income_categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Expenses
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  service_provider TEXT NOT NULL DEFAULT '',
  service_provider_memo TEXT NOT NULL DEFAULT '',
  memo_no TEXT NOT NULL DEFAULT '',
  tr_no TEXT NOT NULL DEFAULT '',
  remarks TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage expenses" ON public.expenses FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

-- Incomes
CREATE TABLE public.incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.income_categories(id) ON DELETE SET NULL,
  category_name TEXT NOT NULL DEFAULT '',
  amount NUMERIC NOT NULL DEFAULT 0,
  income_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remarks TEXT NOT NULL DEFAULT '',
  tr_no TEXT NOT NULL DEFAULT '',
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read incomes" ON public.incomes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage incomes" ON public.incomes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can insert incomes" ON public.incomes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
