-- =============================================
-- SECURITY FIX: Create RLS policies for remaining tables
-- Using correct column names based on actual table structures
-- =============================================

-- Sales Order Items: Uses sales_order_id (not order_id)
CREATE POLICY "Users can view sales order items through sales orders" ON public.sales_order_items
    FOR SELECT USING (
        sales_order_id IN (
            SELECT id FROM public.sales_orders 
            WHERE organization_id = public.get_user_organization_id()
        )
    );

CREATE POLICY "Users can manage sales order items in their organization" ON public.sales_order_items
    FOR ALL USING (
        sales_order_id IN (
            SELECT id FROM public.sales_orders 
            WHERE organization_id = public.get_user_organization_id()
        )
    );

-- Fix any remaining policies that might have failed
-- Verify all tables have proper RLS enabled
-- (Previous migration already enabled RLS on all tables)