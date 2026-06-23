# Seedling Design System (Upgraded)

A minimal, high-productivity design system for grant discovery and management. Inspired by the clarity of Notion and the functional density of Linear, refined for an organic, human-centric domain.

## Core Principles
- **Data-Forward**: Information is prioritized over decoration. Visual noise is aggressively eliminated.
- **High Precision**: Strict adherence to the 8px grid and tabular data alignment.
- **Serious Professionalism**: A limited, high-contrast palette anchored by Moss Green, supported by a premium Zinc-toned neutral scale.
- **True Dark Mode**: Built on cool-toned Zinc to reduce eye strain, avoiding cheap-looking pure blacks and pure whites.
- **Native-Feel Mobile**: Touch-optimized interfaces with safe-area awareness and bottom-sheet architectures.

## Typography
**Fonts**: Satoshi (Headings/Display), General Sans (UI/Body).  
**Base Grid**: 8px

| Element | Font | Size | Weight | Tracking | Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Hero Display | Satoshi | 64px | 700 | -0.02em | Sentence |
| Page Title (H1) | Satoshi | 40px | 700 | -0.015em | Sentence |
| Section Title (H2) | Satoshi | 24px | 600 | -0.01em | Sentence |
| Card Title (H3) | Satoshi | 16px | 600 | 0em | Sentence |
| Body Text | General Sans | 15px | 400 | 0em | Sentence |
| UI Label / Nav | General Sans | 13px | 500 | 0.01em | Sentence |
| Table Header | General Sans | 11px | 600 | 0.05em | UPPERCASE |
| Eyebrow Label | General Sans | 10px | 600 | 0.1em | UPPERCASE |
| Badge / Tag | General Sans | 11px | 500 | 0.02em | Sentence |

*Note: All numerical data must use `font-variant-numeric: tabular-nums` to ensure perfect vertical alignment in tables.*

## Color System

### Brand & Action
- **Primary (Moss Green)**: `#2D5016`
- **Primary Hover**: `#1E3810`
- **Primary Dark Mode**: `#4A7C25` (Vibrant Moss — lightened to maintain contrast against dark backgrounds)
- **Primary Hover Dark Mode**: `#5B9330`
- **Accent Tint (Subtle)**: `#F4F7F0` (For large active backgrounds in Light Mode)
- **Accent Tint (Strong)**: `#EAF2E0` (For badges and high-contrast highlights in Light Mode)
- **Accent Tint (Dark Mode)**: `rgba(74, 124, 37, 0.15)` (Low-opacity RGBA over dark surfaces to prevent muddy colors)

### Neutral Scale (Light Mode — Zinc-Toned)
- **Text Primary**: `#18181B` (Softer than pure black, reduces eye strain)
- **Text Secondary**: `#71717A` (High legibility, clear hierarchy)
- **Text Tertiary / Placeholder**: `#A1A1AA`
- **Border / Divider**: `#E4E4E7` (Used for structural lines)
- **Subtle Divider**: `#F4F4F5` (Used for data table rows)
- **Surface (Cards/Modals)**: `#FFFFFF`
- **App Shell (Sidebar)**: `#FAFAFA`
- **Page Background**: `#F4F4F5` (Creates subtle contrast with white cards)

### Neutral Scale (Dark Mode — Zinc-Toned)
- **Page Background**: `#18181B` (Deep Zinc — provides depth without the harshness of pure black)
- **Surface (Cards/Modals)**: `#27272A` (Lighter Zinc to ensure cards look elevated)
- **Text Primary**: `#F4F4F5` (Off-White — never use pure white to prevent halation/glowing text)
- **Text Secondary**: `#A1A1AA` (Medium Zinc)
- **Border / Divider**: `#3F3F46` (Subtle Zinc)

### Status Tokens
- **Strong Match / Success**: Light: Bg `#EAF2E0`, Text `#2D5016` | Dark: Bg `rgba(74,124,37,0.15)`, Text `#5B9330`
- **Expiring / Warning**: Light: Bg `#FEF3E2`, Text `#9A5B00` | Dark: Bg `rgba(154,91,0,0.15)`, Text `#D97706`
- **Archived / Muted**: Light: Bg `#F4F4F5`, Text `#71717A` | Dark: Bg `#27272A`, Text `#A1A1AA`

## Components

### Buttons
- **Primary**: 6px radius, moss green background, white text. `transition-colors duration-150`.
- **Ghost (Light)**: 6px radius, transparent background, text `#18181B` (Dark Mode: `#F4F4F5`). Hover state: background `#F4F4F5` (Dark Mode: `#3F3F46`). No border needed.
- **Secondary (Outline)**: 6px radius, 1px border `#E4E4E7` (Dark: `#3F3F46`), surface background, primary text. Hover state: border `#A1A1AA`.

### Cards & Panels
- **Container**: Surface background, 1px border, 12px corner radius. 
- **Shadow**: No heavy drop shadows. Use a micro-shadow for depth: `box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04)`. (Dark mode: shadows are largely disabled, rely on the lighter `#27272A` surface color for elevation).
- **Padding**: 24px standard, 16px for dense data widgets.

### Inputs
- **Field**: 1px border, 6px radius, 14px General Sans text. Surface background.
- **Focus**: `outline: 2px solid #2D5016; outline-offset: -1px;` (Dark Mode: `outline: 2px solid #4A7C25; outline-offset: -1px;`). Inset rings look cleaner than outer glows.

### Data Tables
- **Header**: App Shell background, 11px uppercase labels, Text Secondary. No vertical dividers.
- **Rows**: 48px height (tighter for higher data density), 1px Subtle Divider bottom border. Hover state: App Shell background.

### Sidebar Navigation (Desktop)
- **Width**: 240px.
- **Item Radius**: 6px (Pill shape).
- **Active State**: Background Accent Tint, Text Primary Brand, Font weight `500`. No hard left border; the background pill creates the boundary.
- **Inactive State**: Transparent background, Text Secondary. Hover: Background Subtle Divider, Text Primary.

## Responsive & Mobile Implementation

### Touch Targets & Safe Areas
- **Minimum Touch Target**: Every interactive element (buttons, dropdowns, table rows) MUST be a minimum of `44px x 44px` on mobile screens, expanding paddings if necessary.
- **Safe Area Insets**: The UI must respect iOS safe areas. Use `padding-bottom: env(safe-area-inset-bottom);` (or Tailwind's `pb-safe`) for all bottom-anchored components.

### Mobile Navigation & Actions
- **Bottom Navigation Bar**: At `< 768px`, the sidebar disappears and converts into a fixed bottom navigation rail containing icon-centric actions.
- **Floating Action Button (FAB)**: The "New Application" FAB (seed-shaped) detaches from the sidebar on mobile and floats fixed on the bottom right. It must sit completely above the bottom navigation bar and respect the safe area.
    * *Shape rule:* `border-radius: 60% 40% 55% 45% / 50% 45% 55% 50%;`

### Mobile Architecture
- **Bottom Sheets over Modals**: On desktop, complex actions (like "New Project") open in a center-screen modal. On mobile, these MUST convert into a slide-up bottom sheet (drawer) attached to the bottom edge of the screen for native ergonomic feel.
- **Stacked Layouts**: Split panels (like the Draft Editor) stack vertically. Data tables collapse into card-based list views to prevent horizontal scrolling.