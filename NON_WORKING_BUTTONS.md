# APEX Project - Non-Working, Dead & Placeholder Buttons List

This document lists all the buttons and interactive elements across the APEX codebase that are currently not functional, lack click handlers, act as placeholder simulations, or are candidates for cleanup/removal.

---

## 1. Completely Dead / Unwired Buttons (No Click Handlers)

| # | Location / File | Button / Element | Current Issue | Recommended Action |
|---|---|---|---|---|
| 1 | **Admin Top Header Bar**<br>`src/components/admin/AdminLayout.jsx` (Line 186) | **Notification Bell Button**<br>(`<Bell className="w-5 h-5" />` with pulsing dot) | Has **no `onClick` handler** and no popup menu. Clicking the bell does nothing. | **Fix or Remove**: Either wire it to show recent system logs/announcements or remove the button. |
| 2 | **Secondary Navbar**<br>`src/components/layout/Navbar.jsx` (Line 167) | **"Portal Sign In" Dropdown Button** | Relies purely on CSS `:hover` (`group-hover`). On touchscreens / mobile screens, tapping it **does nothing** because it lacks an `onClick` toggle handler. | **Fix**: Add an `onClick` dropdown toggle state (like in `HeaderNavbar.jsx`). |

---

## 2. Placeholder / Simulation-Only Buttons (Toast Alerts / No Real Action)

| # | Location / File | Button / Element | Current Issue | Recommended Action |
|---|---|---|---|---|
| 3 | **Coordinator Reports Tab**<br>`src/components/coordinator/tabs/ReportsTab.jsx` (Line 49) | **"Export Excel" / "Download Excel"** | Only shows a toast message: `addToast('Excel analytical spreadsheet downloaded...')`. It does **not download any file** or invoke `excelExporter`. | **Fix or Remove**: Wire to `excelExporter.exportCoordinatorSportData` or remove the button. |
| 4 | **Coordinator Fixtures Tab**<br>`src/components/coordinator/tabs/FixturesTab.jsx` (Line 10) | **"Auto Generate Knockout Bracket"** | Only triggers a static toast notification (`Automatic Knockout Fixtures bracket generated...`). It does **not create or save any tournament matches**. | **Fix or Remove**: Connect to a fixture generator engine or remove the button. |
| 5 | **Contact Support Page**<br>`src/pages/ContactPage.jsx` (Line 58) | **"Send Message" Form Button** | Shows a success toast (`Your message has been sent...`) and resets the form inputs, but **does not send an email or save to the database**. | **Fix**: Connect to backend contact endpoint or keep as frontend feedback. |

---

## 3. Static / Non-Functional UI Fields (Candidates for Removal)

| # | Location / File | Element | Current Issue | Recommended Action |
|---|---|---|---|---|
| 6 | **Admin Top Header Bar**<br>`src/components/admin/AdminLayout.jsx` (Line 173) | **"Search portal..." Input Bar** | Static input box in the header with no search state, filter, or keydown handler. | **Remove**: Can be removed to clean up the admin header. |

---

## 4. Redundant Nested Wrapper Buttons (Trigger via Bubbling)

| # | Location / File | Button / Element | Current Issue | Recommended Action |
|---|---|---|---|---|
| 7 | **Announcements Page**<br>`src/pages/AnnouncementsPage.jsx` (Line 115) | **"Read Full Circular" Button** | Lacks its own `onClick` because the outer card `<div>` already handles the click modal. | **Keep or Clean**: Functional via event bubbling, but can be converted to a styled `<span>` or given an explicit handler. |
| 8 | **Super Coordinator Dashboard**<br>`src/pages/superCoordinator/SuperCoordinatorDashboardPage.jsx` (Line 1799) | **"Open Folder" Button** | Inside a clickable card wrapper that opens the folder. | **Keep or Clean**: Functional via bubbling. |
