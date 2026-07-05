---
name: ARIEL UX/UI Integration
overview: Integrate ARIEL as a global floating agent with responsive behavior (FAB on desktop, full-screen chat on mobile) and proper markdown rendering.
todos:
  - id: install-deps
    content: Install react-markdown and remark-gfm
    status: completed
  - id: create-widget
    content: Create ArielChatWidget component with FAB and responsive views
    status: completed
  - id: integrate-layout
    content: Integrate ArielChatWidget into MainLayout and update navigation
    status: completed
  - id: implement-markdown
    content: Implement markdown rendering in chat messages
    status: completed
  - id: polish-ux
    content: Final UX/UI polish and mobile testing simulation
    status: completed
isProject: false
---

# Plan: ARIEL UX/UI Integration

As a Google UX/UI engineer, I will transform the ARIEL interface from a static page into a modern, responsive, and global assistant.

## 1. Dependencies
- Install `react-markdown` and `remark-gfm` to correctly render AI responses (correcting the current markdown text format).

## 2. Global Chat Widget
- Create a new component `ArielChatWidget.tsx` in `src/frontend/components/ariel/`.
- **Floating Action Button (FAB)**:
  - Positioned at the bottom-right.
  - Uses `SmartToyIcon`.
  - Visible across all authenticated pages.
- **Responsive Chat Container**:
  - **Medium/Large Screens**: A pop-over chat window (approx. 400x600px) anchored to the bottom-right.
  - **Mobile Screens**: A full-screen dialog that mimics the Facebook Messenger experience, including a clear "Back" icon to return to the main application environment.
- **Features**:
  - Persistent chat history during the session.
  - Markdown rendering for AI responses using `react-markdown`.
  - Context awareness (displays current Household and Period).

## 3. Layout Integration
- Modify `src/frontend/layouts/MainLayout.tsx`:
  - Remove ARIEL from the sidebar navigation to reduce clutter, as it will now be accessible via the FAB.
  - Add the `ArielChatWidget` component to the main layout so it's available globally.

## 4. UI Refinement
- Update message bubbles to support markdown formatting.
- Ensure the "Return to App" action is intuitive on mobile (top-left back arrow).
- Add a "Minimize" button for the desktop pop-over.

## 5. Cleanup
- Update `src/app/(app)/ariel/page.tsx` to either redirect to home or serve as a dedicated full-screen view for the same widget logic.
