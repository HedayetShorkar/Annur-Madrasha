# Primary references consulted

- Supabase Edge authentication: https://supabase.com/docs/guides/functions/auth
- Supabase Auth getUser: https://supabase.com/docs/reference/javascript/auth-getuser
- Function configuration / verify_jwt: https://supabase.com/docs/guides/functions/function-configuration
- PostgreSQL functions and execution grants: https://supabase.com/docs/guides/database/functions
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security

The implementation explicitly validates user tokens with getUser and restricts service-only database functions; disabling the platform legacy JWT check does not remove application authorization. Private helpers pin search_path. These references describe infrastructure behavior; they do not verify bKash, Nagad or Rocket SMS formats. No provider format is claimed without actual owner-verified samples.
