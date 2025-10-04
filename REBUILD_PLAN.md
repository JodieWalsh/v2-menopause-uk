# Menopause UK App Rebuild Plan

## Project Overview
Rebuilding the menopause assessment web application to eliminate Lovable sync issues and create a clean, maintainable codebase that can be replicated for UK, US, and AU/NZ markets.

## Current Issues Identified
1. **Lovable sync problems** - changes not deploying reliably
2. **Over-complex authentication** - PaymentSuccess polling issues
3. **Caching conflicts** - debugging code not visible
4. **Auth token refresh errors** - 400 Bad Request on refresh_token

## What's Working Perfectly (PRESERVE)
- ✅ **Supabase backend** - user creation, subscriptions, webhooks
- ✅ **Stripe payments** - discount codes (97% working = £19 → £0.38)
- ✅ **Webhook flow** - creates users ONLY after payment
- ✅ **Modified Greene Scale** - clinical scoring algorithm
- ✅ **54 assessment questions** - validated medical framework
- ✅ **PDF document generation** - professional output

## Assessment Structure (DO NOT CHANGE)

### Module Breakdown
1. **Module 1: "Your Symptom Snapshot"** (26 questions)
   - Hot flushes, headaches, tiredness, joint/muscle pains
   - Depression, anxiety, mood fluctuations, irritability
   - Sleep patterns, sexual health, brain fog
   - Severity scale: None/Mild/Moderate/Severe
   - Top 3 symptoms priority text field

2. **Module 2A: Medical Background** (4 questions)
   - Chronic diseases, medications, supplements, allergies

3. **Module 2B: Gynaecological History** (11 questions)
   - Periods, contraception, pregnancies, procedures

4. **Module 2C: Family Cancer History** (5 questions)
   - Breast and bowel cancer family history

5. **Module 2D: Health History** (8 questions)
   - Cardiovascular, bone, and mental health

6. **Module 3: Investigations** - Medical tests
7. **Module 4: Medical Treatments** - Treatment preferences  
8. **Module 5: Your Questions** - Open text
9. **Module 6: Helpful Hints** - Information only

### Data Architecture
- **Storage**: Supabase `user_responses` table
- **Schema**: `user_id`, `question_id`, `response_value`, `response_type`, `module_name`
- **Progress**: `user_progress` table tracks completion
- **Resume capability**: Users can edit previous modules

### Modified Greene Scale (CRITICAL)
- **21 questions mapped** from Module 1
- **Scoring**: 0=None, 1=Mild, 2=Moderate, 3=Severe
- **Output**: Professional table for clinical progress tracking
- **Location**: `supabase/functions/generate-document/index.ts` lines 114-166

## Technical Decisions Made

### Authentication Flow (SIMPLIFIED)
**Problem**: Complex polling for subscriptions after payment
**Solution**: Immediate sign-in attempt in PaymentSuccess
- Store credentials in localStorage during registration
- Sign in user immediately upon return from Stripe
- Skip complex webhook polling if sign-in succeeds

### Payment Flow (WORKING)
- Registration → `create-checkout-public` function
- Stores user data in Stripe metadata (NOT in Supabase)
- User created ONLY after successful payment via webhook
- Discount codes apply properly (98off = 97% discount working)

### Function Deployment Issues
- `create-checkout-public` vs `create-checkout-v2` confusion
- Lovable serving cached/old function versions
- Solution: Deploy directly to Supabase, bypass Lovable

## Multi-Region Strategy

### Core (Universal) Elements
- All 54 assessment questions
- Modified Greene Scale calculation
- Document generation framework
- Payment/user management system
- Progress tracking and navigation

### Localizable Elements
- **Currency**: £19 → $25 USD → $35 AUD
- **Healthcare Terms**: GP → Primary Care Physician
- **Screening Programs**: NHS → CDC → Australian Health  
- **Rebate Info**: Medicare AU$101.90 → US insurance → UK NHS
- **Medical Terminology**: Cervical screening → Pap smear
- **Videos**: Region-specific educational content

## Document Output (VALUE PROPOSITION)
Users pay for professional medical consultation document containing:
1. **Top 3 symptoms** (patient priorities)
2. **Modified Greene Scale table** (clinical scoring)
3. **Complete health history** (organized for doctors)
4. **Appointment preparation tips** (practical guidance)
5. **Progress tracking framework** (follow-up measurements)

## Technical Stack for Rebuild
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Existing Supabase (no changes needed)
- **Payments**: Existing Stripe setup (no changes needed)
- **Development**: Claude Code + Cursor
- **Deployment**: Vercel (auto-deploy from GitHub)
- **Domain**: Point Hostinger domain to Vercel

## Supabase Functions (KEEP AS-IS)
- `stripe-webhook` - creates users after payment ✅
- `create-checkout-public` - handles payments and discounts ✅
- `generate-document` - PDF creation ✅
- `send-welcome-email-idempotent` - email delivery ✅

## Key Insights from Debugging
1. **Webhook works perfectly** - creates user with ID d92d4e05-d3d5-4e97-8ff8-64515f812eb0
2. **Subscription created** - with proper stripe_session_id
3. **Email fails** - but user/subscription creation succeeds
4. **PaymentSuccess polling** - times out finding subscription
5. **ProtectedRoute** - finds no authenticated user, redirects to login
6. **Core issue**: Authentication handoff, not webhook failure

## Lovable Backup Strategy
- Current Lovable app remains at `preview--v2-menopause-uk.lovable.app`
- GitHub repo preserved with all history
- Supabase/Stripe unchanged (shared between versions)
- New version deployed to Vercel first
- Domain switched only when new version perfect
- Instant rollback capability maintained

## Success Criteria for Rebuild
1. **Registration → Payment → Welcome** flow works reliably
2. **All 54 questions** collected with proper validation
3. **Progress tracking** with breadcrumbs and resume capability
4. **Modified Greene Scale** calculated correctly
5. **Professional PDF** generated and emailed
6. **Discount codes** work (97% discount = £0.38)
7. **Mobile responsive** design
8. **Multi-region ready** architecture

## Next Steps
1. Create clean React + Vite project
2. Set up Tailwind + shadcn/ui
3. Implement simplified authentication
4. Port assessment modules with exact question preservation
5. Connect to existing Supabase backend
6. Test payment flow thoroughly
7. Deploy to Vercel
8. Configure domain pointing

## Contact Information
- **Hostinger Domain**: Purchased and ready for pointing
- **Supabase Project**: ppnunnmjvpiwrrrbluno.supabase.co
- **Stripe Account**: Connected and configured
- **Current URL**: preview--v2-menopause-uk.lovable.app (backup)