# Salon Booking App — All-Rounded PRD for TRAE Development (VibeCoding + Figma + Vercel + Supabase)

Bold takeaway: Ship a production-ready MVP in 4 weeks using a VibeCoding, single-developer workflow with TRAE IDE, powered by Next.js on Vercel and Supabase (Auth, DB, Realtime), fully aligned to the provided Figma Dev Mode UI.

## 1. Product Overview

A modern, lightweight salon booking SaaS for single and multi-location salons. Customers can browse services, select stylists, pick time slots, and book seamlessly. Salon owners manage services, staff schedules, bookings, and customer notes, with optional loyalty points. The product is optimized for rapid iteration using TRAE IDE and the VibeCoding workflow.

Scope aligns with the uploaded Figma Dev Mode UI:

- Mobile-first journey: Splash → Sign-in → Verify → Home → Service → Stylist → Date & Time → Confirmation.
    
- Management views: Bookings (Upcoming, Completed, Cancelled), Salon Details, Map View, Favourites, Profile.
    

## 2. Goals and Success Metrics

- Development:
    
    - MVP live in 4 weeks with solo dev using TRAE.
        
    - 95% design fidelity to Figma.
        
    - End-to-end booking flow implemented and deployed to Vercel.
        
- User outcomes:
    
    - Time to complete a booking ≤ 60 seconds.
        
    - Booking completion rate ≥ 85%.
        
    - NPS ≥ 40 from pilot salons.
        
- Operational:
    
    - Zero server management (Vercel + Supabase).
        
    - P99 API response time < 300 ms for core flows.
        
    - Error rate < 0.5% for booking creation.
        

## 3. Target Users and Primary Use Cases

- Salon Owner/Admin:
    
    - Configure services, prices, durations.
        
    - Manage stylists and availability.
        
    - View bookings and customer notes.
        
- Stylist:
    
    - View schedule and client notes.
        
    - Update availability blocks (phase 2).
        
- Customer:
    
    - Sign up/log in, book services and stylists.
        
    - Save favourites, manage upcoming bookings, view history.
        

Primary scenarios:

- Book a service with a preferred stylist and time.
    
- Add customer notes (e.g., color tone preference).
    
- View/edit/cancel bookings.
    
- Explore salon details and view location on the map.
    

## 4. Platform & Architecture

- Development: TRAE IDE (agentic AI coding), VibeCoding workflow for rapid iteration.
    
- Frontend: Next.js 15 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui.
    
- Backend/BaaS: Supabase (PostgreSQL, Auth, RLS, Realtime, Edge Functions when needed).
    
- Hosting: Vercel (Preview deployments, CI/CD from GitHub).
    
- State: React Server Components + Client Components, Zustand for client state in booking flow.
    
- Notifications (Phase 2): Email/SMS provider (e.g., Resend/Twilio).
    
- Maps (Phase 2 optional): Map provider (Mapbox/Google Maps).
    

Security & compliance:

- Supabase Auth with passwordless email OTP or email+password.
    
- RLS policies for row-level security.
    
- Edge runtime where suitable for latency improvements.
    
- Do not store sensitive payment info in MVP (no payments in v1).
    

## 5. Figma-to-Product Mapping

Core screens and flows (from provided Figma Dev Mode link):

- Onboarding:
    
    - Splash Screen
        
    - Sign-in Screen (email/phone)
        
    - Verify Screen (OTP)
        
- Booking Journey:
    
    - Home Screen
        
    - Service Selection (categories: cut, color, treatment)
        
    - Stylist Selection (avatar, specialty, rating)
        
    - Date & Time Selection (calendar + dynamic time slots)
        
    - Review/Confirmation with customer notes
        
- Management / Saved:
    
    - Bookings: Upcoming / Completed / Cancelled
        
    - Salon Details (hours, services, location)
        
    - Map View
        
    - Favourites (salons/stylists)
        
    - Profile
        

Design System (as implemented in Tailwind/shadcn):

- Color: Primary red (#FA5252), neutral backgrounds (#FFFFFF/#F8F9FA), text (#1A1A1A, #6B7280), border (#E5E7EB).
    
- Typography: Inter (Headings 24/32, Subtitle 18/24, Body 16/24, Caption 14/20).
    
- Spacing: 8px grid, 16/24/32 spacing increments.
    
- Components: Buttons (primary/secondary/ghost), Cards, Tabs, Bottom sheets, Modals, Calendar picker, Avatar, Tag/Chip, Rating display.
    

Responsiveness:

- Mobile-first with fluid layout.
    
- Tablet and desktop adaptive grid for dashboards and lists.
    

## 6. Feature Requirements (MVP Scope First)

P0 — Must Have

- Authentication:
    
    - Sign-in (email or email+password).
        
    - Verify via OTP (Supabase magic link/OTP).
        
    - Basic profile creation post-auth (name, phone optional).
        
- Booking Core:
    
    - Service list by category with price and duration.
        
    - Stylist list with specialty, rating, avatar.
        
    - Real-time availability: compute time slots by stylist + service duration, block conflicts.
        
    - Booking creation: save service, stylist, date, time, notes, price snapshot.
        
    - Booking management: view upcoming, completed, cancelled; cancel upcoming.
        
- Content & Views:
    
    - Salon Details: name, address, opening hours, services.
        
    - Favourites: save/remove salons/stylists.
        
    - Home with quick actions and next booking summary.
        

P1 — Should Have

- Loyalty points: accrue on completed bookings (rule: 1 point per $1 spent); show balance.
    
- Profile page: edit name, phone; view history.
    
- Map View: location preview for salon(s).
    
- Staff/Owner lightweight admin: manage services and stylists (web dashboard).
    

P2 — Nice to Have

- Notifications: email reminders (24h/2h before).
    
- PWA install prompt and offline-friendly shell.
    
- Basic analytics: bookings per day, cancellation rate.
    

Out of Scope for MVP

- Online payments and deposits.
    
- Complex staff rosters, recurring schedules.
    
- Multi-tenant billing and branded white-label.
    

## 7. Data Model (Supabase PostgreSQL)

Auth

- Supabase auth.users used for authentication.
    

Domain tables

- profiles
    
    - id (uuid, pk), user_id (uuid, unique, fk auth.users), full_name, phone, loyalty_points (int, default 0), created_at.
        
- salons
    
    - id, name, address, phone, latitude, longitude, opening_hours (jsonb), images (text[]).
        
- stylists
    
    - id, salon_id (fk), name, specialty, avatar_url, bio, rating (numeric 2,1), is_active (boolean).
        
- services
    
    - id, salon_id (fk), name, category, price (numeric), duration_minutes (int), description.
        
- bookings
    
    - id, user_id (fk profiles.user_id), salon_id, stylist_id, service_id, start_datetime (timestamptz), end_datetime (timestamptz), customer_notes (text), status (confirmed|completed|cancelled), total_price (numeric), loyalty_points_earned (int), created_at.
        
- favourites
    
    - id, user_id, target_type (salon|stylist), target_id, created_at.
        

Availability model (MVP simple approach)

- **[UPDATED]** Availability is generated on the fly by the API. The logic must perform the following checks in order:
    
    1. Start with the salon's `opening_hours` for the selected day.
        
    2. Subtract any `salon_closed_days` for the salon.
        
    3. Subtract any `stylist_time_off` blocks for that stylist.
        
    4. Subtract the time slots occupied by the stylist's existing `bookings`.
        
    5. The remaining time is then broken into chunks based on the selected `service.duration_minutes`.
        
- optional table for overrides:
    
    - stylist_time_off: id, stylist_id, start_datetime, end_datetime, reason.
        
    - salon_closed_days: id, salon_id, date, reason.
        

Row Level Security (RLS) examples

- profiles: users can select/update where user_id = auth.uid().
    
- bookings: users can read/write bookings where user_id = auth.uid(); staff can read bookings for their salon via role.
    

## 8. API Design (Next.js Route Handlers + Supabase)

All APIs authenticated (except public read endpoints where appropriate).

- GET /api/services?salonId=
    
- GET /api/stylists?salonId=&serviceId=
    
- GET /api/availability?stylistId=&date=&duration=
    
    - returns time slots for given date considering existing bookings and time off.
        
- POST /api/bookings
    
    - body: {serviceId, stylistId, salonId, start_datetime, notes}
        
    - checks conflict with transaction + advisory lock pattern.
        
- GET /api/bookings?scope=upcoming|completed|cancelled
    
- PATCH /api/bookings/:id {status}
    
- GET /api/salons/:id
    
- POST /api/favourites {targetType, targetId}
    
- DELETE /api/favourites/:id
    
- GET /api/me (profile)
    
- PATCH /api/me
    

Concurrency control

- Use a Postgres transaction and a unique partial index on (stylist_id, start_datetime) where status in ('confirmed') to prevent duplicates.
    
- Optionally, short-lived advisory lock on (stylist_id, date) per booking request.
    

## 9. UX Flow Details

Onboarding

- Splash → Sign-in → Verify → Profile setup (name/phone optional).
    

Booking

- Home → Service Selection → Stylist Selection
    
- Date & Time Selection:
    
    - Calendar control (7-day or month view per Figma).
        
    - Time slots calculated via API; disabled states rendered for taken/invalid.
        
- Confirmation:
    
    - Summary: service, stylist, date, time, price, notes.
        
    - CTA: Confirm booking → success screen.
        

Bookings Management

- Tabs: Upcoming / Completed / Cancelled.
    
- Card component with status tag and actions (View / Cancel if upcoming).
    

Favourites

- Toggle on Salon/Stylist cards.
    
- List view under Favourites.
    

Salon Details & Map

- Salon info, hours, services offered, images.
    
- Map preview (embed/static first; interactive in P1).
    

## 10. Implementation Plan with TRAE (VibeCoding)

Week 1 — Setup & Foundations

- Initialize Next.js project with TypeScript, Tailwind, shadcn/ui.
    
- Configure Supabase (Auth, DB), create tables/migrations.
    
- Import Figma tokens and component specs; scaffold shared UI components.
    
- Deploy baseline to Vercel (Preview & main).
    

Week 2 — Auth + Core Booking

- Implement Auth pages: Sign-in, Verify; profile bootstrap.
    
- Build Service and Stylist selection pages with real data.
    
- Implement availability endpoint and calendar/time slot UI.
    

Week 3 — Confirmation + Management

- Finish booking creation with conflict checks.
    
- Build Bookings tabs (Upcoming/Completed/Cancelled).
    
- Implement Favourites; Salon Details; Map preview.
    

Week 4 — Polish & Launch

- Responsive QA vs Figma; accessibility pass; error states.
    
- Add loyalty points accrual on completed bookings.
    
- Add basic email notifications for confirmation (optional P1).
    
- Production deploy; create demo accounts and seed data.
    

TRAE prompts (examples)

- “Generate React components from Figma Dev Mode for Splash, Sign-in, Verify, Home, Service Selection, Stylist Selection, Date & Time, Confirmation, Bookings (tabs), Salon Details, Map View, Favourites, Profile using Tailwind and shadcn.”
    
- “Implement Supabase Auth (email OTP), profile bootstrap, RLS policies, and API routes for services, stylists, availability, bookings (create/cancel), favourites.”
    
- “Create availability computation using stylist appointments and service duration with transaction-safe booking creation.”
    

## 11. Non-Functional Requirements

- Performance:
    
    - Core API P99 < 300 ms.
        
    - LCP < 2.0s on 4G mid-tier devices.
        
- Reliability:
    
    - Booking creation resilient to retries (idempotency key via UUID on client).
        
    - Graceful error states with actionable messages.
        
- Security:
    
    - RLS enforced for user-owned data.
        
    - **[UPDATED]** Input validation on APIs; rate limiting for auth, booking, and availability endpoints.
        
- Accessibility:
    
    - Focus states, semantic HTML, text contrast per WCAG AA.
        

## 12. Testing & QA

- Unit tests for availability and booking conflict logic.
    
- Integration tests for booking flow (auth → create → list).
    
- Visual regression checks vs Figma components (spot checks).
    
- Manual QA on mobile Safari/Chrome and desktop Chrome/Edge.
    

## 13. Analytics & Observability

- Minimal product analytics: route change events, booking started/completed, cancel actions.
    
- Logging: server-side errors with request id; client error boundary logging.
    
- Uptime: Vercel status, Supabase status; add health endpoint for basic checks.
    

## 14. Risks and Mitigations

- AI-generated code quality variance: enforce linting, type safety, and code reviews within TRAE; write tests for booking logic.
    
- Free-tier limits (Supabase/Vercel): monitor quotas; plan upgrade path.
    
- Time slot complexity: start with simple per-stylist daily availability + conflict detection; add rosters later.
    

## 15. Handover Artifacts

- Repo with:
    
    - /app routes (Next.js), /lib (supabase client, api), /components (ui, cards), /styles (tokens).
        
    - Database migrations (Supabase).
        
    - Seed script for salons, services, stylists.
        
    - .env.example with required keys.
        
- Figma-to-code mapping doc:
    
    - Component → React component file path.
        
    - Token → Tailwind config/custom CSS vars.
        

## 16. Environment Variables

- NEXT_PUBLIC_SUPABASE_URL
    
- NEXT_PUBLIC_SUPABASE_ANON_KEY
    
- SUPABASE_SERVICE_ROLE_KEY
    
- NEXT_PUBLIC_MAPS_KEY (optional in P1)
    

## 17. Acceptance Criteria (MVP)

- A new user can sign in, set profile, and complete a booking with a stylist and time.
    
- Bookings appear in Upcoming; can be cancelled; then visible in Cancelled.
    
- Favourites can be added and listed.
    
- Salon Details shows address and hours; Map preview renders.
    
- Loyalty points increase after marking a booking as completed (admin/staff flow minimal).
    

This PRD is optimized for TRAE execution: it maps Figma screens to concrete components, defines a lean Supabase schema, outlines secure APIs, and provides a week-by-week delivery plan for a solo VibeCoding workflow on Vercel and Supabase.