BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL statement_timeout = '30s';
SET LOCAL idle_in_transaction_session_timeout = '5min';

WITH requested AS (
  SELECT value AS name FROM jsonb_array_elements_text(:'application_schemas'::jsonb)
  UNION SELECT 'auth'
  UNION SELECT 'storage'
), denied AS (
  SELECT 'USAGE on schema ' || r.name AS permission
  FROM requested r JOIN pg_namespace n ON n.nspname = r.name
  WHERE NOT has_schema_privilege(n.oid, 'USAGE')
  UNION ALL
  SELECT 'SELECT on ' || object_name
  FROM unnest(ARRAY[
    'pg_catalog.pg_roles', 'pg_catalog.pg_auth_members', 'pg_catalog.pg_proc',
    'pg_catalog.pg_policy', 'pg_catalog.pg_trigger', 'pg_catalog.pg_class',
    'pg_catalog.pg_attribute', 'pg_catalog.pg_default_acl', 'pg_catalog.pg_database',
    'pg_catalog.pg_extension', 'pg_catalog.pg_parameter_acl', 'storage.buckets'
  ]) object_name
  WHERE NOT has_table_privilege(object_name, 'SELECT')
  UNION ALL
  SELECT 'BYPASSRLS or table ownership for a complete storage.buckets metadata read'
  WHERE row_security_active('storage.buckets'::regclass)
  UNION ALL
  SELECT 'EXECUTE on ' || function_name
  FROM unnest(ARRAY[
    'pg_catalog.pg_export_snapshot()', 'pg_catalog.pg_get_functiondef(oid)',
    'pg_catalog.pg_get_function_identity_arguments(oid)', 'pg_catalog.pg_get_triggerdef(oid,boolean)',
    'pg_catalog.pg_get_expr(pg_node_tree,oid)', 'pg_catalog.pg_get_userbyid(oid)'
  ]) function_name
  WHERE NOT has_function_privilege(function_name, 'EXECUTE')
)
SELECT jsonb_build_object(
  'serverVersion', current_setting('server_version'),
  'serverVersionNumber', current_setting('server_version_num')::integer,
  'snapshot', CASE WHEN has_function_privilege('pg_catalog.pg_export_snapshot()', 'EXECUTE')
    THEN pg_export_snapshot() ELSE NULL END,
  'schemas', (SELECT jsonb_agg(nspname ORDER BY nspname) FROM pg_namespace
    WHERE left(nspname, 3) <> 'pg_' AND nspname <> 'information_schema'),
  'missingSchemas', (SELECT coalesce(jsonb_agg(r.name ORDER BY r.name), '[]'::jsonb)
    FROM requested r LEFT JOIN pg_namespace n ON n.nspname = r.name WHERE n.oid IS NULL),
  'missingPrivileges', (SELECT coalesce(jsonb_agg(permission ORDER BY permission), '[]'::jsonb) FROM denied)
);
