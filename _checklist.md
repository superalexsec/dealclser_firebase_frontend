# Checklist for Mobile Polish (PT-BR Focus)

Goal: Improve mobile friendliness for all pages, specifically addressing layout issues caused by longer Portuguese text, while preserving the desktop experience.

- [ ] **1. Analysis & Strategy**
    - [ ] Review key pages for potential text overflow/wrapping issues.
    - [ ] Identify fixed widths or non-responsive containers.

- [ ] **2. Navigation & Layout (`Layout.tsx`)**
    - [ ] Verify Drawer menu item text wrapping (long words like "Configurações").
    - [ ] Check AppBar title and user menu on small screens.

- [ ] **3. Settings Page (`Settings.tsx`)**
    - [ ] Fix Tabs layout: Ensure tabs are scrollable or stack on mobile (Labels like "WhatsApp Business", "Mercado Pago" can be wide).
    - [ ] Ensure form fields in settings panels stack correctly.

- [ ] **4. Client Service & Tables (`ClientService.tsx`)**
    - [ ] Optimize Client list/table for mobile (often breaks with columns like Email, Phone, ID).
    - [ ] Consider Card view for mobile instead of Table, or scrollable container.

- [ ] **5. Products Catalog (`ProductsCatalogPage.tsx`)**
    - [ ] Review Product Cards grid responsiveness.
    - [ ] Check "Add Category" / "Add Product" button grouping.

- [ ] **6. Profile & Forms (`Profile.tsx`, `Register.tsx`)**
    - [ ] Ensure form inputs use full width on mobile (`xs={12}`).
    - [ ] Check button grouping (Save, Cancel, Delete).

- [ ] **7. Calendar (`Calendar.tsx`) - Refinement**
    - [ ] Check "Verificar Disponibilidade" button length.
    - [ ] Verify Event Details dialog responsiveness.

- [ ] **8. General Polish**
    - [ ] Uniform padding/margins on mobile (standardize to `p: 2` or `p: 1.5`).
    - [ ] Ensure all text is legible and not cut off.

