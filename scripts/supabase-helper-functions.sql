-- Helper functions for database validation
-- These functions can be created in Supabase to help with table validation

-- Function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get table columns information
CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    character_maximum_length integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.column_name::text,
        c.data_type::text,
        c.is_nullable::text,
        c.column_default::text,
        c.character_maximum_length::integer
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
    AND c.table_name = $1
    ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Function to get table constraints
CREATE OR REPLACE FUNCTION get_table_constraints(table_name text)
RETURNS TABLE (
    constraint_name text,
    constraint_type text,
    column_name text,
    foreign_table_name text,
    foreign_column_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tc.constraint_name::text,
        tc.constraint_type::text,
        kcu.column_name::text,
        ccu.table_name::text as foreign_table_name,
        ccu.column_name::text as foreign_column_name
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
        AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
    AND tc.table_name = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to get table indexes
CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
RETURNS TABLE (
    indexname text,
    indexdef text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.indexname::text,
        i.indexdef::text
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
    AND i.tablename = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to check RLS status
CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = $1
        AND c.relrowsecurity = true
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get table policies
CREATE OR REPLACE FUNCTION get_table_policies(table_name text)
RETURNS TABLE (
    policyname text,
    permissive text,
    roles text[],
    cmd text,
    qual text,
    with_check text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.policyname::text,
        p.permissive::text,
        p.roles::text[],
        p.cmd::text,
        p.qual::text,
        p.with_check::text
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename = $1;
END;
$$ LANGUAGE plpgsql;

-- Function to execute dynamic SQL (for creating tables if needed)
CREATE OR REPLACE FUNCTION execute_sql(sql text)
RETURNS void AS $$
BEGIN
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats(table_name text)
RETURNS TABLE (
    table_size text,
    row_count bigint,
    last_vacuum timestamp,
    last_analyze timestamp
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pg_size_pretty(pg_total_relation_size(quote_ident($1)))::text as table_size,
        (SELECT reltuples::bigint FROM pg_class WHERE relname = $1) as row_count,
        (SELECT last_vacuum FROM pg_stat_user_tables WHERE relname = $1) as last_vacuum,
        (SELECT last_analyze FROM pg_stat_user_tables WHERE relname = $1) as last_analyze;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_columns(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_constraints(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_indexes(text) TO authenticated;
GRANT EXECUTE ON FUNCTION check_rls_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_policies(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_stats(text) TO authenticated;

-- Grant execute permission for execute_sql to service role only (for security)
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;