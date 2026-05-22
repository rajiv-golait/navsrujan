---
name: Obsidian Intelligence
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#c6c6cb'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#909095'
  outline-variant: '#45474b'
  surface-tint: '#c6c6cc'
  primary: '#c6c6cc'
  on-primary: '#2f3035'
  primary-container: '#0f1115'
  on-primary-container: '#7b7c82'
  inverse-primary: '#5d5e63'
  secondary: '#c3c0ff'
  on-secondary: '#1d00a5'
  secondary-container: '#3626ce'
  on-secondary-container: '#b3b1ff'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#061122'
  on-tertiary-container: '#727d92'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2e2e8'
  primary-fixed-dim: '#c6c6cc'
  on-primary-fixed: '#1a1c20'
  on-primary-fixed-variant: '#45474b'
  secondary-fixed: '#e2dfff'
  secondary-fixed-dim: '#c3c0ff'
  on-secondary-fixed: '#0f0069'
  on-secondary-fixed-variant: '#3323cc'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max-width: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is anchored in the concept of "Quiet Intelligence." It moves away from the erratic energy of consumer-grade AI apps toward a disciplined, high-fidelity environment tailored for serious financial decision-making. The aesthetic is a fusion of **Modern Minimalism** and **Corporate Precision**, emphasizing structural clarity and monochromatic depth over decorative elements.

The UI should evoke a sense of calm authority. It acts as a digital concierge—sophisticated, unobtrusive, and hyper-competent. We achieve this through generous whitespace, razor-sharp typography, and a "less but better" approach to color and motion. The final result should feel like a premium physical tool: weighty, polished, and reliable.

## Colors

The palette is built on a foundation of "Obsidian" and "Slate" to provide a sense of grounded permanence. We avoid pitch black in favor of deep, layered charcoals to allow for subtle tonal depth.

- **Primary (Obsidian):** `#0F1115` - The base of the interface. 
- **Accent (Intelligence Blue):** `#4F46E5` - Reserved exclusively for AI interactions, primary actions, and data-driven insights. It is a "living" color that signifies the system is thinking or acting.
- **Surface (Slate):** `#1E293B` - Used for cards and containers to create a sense of layering.
- **Light Mode Transition:** For light mode, the system flips to a base of `#FFFFFF` with surfaces in `#F8FAFC` (Alabaster) and borders in `#E2E8F0`.

Color is used sparingly. Data visualization should utilize monochromatic shades of the accent color or muted teals and ambers only when necessary for status indication (e.g., profit/loss).

## Typography

**Manrope** is selected for its geometric purity and modern, technical proportions. It bridges the gap between a friendly humanist face and a rigid grotesque, perfect for a trustworthy financial AI.

### Hierarchy Rules:
- **Headlines:** Use tight letter spacing (-0.01em to -0.02em) for larger sizes to maintain a sleek, editorial feel.
- **Body:** Standard spacing for maximum legibility. Use `body-md` for the majority of text-based AI responses.
- **Data:** For numerical values, currency, and timestamps, transition to a monospaced-adjacent font like **Geist** (or use Manrope's tabular figures) to ensure columns of numbers align perfectly.
- **Labels:** Use `label-caps` for small metadata, section headers in sidebars, and overlines.

## Layout & Spacing

The design system utilizes a **Fixed-Fluid Hybrid Grid**. On desktop, content is contained within a 1280px central column to maintain a focused, dashboard-like experience. On mobile, it transitions to a single-column fluid layout.

### Principles:
- **8px Rhythm:** All spacing (padding, margins, heights) must be multiples of 8px to ensure mathematical harmony.
- **Generous Gutters:** We use a 24px gutter to give complex financial data "room to breathe."
- **Information Density:** While we prioritize whitespace, data tables may utilize a "compact mode" (4px increments) to allow for high-level oversight without excessive scrolling.
- **Safe Areas:** Ensure a 48px margin on desktop to prevent the UI from feeling cramped against the browser edges.

## Elevation & Depth

In the design system, depth is communicated through **Tonal Layering** and **Low-Contrast Outlines** rather than heavy shadows.

- **Level 0 (Background):** `#0F1115` (Obsidian) - The canvas.
- **Level 1 (Cards/Panels):** `#1E293B` (Slate) - Used for primary UI containers. These should have a subtle 1px border of `#334155` to define edges.
- **Level 2 (Modals/Popovers):** Slightly lighter than Level 1, with a very soft, diffused shadow (`0px 10px 30px rgba(0,0,0,0.5)`). 
- **Glassmorphism:** Use sparingly for navigation bars or floating AI chat inputs. A `backdrop-filter: blur(12px)` with a 10% white overlay creates a premium, high-tech feel without distracting from the data.

## Shapes

The shape language is **Soft and Precise**. We avoid the hyper-rounded "pill" shapes of consumer apps to maintain a professional, institutional character.

- **Primary Radius:** 0.25rem (4px). Used for checkboxes, input fields, and small buttons. This creates a sharp, disciplined look.
- **Container Radius:** 0.5rem (8px). Used for cards, modals, and main content areas.
- **Large Radius:** 0.75rem (12px). Used only for the main AI chat bubble or large hero containers to provide a slight visual distinction from the more rigid data panels.

## Components

### Buttons
- **Primary:** Solid Intelligence Blue (`#4F46E5`) with white text. 4px radius. No gradient.
- **Secondary:** Ghost style. 1px border of Slate (`#334155`) with white text.
- **Tertiary:** Pure text with an underline on hover, used for low-priority actions.

### Input Fields
- Dark backgrounds (`#0F1115`) with a 1px Slate border. 
- Focus state: Border changes to Intelligence Blue with a subtle 2px outer glow of the same color at 20% opacity.

### Cards
- Background: Slate (`#1E293B`).
- Padding: Always 24px to maintain the premium feel.
- Header: Uses `label-caps` for the title and `headline-md` for the primary value (e.g., Account Balance).

### AI Interaction (The "Intelligence" Thread)
- AI responses are distinguished by a subtle vertical accent line of Intelligence Blue on the left side.
- Use monospaced fonts for code snippets or specific financial formulas within the chat.

### Data Visualization
- Line charts use a single Intelligence Blue line with a subtle area glow beneath it. 
- Grid lines should be faint (`#1E293B`) to keep the focus on the data trend.