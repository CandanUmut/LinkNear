# 🔗 LinkNear — Proximity-Based Professional & Interest Network

## Hackathon Roadmap & Agent Playbook

-----

## Name Suggestions

|Name         |Vibe                                                        |
|-------------|------------------------------------------------------------|
|**LinkNear** |Professional, clear, memorable — “link with people near you”|
|**ProxiMeet**|Proximity + meeting, clean                                  |
|**NearField**|Tech-forward, references NFC concept                        |
|**Meshwork** |Network mesh metaphor, unique                               |
|**Locale**   |Simple, elegant, location-first                             |

Pick one (or name it later). Roadmap uses **LinkNear** as placeholder.

-----

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              GitHub Pages (Static)               │
│  React + TypeScript + Vite + Tailwind CSS        │
│  SPA with client-side routing (hash router)      │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────────────┐
│              Supabase Backend                    │
│  ┌───────────┐ ┌───────────┐ ┌───────────────┐  │
│  │   Auth    │ │ Postgres  │ │   Realtime    │  │
│  │  (Google  │ │   (DB)    │ │ (subscriptions│  │
│  │   OAuth)  │ │           │ │   stretch)    │  │
│  └───────────┘ └───────────┘ └───────────────┘  │
│  ┌───────────┐ ┌───────────┐                    │
│  │  Storage  │ │    RPC    │                    │
│  │ (avatars) │ │(geo query)│                    │
│  └───────────┘ └───────────┘                    │
└─────────────────────────────────────────────────┘
```

**Key decisions:**

- **Vite + React + TS + Tailwind** — fast builds, GitHub Pages compatible
- **Hash router** (`/#/discover`) — required for GitHub Pages SPA routing
- **Supabase PostGIS** — `earth_distance` or `cube` extension for proximity queries
- **Google OAuth via Supabase Auth** — one-click sign in
- **No SSR, no serverless functions** — pure static + Supabase client SDK

-----

## Database Schema (Supabase Postgres)

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  headline TEXT, -- e.g. "Automation Engineer | Python | IoT"
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}', -- ['python', 'react', 'firmware']
  interests TEXT[] DEFAULT '{}', -- ['AI', 'hiking', 'open-source']
  looking_for TEXT, -- 'cofounder', 'study-buddy', 'mentor', 'networking'
  latitude FLOAT,
  longitude FLOAT,
  location_name TEXT, -- "San Jose, CA" or "SJSU Campus"
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT, -- optional intro message
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- RPC for nearby users (earth_distance based)
CREATE OR REPLACE FUNCTION get_nearby_profiles(
  user_lat FLOAT,
  user_lng FLOAT,
  radius_km FLOAT DEFAULT 10,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  skills TEXT[],
  interests TEXT[],
  looking_for TEXT,
  latitude FLOAT,
  longitude FLOAT,
  location_name TEXT,
  is_online BOOLEAN,
  last_seen TIMESTAMPTZ,
  distance_km FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.headline,
    p.bio,
    p.avatar_url,
    p.skills,
    p.interests,
    p.looking_for,
    p.latitude,
    p.longitude,
    p.location_name,
    p.is_online,
    p.last_seen,
    ROUND(
      (earth_distance(
        ll_to_earth(user_lat, user_lng),
        ll_to_earth(p.latitude, p.longitude)
      ) / 1000)::numeric, 2
    )::FLOAT AS distance_km
  FROM profiles p
  WHERE p.id != current_user_id
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND earth_distance(
      ll_to_earth(user_lat, user_lng),
      ll_to_earth(p.latitude, p.longitude)
    ) <= radius_km * 1000
  ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, owners can update
CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Own profile update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Connections: involved parties can read, sender can insert
CREATE POLICY "View own connections" ON connections
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Send connection" ON connections
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Update received connection" ON connections
  FOR UPDATE USING (auth.uid() = receiver_id);
```

-----

## Match Score Algorithm (Client-Side)

Simple and transparent for hackathon:

```typescript
function calculateMatchScore(myProfile: Profile, otherProfile: Profile): number {
  let score = 0;
  const maxScore = 100;

  // Shared skills (0-40 points)
  const sharedSkills = myProfile.skills.filter(s =>
    otherProfile.skills.map(x => x.toLowerCase()).includes(s.toLowerCase())
  );
  score += Math.min(sharedSkills.length * 10, 40);

  // Shared interests (0-35 points)
  const sharedInterests = myProfile.interests.filter(i =>
    otherProfile.interests.map(x => x.toLowerCase()).includes(i.toLowerCase())
  );
  score += Math.min(sharedInterests.length * 7, 35);

  // Looking for same thing (0-15 points)
  if (myProfile.looking_for && myProfile.looking_for === otherProfile.looking_for) {
    score += 15;
  }

  // Online bonus (0-10 points)
  if (otherProfile.is_online) {
    score += 10;
  }

  return Math.min(score, maxScore);
}
```

-----

## Pages / Routes

|Route           |Page           |Description                                                  |
|----------------|---------------|-------------------------------------------------------------|
|`/#/`           |Landing        |Hero + sign in with Google                                   |
|`/#/onboarding` |Profile Setup  |Name, headline, bio, skills, interests, looking_for, location|
|`/#/discover`   |Discover (main)|Map/list of nearby profiles with match scores                |
|`/#/profile/:id`|Profile View   |Full profile + send connection button                        |
|`/#/connections`|My Connections |Pending / accepted connections list                          |
|`/#/settings`   |Settings       |Edit profile, update location, sign out                      |

-----

## Agent Task Breakdown

### AGENT 1 — “Infra” (Supabase + Project Scaffold)

**Time estimate: 25 min**

**Tasks:**

1. Create Supabase project (or use existing)
1. Run the SQL schema above (tables, RPC, RLS policies)
1. Enable Google OAuth in Supabase dashboard
1. Configure Supabase Storage bucket for avatars (public)
1. Scaffold Vite + React + TS + Tailwind project
1. Install dependencies: `@supabase/supabase-js`, `react-router-dom`
1. Set up Supabase client (`src/lib/supabase.ts`)
1. Set up hash router skeleton with all routes
1. Set up GitHub Pages deployment (`vite.config.ts` base path, gh-pages package)
1. Create `.env` with Supabase URL + anon key
1. Set up auth context provider with Google OAuth flow

**Claude Code Prompt for Agent 1:**

```
You are building the infrastructure for "LinkNear" — a proximity-based professional
networking app for a hackathon. Stack: Vite + React + TypeScript + Tailwind CSS +
Supabase. Deploys to GitHub Pages.

TASKS:
1. Scaffold the Vite project: `npm create vite@latest linknear -- --template react-ts`
2. Install deps: @supabase/supabase-js, react-router-dom, tailwindcss, autoprefixer, postcss
3. Configure Tailwind with a modern color palette (NOT purple gradient slop)
4. Create src/lib/supabase.ts — init Supabase client from env vars
5. Create src/contexts/AuthContext.tsx — React context that:
   - Wraps app in auth state
   - Provides signInWithGoogle() using supabase.auth.signInWithOAuth({ provider: 'google' })
   - Provides signOut()
   - Tracks session/user
   - On first login, creates profile row via upsert
6. Create src/App.tsx with HashRouter and routes:
   /#/ → LandingPage
   /#/onboarding → OnboardingPage
   /#/discover → DiscoverPage
   /#/profile/:id → ProfilePage
   /#/connections → ConnectionsPage
   /#/settings → SettingsPage
   Protected routes redirect to / if not authenticated.
7. Create stub pages (just <h1> with page name) for all routes
8. Configure vite.config.ts with base: '/linknear/' for GitHub Pages
9. Add deploy script in package.json using gh-pages
10. Create a useLocation hook in src/hooks/useLocation.ts that:
    - Uses browser Geolocation API
    - Falls back to manual input
    - Returns { latitude, longitude, locationName, error, loading }

Use environment variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

DO NOT use Inter, Roboto, or purple gradients. Use a distinctive design system.
```

-----

### AGENT 2 — “Profile & Onboarding” (Forms + Data)

**Time estimate: 25 min**

**Depends on:** Agent 1 scaffold complete

**Tasks:**

1. Build OnboardingPage — multi-step form:
- Step 1: Name + headline + avatar upload
- Step 2: Skills picker (tag input, suggest common ones)
- Step 3: Interests picker (tag input)
- Step 4: What are you looking for? (select)
- Step 5: Location (auto-detect + manual override)
1. Build SettingsPage — edit existing profile
1. Build ProfilePage — view any user’s full profile
1. Create src/hooks/useProfile.ts — CRUD operations for profiles table
1. Avatar upload to Supabase Storage
1. Skills/interests should have predefined suggestions + custom input

**Claude Code Prompt for Agent 2:**

```
You are building the profile system for "LinkNear" — a proximity-based professional
networking app. The Vite + React + TS + Tailwind scaffold and Supabase auth context
already exist (see src/contexts/AuthContext.tsx and src/lib/supabase.ts).

TASKS:
1. Create src/hooks/useProfile.ts:
   - getProfile(userId) — fetch from profiles table
   - updateProfile(data) — upsert own profile
   - uploadAvatar(file) — upload to Supabase Storage 'avatars' bucket, return public URL

2. Build src/pages/OnboardingPage.tsx — a polished multi-step form:
   Step 1: Full name, headline (short tagline), avatar photo upload
   Step 2: Skills — tag-style input. Suggestions: Python, JavaScript, TypeScript, React,
           Node.js, AI/ML, Data Science, DevOps, Firmware, Hardware, Design, Marketing,
           Product Management, etc. Allow custom.
   Step 3: Interests — tag-style input. Suggestions: Open Source, Startups, AI Ethics,
           Hiking, Gaming, Music, Photography, Cooking, Fitness, Reading, Travel, etc.
           Allow custom.
   Step 4: Looking for — radio/cards: Cofounder, Study Buddy, Mentor, Mentee,
           Collaborator, Networking, Friends
   Step 5: Location — show auto-detected coords + map pin + "Or type your location"
           manual override. Use the useLocation hook from src/hooks/useLocation.ts.
   Final: Save to Supabase profiles table, redirect to /#/discover

3. Build src/pages/SettingsPage.tsx — same fields as onboarding but pre-filled,
   with save button. Include sign-out button.

4. Build src/pages/ProfilePage.tsx — public profile view:
   - Avatar, name, headline, bio
   - Skills as tags, interests as tags
   - Looking for badge
   - Location name + distance (if viewing someone else)
   - "Connect" button (handled by Agent 3)

Style: Use the existing Tailwind config. Make it feel polished — good spacing, smooth
transitions between steps, progress indicator. Use tag chips for skills/interests.
DO NOT use generic styling. Make it distinctive and professional.
```

-----

### AGENT 3 — “Discovery & Connections” (Core Feature)

**Time estimate: 30 min**

**Depends on:** Agent 1 + Agent 2 complete

**Tasks:**

1. Build DiscoverPage — the main screen:
- Fetch nearby profiles using `get_nearby_profiles` RPC
- Display as card grid with: avatar, name, headline, distance, match score
- Radius filter slider (1km - 50km)
- Sort by: distance / match score
- Filter by: looking_for type
- Click card → navigate to profile
1. Build match score calculation (client-side)
1. Build ConnectionsPage:
- Tabs: Pending (received) / Sent / Connected
- Accept/decline buttons on pending
- Connection cards link to profiles
1. Connection request flow:
- “Connect” button on ProfilePage and DiscoverPage cards
- Optional intro message modal
- Supabase insert into connections table
- Status management (pending → accepted/declined)
1. Create src/hooks/useConnections.ts
1. Create src/hooks/useDiscover.ts

**Claude Code Prompt for Agent 3:**

```
You are building the discovery and connections system for "LinkNear" — a proximity-based
professional networking app. The scaffold, auth, profiles, and Supabase are already set up.

CONTEXT:
- Supabase has a `get_nearby_profiles` RPC function that takes (user_lat, user_lng, radius_km, current_user_id) and returns profiles with distance_km
- Supabase has a `connections` table with (sender_id, receiver_id, status, message)
- Profile data includes: skills TEXT[], interests TEXT[], looking_for TEXT

TASKS:
1. Create src/utils/matchScore.ts:
   - calculateMatchScore(myProfile, otherProfile) → 0-100
   - Shared skills: up to 40 points (10 per match, cap 40)
   - Shared interests: up to 35 points (7 per match, cap 35)
   - Same looking_for: 15 points
   - Is online: 10 points

2. Create src/hooks/useDiscover.ts:
   - fetchNearby(lat, lng, radiusKm) — calls get_nearby_profiles RPC
   - Returns profiles with distance + calculated match score
   - Handles loading/error states

3. Create src/hooks/useConnections.ts:
   - sendConnection(receiverId, message?) — insert into connections
   - getMyConnections() — fetch all where I'm sender or receiver
   - respondToConnection(connectionId, status) — update to accepted/declined
   - getConnectionStatus(userId) — check if already connected/pending

4. Build src/pages/DiscoverPage.tsx:
   - On mount: get user location, fetch nearby profiles
   - Card grid layout (responsive: 1 col mobile, 2-3 cols desktop)
   - Each card: avatar, name, headline, "2.3 km away", match score badge (color coded),
     quick "Connect" button
   - Top bar: radius slider (1-50km), sort dropdown (distance/match score),
     filter by looking_for
   - Empty state: "No one nearby yet — try expanding your radius"
   - Cards are clickable → /#/profile/:id

5. Build src/pages/ConnectionsPage.tsx:
   - Tab bar: Received (pending) | Sent | Connected
   - Received tab: cards with Accept/Decline buttons
   - Sent tab: cards showing "Pending..." status
   - Connected tab: cards with "View Profile" button
   - Each card: avatar, name, headline, connection message if any
   - Empty states per tab

6. Add "Connect" button to ProfilePage (import from Agent 2's work):
   - Shows different states: "Connect" / "Pending..." / "Connected ✓" / "Accept Request"
   - On click: modal for optional intro message, then sends

Style: Match the existing design system. Discovery page should feel like the hero page —
this is the main experience. Make cards feel alive with subtle hover effects.
Match score badge: 80-100 green, 50-79 yellow, 0-49 gray.
```

-----

### AGENT 4 — “Landing Page & Polish” (First Impression)

**Time estimate: 20 min**

**Depends on:** Agent 1 scaffold

**Tasks:**

1. Build LandingPage — hero section with:
- App name + tagline
- “Sign in with Google” button
- Feature highlights (3 cards: Discover, Match, Connect)
- How it works section
- Footer
1. Build shared layout components:
- Navbar (logo, nav links, avatar dropdown)
- Mobile bottom tab bar
- Loading spinner
- Tag/chip component
1. Global styles and Tailwind theme refinement
1. Responsive design pass on all pages
1. 404 page

**Claude Code Prompt for Agent 4:**

```
You are building the landing page and shared UI components for "LinkNear" — a
proximity-based professional networking app. Vite + React + TS + Tailwind.

DESIGN DIRECTION: Think "professional but warm." NOT corporate blue. NOT purple gradient.
Try something like: warm neutrals + a bold accent (coral, teal, amber), or a dark theme
with vibrant highlights. Use a distinctive Google Font pairing — something with character.

TASKS:
1. Build src/pages/LandingPage.tsx:
   - Hero: App name (large, distinctive type), tagline like "Find your people. Right here."
     or "Connect with professionals and creators around you."
   - Animated or illustrated hero visual (CSS art, SVG, or creative layout)
   - "Sign in with Google" CTA button (uses AuthContext)
   - If already logged in, redirect to /#/discover
   - 3 feature cards below hero:
     • 📍 Discover — "Find professionals and creators near your location"
     • 🎯 Match — "See compatibility scores based on shared skills & interests"
     • 🤝 Connect — "Send a connection request and start collaborating"
   - "How it works" section: 3 steps (Sign up → Set your interests → Discover nearby)
   - Footer with GitHub link

2. Build src/components/Layout.tsx — wraps authenticated pages:
   - Top navbar: logo/name on left, nav links (Discover, Connections, Settings), avatar on right
   - Mobile: bottom tab bar with icons (Discover, Connections, Profile)
   - Clean, minimal chrome — content is king

3. Build shared components:
   - src/components/TagChip.tsx — reusable skill/interest tag
   - src/components/MatchBadge.tsx — score display (color-coded circle/badge)
   - src/components/LoadingSpinner.tsx
   - src/components/EmptyState.tsx — icon + message + optional CTA
   - src/components/Avatar.tsx — round image with fallback initials

4. Build src/pages/NotFoundPage.tsx — friendly 404

Make the landing page MEMORABLE. This is a hackathon demo — first impression matters.
Use CSS animations, creative typography, and a bold color palette.
```

-----

## Execution Timeline (2 Hours)

```
TIME        AGENT 1 (Infra)     AGENT 2 (Profile)    AGENT 3 (Discover)   AGENT 4 (UI)
─────────── ─────────────────── ──────────────────── ──────────────────── ────────────────
0:00-0:25   Scaffold + DB +     (waiting)            (waiting)            Landing page +
            Auth + Router +                                               Layout + shared
            Supabase setup                                                components

0:25-0:50   Help debug /        Onboarding flow +    (waiting)            Polish landing +
            deploy pipeline     Settings + Profile                        responsive pass
                                page

0:50-1:20   Integration         Fix profile bugs     Discovery page +     Connect button
            testing             + avatar upload      Match scoring +      modal + UI tweaks
                                                     Connections page

1:20-1:45   Deploy to GH Pages  Final profile        Final discover +     Full responsive
            + env vars          polish               connection flow      pass + animations

1:45-2:00   ──────────── FULL INTEGRATION + BUG FIXES + DEMO PREP ────────────────
```

-----

## Critical Setup Steps (Do First!)

### Supabase Project Setup

1. Go to supabase.com → New Project
1. Note the Project URL and anon key
1. SQL Editor → Run the schema SQL above
1. Authentication → Providers → Enable Google
- You need Google Cloud Console OAuth credentials
- Set redirect URL to your GitHub Pages URL
1. Storage → Create bucket “avatars” → Set to public

### GitHub Pages Setup

1. Create repo `linknear` (or your chosen name)
1. In `vite.config.ts`: `base: '/linknear/'`
1. `package.json` script: `"deploy": "vite build && gh-pages -d dist"`
1. After first deploy: repo Settings → Pages → Source: gh-pages branch

### Google OAuth Setup

1. Google Cloud Console → Create project
1. OAuth consent screen → External
1. Credentials → OAuth 2.0 Client ID → Web application
1. Authorized redirect URIs:
- `https://<project-ref>.supabase.co/auth/v1/callback`
- `http://localhost:5173` (for dev)
1. Copy Client ID and Secret into Supabase Auth → Google provider

-----

## Seed Data (For Demo)

```sql
-- Run after schema, use fake UUIDs for demo profiles
-- In real app, profiles are created via auth flow

INSERT INTO profiles (id, full_name, headline, bio, skills, interests, looking_for, latitude, longitude, location_name, is_online) VALUES
(uuid_generate_v4(), 'Alex Chen', 'ML Engineer at DeepMind', 'Building neural nets by day, hiking by weekend', ARRAY['Python','PyTorch','MLOps','Kubernetes'], ARRAY['AI Ethics','Hiking','Open Source','Photography'], 'collaborator', 37.3382, -121.8863, 'San Jose, CA', true),
(uuid_generate_v4(), 'Sara Kim', 'UX Designer & Researcher', 'Human-centered design advocate', ARRAY['Figma','User Research','Prototyping','CSS'], ARRAY['Design Systems','Accessibility','Yoga','Travel'], 'cofounder', 37.3361, -121.8906, 'Downtown San Jose', true),
(uuid_generate_v4(), 'Marcus Johnson', 'Full Stack Dev | React + Node', 'Building products that matter', ARRAY['React','TypeScript','Node.js','PostgreSQL'], ARRAY['Startups','Gaming','Music Production','Fitness'], 'networking', 37.3500, -121.9100, 'Santa Clara', false),
(uuid_generate_v4(), 'Priya Patel', 'Data Scientist @ Netflix', 'Stats nerd, coffee lover', ARRAY['Python','R','SQL','Tableau','Statistics'], ARRAY['Data Viz','Reading','Cooking','AI Ethics'], 'mentor', 37.3230, -121.9200, 'Campbell, CA', true),
(uuid_generate_v4(), 'Jordan Lee', 'CS Student at SJSU', 'Looking for study buddies and internship tips', ARRAY['Java','Python','React','Git'], ARRAY['Algorithms','Gaming','Anime','Hackathons'], 'study-buddy', 37.3352, -121.8811, 'SJSU Campus', true),
(uuid_generate_v4(), 'Emily Torres', 'Product Manager | B2B SaaS', 'Bridging tech and business', ARRAY['Product Strategy','Agile','SQL','Analytics'], ARRAY['Startups','Public Speaking','Running','Podcasts'], 'networking', 37.3700, -121.9220, 'Sunnyvale, CA', false);
```

-----

## Stretch Goals (If Time Permits)

1. **Real-time “online now” indicator** — Supabase Realtime subscription on profiles.is_online
1. **Simple chat** — New `messages` table + Supabase Realtime for accepted connections
1. **Profile search** — Text search by name/skills across all profiles (not just nearby)
1. **Map view** — Show profiles on an actual map (Leaflet.js or Mapbox, both free tier)
1. **Notification badges** — Pending connection count on nav icon

-----

## Tech Stack Summary

|Layer      |Technology                          |
|-----------|------------------------------------|
|Frontend   |Vite + React 18 + TypeScript        |
|Styling    |Tailwind CSS 3                      |
|Routing    |react-router-dom (HashRouter)       |
|Backend    |Supabase (Postgres + Auth + Storage)|
|Geo queries|PostGIS earthdistance extension     |
|Auth       |Google OAuth via Supabase           |
|Hosting    |GitHub Pages                        |
|Deployment |gh-pages npm package                |

-----

## File Structure

```
linknear/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── Avatar.tsx
│   │   ├── EmptyState.tsx
│   │   ├── Layout.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── MatchBadge.tsx
│   │   ├── TagChip.tsx
│   │   └── ConnectionModal.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useConnections.ts
│   │   ├── useDiscover.ts
│   │   ├── useLocation.ts
│   │   └── useProfile.ts
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── ConnectionsPage.tsx
│   │   ├── DiscoverPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── SettingsPage.tsx
│   ├── utils/
│   │   └── matchScore.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```
