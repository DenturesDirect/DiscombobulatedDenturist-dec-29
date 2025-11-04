# Denture Clinic Workflow: Compact Design Guidelines

## Design Principles
**Approach:** Healthcare-Productivity Hybrid (Epic/Cerner meets Linear/Notion)
- Clinical Clarity: Patient safety-first information hierarchy
- Workflow Efficiency: Minimize clicks, clear visual paths
- Professional Trust: Medical-grade interface aesthetics
- Spatial Organization: Clear input/output area separation

---

## Typography

**Fonts:**
- Primary: Inter (Google Fonts) - UI, body, clinical notes
- Monospace: JetBrains Mono - timestamps, metadata

**Scale:**
```
H1: text-3xl font-semibold (patient names)
H2: text-2xl font-semibold (sections)
H3: text-xl font-medium (subsections)
Body Large: text-base (clinical notes)
Body: text-sm (secondary info)
Small: text-xs (timestamps, metadata)
Labels: text-sm font-medium uppercase tracking-wide
```

**Line Height:** `leading-tight` (headers), `leading-relaxed` (clinical notes), `leading-normal` (compact areas)

---

## Layout & Spacing

**Core Units:** 2, 3, 4, 6, 8, 12, 16 (Tailwind)
- Micro: `p-2, gap-2` (related items)
- Standard: `p-4, gap-4` (form fields, lists)
- Section: `p-6, py-8` (major divisions)
- Large: `p-12, py-16` (screen sections)

**Grid System:**
- Split-screen: `lg:grid-cols-2` (50/50)
- Left panel: `min-w-[500px] max-w-2xl`
- Right panel: `flex-1`
- Sidebar: `w-80` (320px fixed)
- Content max: `max-w-7xl`

**Responsive:** Stack vertically (mobile) → 40/60 split (tablet) → Full split-screen (desktop lg+)

---

## Core Components

### Navigation (h-16, border-b, px-6)
- Left: Logo/clinic name (`text-lg font-semibold`)
- Center: Global search (`w-96`)
- Right: Notifications, user dropdown with team member name

### Patient Sidebar (w-80, border-r)
- Search input (sticky top)
- Patient cards: `p-3 mb-2 rounded-lg border`
  - Name (`font-medium`), last visit (`text-xs`), status badge
  - Active: `border-l-4` accent
- Alphabetical headers: `text-xs uppercase tracking-wide py-1 px-3`

### Split-Screen Canvas

**Left Panel - Prompt Input (p-6):**
- Textarea: `min-h-[200px] p-4 rounded-lg border-2`
- Voice button: Top-right of textarea
- Photo upload: `border-2 border-dashed rounded-lg p-8`
- Photo grid: `grid-cols-2 gap-4` with hover delete
- Template dropdown: `text-sm` above textarea
- Actions: `mt-4 gap-3` (Generate, Clear, Save Draft)

**Right Panel - Document Preview (p-6):**
- Editable area: `prose max-w-none`
- Selection toolbar: Floating (Rewrite, Expand, Shorten, Delete)
- Edit history: Collapsible sidebar with timestamps

### Tooth Shade Display (TOP PRIORITY)
```
Position: Top of patient canvas
Style: p-4 rounded-lg border-2 mb-6
Display: text-2xl font-bold, two columns
Content: "Current Shade" | "Requested Shade"
Alert: Pulsing border when missing
```

### Forms
```
Field spacing: space-y-6
Labels: text-sm font-medium mb-2
Inputs: h-12 px-4 rounded-lg border
Textarea: min-h-32 p-4
File upload: border-dashed p-6
```

### Treatment Timeline
**Vertical View:**
```
Timeline: border-l-2
Nodes: w-6 h-6 rounded-full (connected dots)
Cards: pl-8 mb-6 p-4 rounded-lg border
Content: Name (font-medium), status badge, avatar, date, actions
Status: text-xs px-3 py-1 rounded-full
```

**Compact View:** `grid-cols-[auto_1fr_auto_auto]` with checkbox, name, member, status, date

### Clinical Photos
```
Grid: grid-cols-3 lg:grid-cols-4 gap-3
Cards: aspect-square rounded-lg
Hover: Date, delete/download icons
Click: Modal full-res view
Thumbnails: Max 400px optimized
```

### Buttons
```
Primary: h-12 px-6 rounded-lg text-base font-medium
Secondary: h-10 px-4 border-2
Icon: w-10 h-10 rounded-lg (Heroicons)
Text: No bg/border, hover underline
```

### Modals
```
Overlay: Fixed, backdrop blur
Container: max-w-2xl p-6 rounded-xl shadow-2xl
Header: text-xl font-semibold mb-4 border-b pb-4
Footer: mt-6 pt-4 border-t flex justify-end gap-3
```

### Notifications (Toast)
```
Position: Fixed bottom-right, w-96
Style: p-4 rounded-lg shadow-lg
Auto-dismiss: 4s
Types: Success, Error, Info, Warning (with icons)
```

### States
**Loading:** `w-8 h-8` spinner, centered, optional text below  
**Empty:** `py-16 text-center`, large icon (`w-16 h-16`), heading (`text-lg font-medium`), description (`text-sm max-w-md`), CTA

---

## Key Screens

### Login
- Centered card: `max-w-md p-8 rounded-xl shadow-lg`
- Logo, team member dropdown (with avatars), password, remember me

### Dashboard Layout
1. Top nav: `h-16` fixed
2. Three columns: Sidebar (`w-80`) | Input panel (`flex-1 min-w-[500px]`) | Preview (`flex-1`)
3. Bottom status: `h-12` (auto-save, word count, timestamp)

### Patient Canvas
- Header: Patient name (`text-3xl`), demographics, contact
- **Tooth Shade Card: Prominent top position**
- Tabs: Clinical Notes, Photos, Timeline, Tasks, Documents
- Tab content: `p-6 space-y-6`

### Photo Upload
- Drop zone: `min-h-64`, large target
- Preview: `grid-cols-3`
- AI analysis: `p-6 rounded-lg prose`
- Action: "Add to Patient Notes"

---

## Images & Media

**Clinical Photos:**
- Thumbnails: 400px max (performance)
- Grid: Square aspect ratio
- Modal: Full resolution
- Metadata: Date, camera info overlay

**Avatars:**
- Compact: `w-8 h-8` circular
- Profile: `w-12 h-12` circular
- Fallback: Initials

---

## Animations

**Minimal, performance-focused:**
```
Hover: scale-105 or opacity change
Loading: Rotating spinner only
Toasts: Slide-in bottom-right
Modals: Fade backdrop, scale-up content
Buttons: scale-95 on press
Selection: Smooth highlight
Toolbar: Fade-in 200ms delay
Auto-save: 1s pulse
```

**No:** Scroll-triggered, decorative animations

---

## Accessibility & Standards

- WCAG AA contrast ratios minimum
- Keyboard navigation: All interactive elements accessible
- Focus indicators: Visible outline on all focusable elements
- ARIA labels: Forms, buttons, modals
- Screen reader: Semantic HTML, proper heading hierarchy
- Error states: Clear messaging with icons
- Form validation: Inline, real-time feedback

---

## Color Guidance

Use semantic color naming (to be defined in theme):
- Primary: Brand/clinical actions
- Secondary: Supporting actions
- Success: Completed milestones, confirmations
- Warning: Missing data, alerts
- Error: Validation failures, critical alerts
- Neutral: Borders, backgrounds, disabled states

Ensure medical-grade professional palette with sufficient contrast for clinical environments.