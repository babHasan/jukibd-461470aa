
-- SMS templates table for admin-configurable Bangla messages
CREATE TABLE public.sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_status TEXT NOT NULL UNIQUE,
  template_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SMS logs table
CREATE TABLE public.sms_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_order_id TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  message_text TEXT NOT NULL,
  trigger_status TEXT NOT NULL,
  api_response JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read/write for now (admin-only auth can be added later)
ALTER TABLE public.sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to sms_templates" ON public.sms_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to sms_logs" ON public.sms_logs FOR ALL USING (true) WITH CHECK (true);

-- Insert default Bangla templates
INSERT INTO public.sms_templates (trigger_status, template_text) VALUES
  ('received', 'প্রিয় {{customer_name}}, আপনার ডিভাইস ({{device_brand}}) আমরা গ্রহণ করেছি। টিকেট নম্বর: {{ticket_number}}। সমস্যা: {{issue}}। আনুমানিক খরচ: ৳{{estimated_cost}}। ধন্যবাদ - RepairDesk'),
  ('completed', 'প্রিয় {{customer_name}}, আপনার ডিভাইস ({{device_brand}}) মেরামত সম্পন্ন হয়েছে! টিকেট: {{ticket_number}}। অনুগ্রহ করে যোগাযোগ করুন। ধন্যবাদ - RepairDesk'),
  ('picked-up', 'প্রিয় {{customer_name}}, আপনার ডিভাইস ({{device_brand}}) সফলভাবে ডেলিভারি হয়েছে। টিকেট: {{ticket_number}}। আমাদের সেবা ব্যবহার করার জন্য ধন্যবাদ! - RepairDesk');
