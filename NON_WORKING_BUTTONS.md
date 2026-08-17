# APEX Project - Non-Working, Dead & Placeholder Buttons List

This document lists all the buttons and interactive elements across the APEX codebase that were audited for functionality, click handlers, simulations, or cleanup.

---

## 1. Completely Dead / Unwired Buttons (Resolved)

| # | Location / File | Button / Element | Issue & Resolution | Status |
|---|---|---|---|---|
| 1 | **Admin Top Header Bar**<br>`src/components/admin/AdminLayout.jsx` | **Notification Bell Button** | Removed fake pulsing dot and wired directly to `/admin/activity` (System Activity & Audit Logs) with accessible labels and tooltips. | ✅ **RESOLVED** |
| 2 | **Secondary Navbar**<br>`src/components/layout/Navbar.jsx` | **"Portal Sign In" Dropdown Button** | Added explicit `isSignInOpen` toggle state, click-outside and touchstart listeners, closing on route change, and `aria-expanded`. Works on mobile touchscreens and desktop. | ✅ **RESOLVED** |

---

## 2. Placeholder / Simulation-Only Buttons (Resolved)

| # | Location / File | Button / Element | Issue & Resolution | Status |
|---|---|---|---|---|
| 3 | **Coordinator Reports Tab**<br>`src/components/coordinator/tabs/ReportsTab.jsx` | **"Export Excel" / "Download Excel"** | Connected to live database via `coordinatorApi.getRegistrations()` & `coordinatorApi.getMatches()`, generating real multi-sheet `.xlsx` files via `exportToExcel` with text-safe phone/roll numbers. | ✅ **RESOLVED** |
| 4 | **Coordinator Fixtures Tab**<br>`src/components/coordinator/tabs/FixturesTab.jsx` | **"Auto Generate Knockout Bracket"** | Removed fake toast button from prerelease. Print and PDF download buttons retained and verified. | ✅ **RESOLVED** |
| 5 | **Contact Support Page**<br>`src/pages/ContactPage.jsx` | **"Send Message" Form Button** | Dispatches real `mailto:` email client inquiry pre-filled with subject, sender details, and message body directly to `support.apex2026@university.edu`. | ✅ **RESOLVED** |

---

## 3. Static / Non-Functional UI Fields (Resolved)

| # | Location / File | Element | Issue & Resolution | Status |
|---|---|---|---|---|
| 6 | **Admin Top Header Bar**<br>`src/components/admin/AdminLayout.jsx` | **"Search portal..." Input Bar** | Removed dead search bar and unused `Search` icon to maintain a clean, balanced header. | ✅ **RESOLVED** |

---

## 4. Redundant Nested Wrapper Buttons (Resolved)

| # | Location / File | Button / Element | Issue & Resolution | Status |
|---|---|---|---|---|
| 7 | **Announcements Page**<br>`src/pages/AnnouncementsPage.jsx` | **"Read Full Circular" Button** | Converted nested button into styled `<span>` indicator with `group-hover` and `pointer-events-none` inside the clickable card `<div>`. | ✅ **RESOLVED** |
| 8 | **Super Coordinator Dashboard**<br>`src/pages/superCoordinator/SuperCoordinatorDashboardPage.jsx` | **"Open Folder" Button** | Converted nested button into styled `<span>` indicator with `group-hover` and `pointer-events-none` inside the clickable folder card `<div>`. | ✅ **RESOLVED** |

