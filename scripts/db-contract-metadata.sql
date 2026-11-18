WITH scoped AS (
  SELECT oid, nspname FROM pg_namespace
  WHERE nspname IN (SELECT value FROM jsonb_array_elements_text(:'application_schemas'::jsonb))
    OR nspname IN ('auth', 'storage')
), routines AS (
  SELECT n.nspname AS schema, p.proname AS name,
    pg_get_function_identity_arguments(p.oid) AS arguments,
    p.prokind AS kind, pg_get_userbyid(p.proowner) AS owner,
    p.prosecdef AS security_definer, p.provolatile AS volatility,
    p.proconfig AS settings, p.proacl AS acl, pg_get_functiondef(p.oid) AS definition
  FROM pg_proc p JOIN scoped n ON n.oid = p.pronamespace WHERE p.prokind <> 'a'
), triggers AS (
  SELECT n.nspname AS schema, c.relname AS relation, t.tgname AS name,
    t.tgenabled AS enabled, t.tgisinternal AS internal,
    pg_get_triggerdef(t.oid, true) AS definition
  FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
  JOIN scoped n ON n.oid = c.relnamespace
), policies AS (
  SELECT n.nspname AS schema, c.relname AS relation, p.polname AS name,
    p.polpermissive AS permissive, p.polcmd AS command,
    (SELECT jsonb_agg(CASE WHEN r = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(r) END ORDER BY r)
      FROM unnest(p.polroles) r) AS roles,
    pg_get_expr(p.polqual, p.polrelid) AS using_expression,
    pg_get_expr(p.polwithcheck, p.polrelid) AS check_expression
  FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
  JOIN scoped n ON n.oid = c.relnamespace
), relations AS (
  SELECT n.nspname AS schema, c.relname AS name, c.relkind AS kind,
    pg_get_userbyid(c.relowner) AS owner, c.relacl AS acl,
    c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
  FROM pg_class c JOIN scoped n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'v', 'm', 'S', 'f')
), column_grants AS (
  SELECT n.nspname AS schema, c.relname AS relation, a.attname AS column_name, a.attacl AS acl
  FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
  JOIN scoped n ON n.oid = c.relnamespace WHERE a.attacl IS NOT NULL AND NOT a.attisdropped
), schema_grants AS (
  SELECT n.nspname AS schema, pg_get_userbyid(n.nspowner) AS owner, n.nspacl AS acl
  FROM pg_namespace n JOIN scoped s ON s.oid = n.oid
), default_grants AS (
  SELECT pg_get_userbyid(d.defaclrole) AS role_name, n.nspname AS schema,
    d.defaclobjtype AS object_type, d.defaclacl AS acl
  FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid = d.defaclnamespace
  WHERE d.defaclnamespace = 0 OR d.defaclnamespace IN (SELECT oid FROM scoped)
), roles AS (
  SELECT rolname AS name, rolsuper AS superuser, rolinherit AS inherit,
    rolcreaterole AS create_role, rolcreatedb AS create_database, rolcanlogin AS login,
    rolreplication AS replication, rolbypassrls AS bypass_rls, rolconnlimit AS connection_limit,
    rolvaliduntil AS valid_until
  FROM pg_roles
), memberships AS (
  SELECT (to_jsonb(m) - 'oid' - 'roleid' - 'member' - 'grantor') || jsonb_build_object(
    'role', pg_get_userbyid(m.roleid), 'member', pg_get_userbyid(m.member),
    'grantor', pg_get_userbyid(m.grantor)) AS membership
  FROM pg_auth_members m
), extensions AS (
  SELECT e.extname AS name, e.extversion AS version, n.nspname AS schema
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
), buckets AS (
  -- Only bucket configuration: no owners, object names, paths, contents, or user records.
  SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets
), database_grants AS (
  SELECT pg_get_userbyid(datdba) AS owner, datacl AS acl FROM pg_database WHERE datname = current_database()
), parameter_grants AS (
  SELECT parname AS name, paracl AS acl FROM pg_parameter_acl
)
SELECT jsonb_build_object(
  'routines', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY schema, name, arguments), '[]') FROM routines r),
  'triggers', (SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY schema, relation, name), '[]') FROM triggers t),
  'policies', (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY schema, relation, name), '[]') FROM policies p),
  'relations', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY schema, name), '[]') FROM relations r),
  'columnGrants', (SELECT coalesce(jsonb_agg(to_jsonb(c) ORDER BY schema, relation, column_name), '[]') FROM column_grants c),
  'schemaGrants', (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY schema), '[]') FROM schema_grants s),
  'defaultGrants', (SELECT coalesce(jsonb_agg(to_jsonb(d) ORDER BY role_name, schema, object_type), '[]') FROM default_grants d),
  'roles', (SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY name), '[]') FROM roles r),
  'memberships', (SELECT coalesce(jsonb_agg(membership ORDER BY membership::text), '[]') FROM memberships),
  'extensions', (SELECT coalesce(jsonb_agg(to_jsonb(e) ORDER BY name), '[]') FROM extensions e),
  'buckets', (SELECT coalesce(jsonb_agg(to_jsonb(b) ORDER BY id), '[]') FROM buckets b),
  'databaseGrants', (SELECT coalesce(jsonb_agg(to_jsonb(d)), '[]') FROM database_grants d),
  'parameterGrants', (SELECT coalesce(jsonb_agg(to_jsonb(p) ORDER BY name), '[]') FROM parameter_grants p)
);
