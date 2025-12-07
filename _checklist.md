# Checklist for Adding PT-BR Translation

The goal is to implement Brazilian Portuguese (PT-BR) translation with minimum code changes, focusing on fixing any failed attempts and leveraging existing libraries.

## 1. Analysis
- [x] **Current State:** No i18n library installed. `date-fns` and `@mui/material` are present.
- [x] **Findings:**
    - `src/pages/Calendar.tsx` hardcodes `en-US` locale.
    - `src/pages/PaymentPage.tsx` has a commented out reference to `pt-BR`.
    - `date-fns` is the primary date library.

## 2. Implementation Steps

### Phase 1: Date & Calendar Localization (High Priority)
- [x] **Import Locale:** Import `ptBR` from `date-fns/locale/pt-BR` in `src/pages/Calendar.tsx`.
- [x] **Update Localizer:** Add `pt-BR` to the `locales` object in `src/pages/Calendar.tsx`.
- [x] **Set Default:** Set the default locale for `BigCalendar` to `pt-BR`.
- [x] **Verify Formats:** Ensure date formats (e.g., `dd/MM/yyyy`) are culturally appropriate.

### Phase 2: UI Component Localization (MUI)
- [x] **Import MUI Locale:** Import `ptBR` from `@mui/material/locale`.
- [x] **Update Theme:** Inject the `ptBR` locale into the `createTheme` call in `src/theme.ts` or `src/App.tsx`.

### Phase 3: Text Content Translation (MVP)
- [x] **Strategy:** Installed `i18next` and `react-i18next`.
- [x] **Action:** Created `src/i18n.ts`.
- [x] **Language Switcher:** Added a language switcher (EN/PT) to `src/components/Layout.tsx`.
- [x] **Calendar Translation:** Implemented `useTranslation` in `src/pages/Calendar.tsx`.

### Phase 4: Full App Translation (Current Focus)
- [ ] **Fix Default Language:** Force PT-BR as the initial default language in `src/i18n.ts` (currently defaulting to browser language/EN).
- [ ] **Landing Page:** Translate `src/pages/Landing.tsx`.
- [ ] **Settings Page:** Translate `src/pages/Settings.tsx`.
- [ ] **Client Service:** Translate `src/pages/ClientService.tsx` (Table headers, buttons).
- [ ] **Module/Message Flow:** Translate main headers and buttons in `src/pages/ModuleFlow.tsx` and `src/pages/MessageFlow.tsx`.
- [ ] **Other Pages:** Add translations for `Profile`, `Products`, `Purchases`, `Contracts` as needed for MVP coverage.

## 3. Verification
- [ ] **Build:** Run `npm run build` to ensure no errors.
- [ ] **Visual Check:** Verify app opens in Portuguese by default.
- [ ] **Visual Check:** Verify navigation to other pages shows translated content.

