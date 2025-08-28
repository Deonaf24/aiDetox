# aiDetox

## Build

The build process expects Supabase credentials to be provided as environment variables:

```bash
SUPABASE_URL=https://ltjtjgdjllmbyknaygof.supabase.co SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0anRqZ2RqbGxtYnlrbmF5Z29mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxNDkxOTAsImV4cCI6MjA3MTcyNTE5MH0.tMfU0stBJZ52IKWOd7A0HGSWxXMhvXVqd9dyredUEHM npm run build
```

These values are injected at bundle time and used by the extension to connect to Supabase.
