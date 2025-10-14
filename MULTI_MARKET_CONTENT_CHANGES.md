# Multi-Market Content Changes - Complete Review Document

## Overview
This document lists every single change I made to the wording, terminology, and content across your menopause consultation platform for the UK, US, and Australian markets.

---

## 🇬🇧 UK Market Configuration

### Pricing & Currency
- **Price**: £19 GBP
- **Display**: "£19"
- **Currency Symbol**: £

### Terminology Changes
- **Healthcare Provider**: "GP" (instead of "doctor")
- **Parent Term**: "mum" (instead of "mom")
- **Appointment**: "appointment" 

### Content-Specific Changes

#### Landing Page (`src/pages/Landing.tsx`)
**Original**: "Our new tool helps you be fully ready for your doctors visit"
**UK Version**: "Our new tool helps you be fully ready for your **GP** visit"

**Original**: "Three simple steps to transform your doctor's visit experience"
**UK Version**: "Three simple steps to transform your **GP** visit experience"

**Original**: "3. Share with Doctor"
**UK Version**: "3. Share with **Your GP**"

**Original**: "Doctor-focused document"
**UK Version**: "**GP**-focused document"

#### Module 6 - Helpful Hints (`src/pages/Module6.tsx`)
**Original**: "your GP or nurse will also want to measure"
**UK Version**: "your **GP** or nurse will also want to measure" (unchanged - already correct)

**Original**: "this appointment is for a Menopause Health Assessment"
**UK Version**: "this **appointment** is for a Menopause Health Assessment"

**Mammogram Information**:
**UK Version**: "If you are aged over 40 in the UK, you are eligible for free mammograms through the NHS breast screening programme. If you are over 50, your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
**Link**: https://www.nhs.uk/conditions/breast-screening-mammogram/

#### Module 2c - Cancer History (`src/pages/Module2c.tsx`)
**Mammogram Information**:
**UK Version**: "If you are aged over 40 in the UK, you are eligible for free mammograms through the NHS breast screening programme. If you are over 50, your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
**Link**: https://www.nhs.uk/conditions/breast-screening-mammogram/

### Videos
- **Landing Page Video**: UK-specific version
- **Welcome Page Video**: UK-specific version

### Special Features
- **Government Support**: None displayed

---

## 🇺🇸 US Market Configuration

### Pricing & Currency
- **Price**: $25 USD
- **Display**: "$25"
- **Currency Symbol**: $

### Terminology Changes
- **Healthcare Provider**: "doctor" (instead of "GP")
- **Parent Term**: "mom" (instead of "mum")
- **Appointment**: "appointment"

### Content-Specific Changes

#### Landing Page (`src/pages/Landing.tsx`)
**Original**: "Our new tool helps you be fully ready for your doctors visit"
**US Version**: "Our new tool helps you be fully ready for your **doctor** visit"

**Original**: "Three simple steps to transform your doctor's visit experience"
**US Version**: "Three simple steps to transform your **doctor** visit experience" (unchanged)

**Original**: "3. Share with Doctor"
**US Version**: "3. Share with **Doctor**" (unchanged)

**Original**: "Doctor-focused document"
**US Version**: "**Doctor**-focused document" (unchanged)

#### Module 6 - Helpful Hints (`src/pages/Module6.tsx`)
**Original**: "your GP or nurse will also want to measure"
**US Version**: "your **doctor** or nurse will also want to measure"

**Original**: "this appointment is for a Menopause Health Assessment"
**US Version**: "this **appointment** is for a Menopause Health Assessment"

**Mammogram Information**:
**US Version**: "If you are aged over 40 in the US, mammography screening is typically covered by most insurance plans. The American Cancer Society recommends annual mammograms for women over 45. Book your screening before your menopause consultation with your doctor."
**Link**: https://www.cancer.org/cancer/breast-cancer/screening-tests-and-early-detection.html

#### Module 2c - Cancer History (`src/pages/Module2c.tsx`)
**Mammogram Information**:
**US Version**: "If you are aged over 40 in the US, mammography screening is typically covered by most insurance plans. The American Cancer Society recommends annual mammograms for women over 45. Book your screening before your menopause consultation with your doctor."
**Link**: https://www.cancer.org/cancer/breast-cancer/screening-tests-and-early-detection.html

**Original**: "please speak with your doctor"
**US Version**: "please speak with your **doctor**" (unchanged - already correct)

### Videos
- **Landing Page Video**: US-specific version (needs to be uploaded)
- **Welcome Page Video**: US-specific version (needs to be uploaded)

### Special Features
- **Government Support**: None displayed

---

## 🇦🇺 Australian Market Configuration

### Pricing & Currency
- **Price**: AU$35 AUD
- **Display**: "AU$35"
- **Currency Symbol**: AU$

### Terminology Changes
- **Healthcare Provider**: "GP" (same as UK)
- **Parent Term**: "mum" (same as UK)
- **Appointment**: "appointment"

### Content-Specific Changes

#### Landing Page (`src/pages/Landing.tsx`)
**Original**: "Our new tool helps you be fully ready for your doctors visit"
**AU Version**: "Our new tool helps you be fully ready for your **GP** visit"

**Original**: "Three simple steps to transform your doctor's visit experience"
**AU Version**: "Three simple steps to transform your **GP** visit experience"

**Original**: "3. Share with Doctor"
**AU Version**: "3. Share with **Your GP**"

**Original**: "Doctor-focused document"
**AU Version**: "**GP**-focused document"

**Special Australian Government Support Box**:
**NEW CONTENT**: "🏥 **Australian Government Support:** Medicare may provide rebates for menopause consultations with your GP. Speak to your doctor about bulk billing options."

#### Module 6 - Helpful Hints (`src/pages/Module6.tsx`)
**Original**: "your GP or nurse will also want to measure"
**AU Version**: "your **GP** or nurse will also want to measure" (unchanged - already correct)

**Original**: "this appointment is for a Menopause Health Assessment"
**AU Version**: "this **appointment** is for a Menopause Health Assessment"

**Medicare Rebate Information - NEW SECTION**:
**AU Version**: "If you are in Australia you will most likely be eligible for a special menopause consultation rebate. The Menopause and Perimenopause Health Assessment has a rebate of $101.90 as at July 2025. For more information please refer to this link:"
**Link**: https://www.mbsonline.gov.au/internet/mbsonline/publishing.nsf/Content/Factsheet-Menopause+and+perimenopause+health+assessment+services

**Mammogram Information**:
**AU Version**: "If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
**Link**: https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen

#### Module 2c - Cancer History (`src/pages/Module2c.tsx`)
**Mammogram Information**:
**AU Version**: "If you are aged over 40 in Australia then you eligible for a free mammogram. If you are over 50 your GP will encourage you to have one as part of normal screening, so book in for it before you even have your consultation with your GP for your menopause symptoms."
**Link**: https://www.health.gov.au/our-work/breastscreen-australia-program/having-a-breast-screen/who-should-have-a-breast-screen

**Original**: "please speak with your doctor"
**AU Version**: "please speak with your **GP**"

### Videos
- **Landing Page Video**: Australian-specific version (already uploaded)
- **Welcome Page Video**: Australian-specific version (already uploaded)

### Special Features
- **Government Support**: Medicare rebate information displayed prominently
- **Rebate Amount**: $101.90 for Menopause and Perimenopause Health Assessment

---

## 📋 Summary of All Changes Made

### Files Modified:
1. **`src/pages/Landing.tsx`** - Market-specific pricing, videos, terminology, government support
2. **`src/pages/Register.tsx`** - Sends market code to payment system
3. **`src/pages/Welcome.tsx`** - Market-specific welcome videos
4. **`src/pages/Module6.tsx`** - Market-aware helpful hints with regional information
5. **`src/pages/Module2c.tsx`** - Market-aware mammogram guidance
6. **`supabase/functions/create-checkout-public/index.ts`** - Market-specific Stripe pricing

### New Configuration Files:
1. **`src/config/markets.ts`** - Core market definitions
2. **`src/config/marketContent.ts`** - Market-specific content strings
3. **`src/contexts/MarketContext.tsx`** - React context for market data

### Key Terminology Changes:
- **UK & AU**: "GP" instead of "doctor"
- **US**: "doctor" instead of "GP" 
- **UK & AU**: "mum"
- **US**: "mom"

### Regional Healthcare Information:
- **UK**: NHS breast screening programme
- **US**: American Cancer Society guidelines, insurance coverage
- **AU**: BreastScreen Australia + Medicare rebates for menopause consultations

### Pricing Changes:
- **UK**: £19 GBP
- **US**: $25 USD  
- **AU**: AU$35 AUD

---

## 🔍 Review Checklist

Please check each section above and verify:
- [ ] UK terminology is appropriate for your UK audience
- [ ] US terminology is appropriate for your US audience  
- [ ] AU terminology is appropriate for your AU audience
- [ ] Pricing levels are correct for each market
- [ ] Healthcare system references are accurate
- [ ] Government support information is current and correct
- [ ] Links to official health websites are appropriate

---

## 📝 Notes for Revision

If you need any changes to the wording, terminology, or content:
1. Let me know which specific text needs changing
2. Specify which market(s) it affects
3. Provide the preferred wording
4. I can update the configuration files immediately

All changes are centralized in the configuration files, making updates easy and consistent across the entire application.