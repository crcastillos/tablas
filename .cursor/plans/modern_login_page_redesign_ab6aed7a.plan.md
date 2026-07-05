---
name: Modern Login Page Redesign
overview: Redesign the login page to a modern, single-page split layout inspired by the "tablas" branding and PDF documentation.
todos:
  - id: create-logo
    content: Create logo-tablas.svg in public folder
    status: completed
  - id: refactor-login-page
    content: Refactor LoginPage.tsx with split layout and branding section
    status: completed
  - id: refactor-register-page
    content: Update RegisterPage.tsx for visual consistency
    status: completed
  - id: apply-branding-content
    content: Apply PDF-inspired colors and storytelling content to the branding section
    status: completed
isProject: false
---

# Plan: Modern Login Page Redesign (tablas)

As a Google UI/UX engineer, I will transform the current login page into a high-converting, professional single-page experience that communicates the "tablas" value proposition.

## 1. Visual Identity & Assets
- **Logo**: Create a custom SVG logo for "tablas" in `monolith-next/public/logo-tablas.svg`.
- **Color Palette**: 
  - **Trust Blue**: `#0D47A1` (Primary)
  - **Growth Green**: `#2E7D32` (Secondary)
  - **Neutral White/Gray**: `#FFFFFF`, `#F4F6F8`
- **Typography**: Utilize Roboto for a clean, modern look.

## 2. Layout Architecture
- **Desktop**: 60/40 Split Screen.
  - **Left Section (Branding)**: 
    - Gradient background (`#0D47A1` to `#1565C0`).
    - Large "tablas" logo and slogan: "Entiende - Planifica - Crece".
    - Value proposition cards: "Certeza financiera", "Gestión de dinero existente, comprometido, reservado y disponible".
  - **Right Section (Auth)**:
    - Clean white background.
    - Vertically centered login form.
- **Mobile**: Single column, branding on top (minimized), form below.

## 3. Component Implementation
- **LoginPage.tsx**: 
  - Refactor to use a split `Box` layout.
  - Add a "BrandingSection" component for the left side.
  - Enhance the `Paper` component for the login form with better padding and shadow.
- **RegisterPage.tsx**: 
  - Apply the same layout for consistency.

## 4. Content Strategy (from PDF)
- **Objective**: "Sistema de gestión financiera para individuos o grupos familiares".
- **Storytelling**: "Dar certeza financiera en el mes a la familia".
- **Key Concepts**: Highlight the distinction between Existing, Committed, Reserved, and Available money.

## 5. Technical Details
- Use MUI `Grid` or `Box` with `flex` for the split layout.
- Implement responsive breakpoints using `useMediaQuery`.
- Ensure smooth transitions between Login and Register views.
