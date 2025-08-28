# aiDetox

## Build

The build process expects Supabase credentials to be provided as environment variables:

```bash
SUPABASE_URL=your-project-url SUPABASE_ANON_KEY=your-anon-key npm run build
```

These values are injected at bundle time and used by the extension to connect to Supabase.
