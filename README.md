# SERVIAUTO

SERVIAUTO is a cloud-backed automotive repair shop operating system.

## Current build

- React + TypeScript + Vite frontend
- Responsive shop dashboard
- Customer, vehicle, repair-order, diagnostics, estimates, invoices and reports areas
- Supabase authentication client
- Supabase PostgreSQL schema
- Tenant isolation with Row Level Security
- No browser localStorage as the business-data source of truth
- Mobile-first interface
- TOPDON ArtiDiag900 integration boundary for officially supported interfaces only

## Workflow

Customer → Vehicle/VIN → Inspection → Diagnostic Scan → DTC → Diagnosis → Parts → Estimate → Approval → Repair Order → Technician → Repair → Invoice → Payment → Follow-up → Reports

## Supabase setup

1. Create/open the SERVIAUTO Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Enable Email authentication.
5. Enable Google authentication and add the application callback URL.
6. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the deployment environment.
7. Never put service-role keys or supplier/payment secrets in the frontend.

## Important

Automotive technical data, repair diagrams, vehicle images, supplier catalogs and TOPDON connectivity require authorized APIs, licensed data or supported exports. SERVIAUTO does not bypass proprietary systems.

## Production roadmap

The UI and database foundation are in place. Remaining external-service work is provider configuration: licensed repair-information data, VIN decoding/image providers, authorized supplier APIs, TOPDON-supported connectivity, payment provider and notification delivery.
