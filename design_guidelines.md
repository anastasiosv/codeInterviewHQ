# Design Guidelines: Online Coding Interview Platform

## Design Approach

**Selected Approach:** Design System (Productivity-Focused)

**Primary Inspiration:** VSCode + Linear + Notion hybrid
- VSCode's editor-centric layout and panel system
- Linear's clean typography and minimal chrome
- Notion's collaborative presence indicators

**Core Principle:** Zero-distraction collaborative coding environment that feels professional and trustworthy.

---

## Typography

**Font Stack:**
- Primary: 'Inter' (UI elements, headings) - weights 400, 500, 600
- Code: 'JetBrains Mono' (editor content) - weight 400
- Load via Google Fonts CDN

**Type Scale:**
- Page titles: text-2xl (24px), font-semibold
- Section headers: text-lg (18px), font-medium  
- Body text: text-sm (14px), font-normal
- Code editor: text-sm (14px), monospace
- Small labels/metadata: text-xs (12px)

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, and 8 consistently
- Component padding: p-4 or p-6
- Section gaps: gap-4 or gap-6
- Margins: m-2, m-4, m-8

**Grid Structure:**
- Desktop: Two-panel split (60/40 or 50/50 adjustable)
- Left: Code editor (dominant)
- Right: Console output + participants list
- Mobile: Stack vertically with tabbed interface

---

## Component Library

### Navigation Header
- Full-width, fixed top bar (h-14)
- Left: Platform logo + session ID display
- Center: Language selector dropdown + execution controls
- Right: Share button (primary) + participant avatars (max 4 visible)
- Bottom border separator

### Code Editor Panel
- Full-height editor area with line numbers
- Top toolbar: Language selector, font size controls
- Syntax highlighting via Monaco Editor or CodeMirror
- Collaborative cursors with user name tags
- Line number gutter on left (w-12)

### Console/Output Panel
- Split into tabs: "Output" and "Participants"
- Tab bar height: h-10
- Console output: Monospace font, auto-scroll
- Participant list: Avatar + name + active cursor line indicator
- Execution status banner when code runs

### Share Modal
- Centered overlay (max-w-lg)
- Large copy-link input field with one-click copy button
- QR code display for mobile joining
- Close on backdrop click

### Execution Controls
- Play button (primary action, prominent)
- Stop button (when running)
- Clear output (secondary)
- Status indicator (idle/running/error)

---

## Interaction Patterns

**Real-time Indicators:**
- Typing indicators show which line users are on
- Cursor color-coded per participant (system assigns)
- Subtle pulse animation on active cursors (1s duration)
- Last edit timestamp on hover

**Responsive Behavior:**
- Desktop (1024px+): Side-by-side panels with resizable divider
- Tablet (768px-1023px): 70/30 split, collapsible console
- Mobile (<768px): Fullscreen tabs - swipe between editor/console

---

## Images

**No hero images needed.** This is a pure application interface.

**Icons:** Use Heroicons (outline style) via CDN for all UI elements:
- Play/stop controls
- Share link icon
- User avatars (placeholder)
- Settings gear
- Copy clipboard

---

## Accessibility

- Keyboard shortcuts for all major actions (documented in help panel)
- High contrast mode for code editor
- Focus indicators on all interactive elements (ring-2)
- ARIA labels for status messages and participant actions
- Screen reader announcements for code execution events

---

## Layout Constraints

- Maximum content width: Full viewport (no container constraints)
- Minimum viewport support: 375px mobile width
- Editor occupies remaining height after fixed header (calc(100vh - 3.5rem))
- No empty space - panels fill available area
- Resizable divider between panels (desktop only)