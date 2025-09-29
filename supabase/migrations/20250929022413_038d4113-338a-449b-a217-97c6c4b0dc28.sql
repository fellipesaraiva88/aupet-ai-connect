-- Enable RLS and add secure org-scoped policies for whatsapp_contacts + auto org trigger
-- 1) Ensure RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'whatsapp_contacts'
  ) THEN
    RAISE EXCEPTION 'Table public.whatsapp_contacts does not exist';
  END IF;
END$$;

ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;

-- 2) Create policies if missing
DO $$
BEGIN
  -- SELECT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'whatsapp_contacts' AND policyname = 'whatsapp_contacts_org_select'
  ) THEN
    CREATE POLICY "whatsapp_contacts_org_select"
      ON public.whatsapp_contacts
      FOR SELECT
      USING (organization_id = public.get_user_organization_id());
  END IF;

  -- INSERT policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'whatsapp_contacts' AND policyname = 'whatsapp_contacts_org_insert'
  ) THEN
    CREATE POLICY "whatsapp_contacts_org_insert"
      ON public.whatsapp_contacts
      FOR INSERT
      WITH CHECK (organization_id = public.get_user_organization_id());
  END IF;

  -- UPDATE policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'whatsapp_contacts' AND policyname = 'whatsapp_contacts_org_update'
  ) THEN
    CREATE POLICY "whatsapp_contacts_org_update"
      ON public.whatsapp_contacts
      FOR UPDATE
      USING (organization_id = public.get_user_organization_id())
      WITH CHECK (organization_id = public.get_user_organization_id());
  END IF;

  -- Optional DELETE (admin-only) - keep strict if needed
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'whatsapp_contacts' AND policyname = 'whatsapp_contacts_admin_delete'
  ) THEN
    CREATE POLICY "whatsapp_contacts_admin_delete"
      ON public.whatsapp_contacts
      FOR DELETE
      USING (
        public.can_access_organization_data_optimized(organization_id) AND public.is_admin()
      );
  END IF;
END$$;

-- 3) Attach auto-organization trigger (does nothing if already set)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'whatsapp_contacts' AND t.tgname = 'set_org_id_whatsapp_contacts'
  ) THEN
    CREATE TRIGGER set_org_id_whatsapp_contacts
      BEFORE INSERT ON public.whatsapp_contacts
      FOR EACH ROW
      EXECUTE FUNCTION public.set_organization_id_trigger();
  END IF;
END$$;
