---
name: Kinetic Finance
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0edec'
  surface-container-high: '#ebe7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#514250'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#837281'
  outline-variant: '#d5c1d2'
  surface-tint: '#9a25ae'
  primary: '#7e0092'
  on-primary: '#ffffff'
  primary-container: '#9c27b0'
  on-primary-container: '#ffcaff'
  inverse-primary: '#f9abff'
  secondary: '#8b5000'
  on-secondary: '#ffffff'
  secondary-container: '#ff9800'
  on-secondary-container: '#653900'
  tertiary: '#695f00'
  on-tertiary: '#ffffff'
  tertiary-container: '#b9ad4d'
  on-tertiary-container: '#474000'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd6fe'
  primary-fixed-dim: '#f9abff'
  on-primary-fixed: '#35003f'
  on-primary-fixed-variant: '#7b008f'
  secondary-fixed: '#ffdcbe'
  secondary-fixed-dim: '#ffb870'
  on-secondary-fixed: '#2c1600'
  on-secondary-fixed-variant: '#693c00'
  tertiary-fixed: '#f2e57e'
  tertiary-fixed-dim: '#d5c965'
  on-tertiary-fixed: '#201c00'
  on-tertiary-fixed-variant: '#4f4800'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  stat-lg:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  stat-sm:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  margin-mobile: 1.25rem
  gutter: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 1.5rem
---

## Brand & Style

The design system is built for the high-velocity, mobile-first lifestyle of college students. It prioritizes clarity and encouragement over complex financial jargon, transforming budget management from a chore into a rewarding daily habit. 

The aesthetic is **Modern & Clean**, characterized by generous whitespace, vibrant data visualization, and a conversational interface. It leverages "Smart Simplicity"—using bold typography to highlight essential numbers while keeping secondary actions tucked away until needed. The emotional response is one of confidence and control, reducing the "financial anxiety" often associated with student life through friendly UI patterns and rewarding micro-interactions.

## Colors

The palette is anchored by a deep **Royal Purple** for primary actions and brand presence, paired with an **Accent Orange** to draw attention to opportunities, alerts, and "nudges." 

The system utilizes a specialized **Category Palette** designed for instant visual recognition in spending charts and list items. 
- **Functional Use:** Use the primary purple for navigation and main CTA buttons. Use the accent orange sparingly for rewards, goal achievements, or urgent reminders.
- **Backgrounds:** Maintain a clean, white base (`#FFFFFF`) with soft, cool-gray backgrounds (`#F8F9FA`) for card grouping to ensure data legibility and a sense of "freshness."

## Typography

This design system uses a dual-font strategy to balance approachability with precision.
- **Inter** is the primary typeface, used for all narrative content, headers, and UI controls. It provides a friendly, contemporary feel that scales perfectly on mobile screens.
- **JetBrains Mono** is reserved for numerical data, currency, and timestamps. Its monospaced nature ensures that columns of numbers align perfectly in lists and that financial "stats" feel technical and accurate.

**Hierarchy Rule:** Always use `headline-xl` for the main account balance. Use `stat-lg` for large transaction amounts and `label-caps` for small meta-data like "Transaction ID" or "Category."

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for narrow viewports. On mobile, the system uses a single-column stack with a standard **20px (1.25rem) side margin**. 

**Spacing Principles:**
- All components follow an **8px (1-unit)** baseline grid to maintain vertical rhythm.
- Use `stack-lg` to separate distinct functional areas (e.g., between the "Balance Card" and "Recent Transactions").
- Use `stack-sm` for internal card padding and grouping related labels with their inputs.
- For desktop viewports, content is capped at a **max-width of 480px** or expanded into a 2-column layout (Sidebar + Main) to maintain the mobile-first "handheld" feel.

## Elevation & Depth

This design system utilizes **Tonal Layering** combined with **Ambient Shadows** to create a soft, approachable sense of depth.

- **Level 0 (Surface):** The main background of the app. Flat and neutral.
- **Level 1 (Cards):** Soft, diffused shadows (Blur: 16px, Y: 4px, Opacity: 4%) are used for the primary data containers. This separates spending categories from the background without creating visual clutter.
- **Level 2 (Active Elements):** Buttons and active AI chat bubbles use a slightly more pronounced shadow (Blur: 20px, Y: 6px, Opacity: 8%) to invite interaction.
- **Overlays:** Modals and bottom sheets use a **backdrop blur (8px)** to maintain context of the underlying screen while focusing the user's attention.

## Shapes

The shape language is extremely friendly and soft. All main containers (Cards, Modals) utilize **rounded-xl (1.5rem)** corners to evoke a sense of safety and "organic" flow. 

Smaller elements like buttons and input fields use **rounded-lg (1rem)**. Conversational AI bubbles use asymmetrical rounding (the corner pointing to the speaker is sharper) to distinguish between the user and the AI assistant, but still maintain the 1rem base radius for the outer edges.

## Components

### Cards
Cards are the primary data vehicle. They must have a white background, 1.5rem corner radius, and the standard ambient shadow. Headers within cards should use `label-caps` for the category and `stat-lg` for the amount.

### Buttons
- **Primary:** Purple background, white text, bold weight. High-contrast and easily tappable (min height 48px).
- **Secondary:** White background with a subtle gray border or a light purple tint.
- **Accent:** Orange background, used only for "Achieve" or "Claim" actions.

### Progress Gauges
Used for budget tracking. Use a thick (8px) stroke width. The track should be a light gray, while the "fill" uses the specific Category Color. When a budget is exceeded, the fill color must transition to the semantic Error Red.

### Conversational AI Bubbles
The AI bubbles are styled with a light purple tint (`primary_color_hex` at 5% opacity). They appear from the left. User responses appear from the right in solid purple with white text. Both use a 1rem corner radius.

### Input Fields
Inputs should be large and "tappable." Use a light gray background (`#F1F3F5`) rather than a border to define the field, switching to a purple border only when the field is focused.

### Stats Hierarchy
Every numerical stat should be paired with a "JetBrains Mono" label. Large stats should be bold, while sub-stats (e.g., "vs last month") should be significantly smaller and use semantic colors (green/red) to indicate trend direction.