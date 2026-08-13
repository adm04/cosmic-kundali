---
name: supabase
description: Best practices and reference guidelines for working with Supabase database, REST API, Auth, and Storage in frontend applications.
---

# Supabase Development Guide

## Project Credentials
- **Project URL**: `https://qvvgiayrwagpcrluegot.supabase.co`
- **Publishable Key**: `sb_publishable_F9-HQwvO02BIVwbgTmrY7w_Imb3fw9X`

## Recommended Patterns
1. **REST API Queries**:
   - `GET /rest/v1/table_name?select=*`
   - `POST /rest/v1/table_name` with headers `Prefer: return=representation`
   - Always include headers: `apikey` and `Authorization: Bearer <KEY>`
2. **Table Schema**:
   - `id`: `uuid default gen_random_uuid() primary key`
   - `created_at`: `timestamptz default now()`
   - Store JSON data in `jsonb` columns.
