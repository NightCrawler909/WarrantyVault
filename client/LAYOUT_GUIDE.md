# Bento Grid Layout - Visual Guide

## Desktop Layout (lg: > 1024px)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard Header                          │
│  Welcome back! Here's your warranty overview                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬────────────────┬───────────┐
│                                     │                │           │
│         OVERVIEW CARD               │   EXPIRING     │ ANALYTICS │
│         (2 columns)                 │     SOON       │   CHART   │
│                                     │                │           │
│  Total Products: 25                 │  iPhone 15     │   ╱─╲    │
│                                     │  10d           │  │   │   │
│  ┌──────────┬──────────┐            │                │  │ 25│   │
│  │ Active   │ Expired  │            │  MacBook       │   ╲─╱    │
│  │   15     │    3     │            │  25d           │           │
│  └──────────┴──────────┘            │                │ Active: 15│
│                                     │  AirPods       │ Expired: 3│
│                                     │  45d           │           │
└─────────────────────────────────────┴────────────────┴───────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    WARRANTY TIMELINE CARD                        │
│                      (Full Width)                                │
│                                                                  │
│  iPhone 15         [████████████████░░░░░░] 85%    10d left     │
│  MacBook Pro       [████████████░░░░░░░░░░] 70%    25d left     │
│  AirPods Pro       [████████░░░░░░░░░░░░░░] 50%    45d left     │
│  iPad Air          [████░░░░░░░░░░░░░░░░░░] 30%   120d left     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌────────────────┐
│   QUICK ADD    │
│                │
│      [+]       │
│                │
│  Add Product   │
│                │
└────────────────┘
```

## Tablet Layout (md: 768px - 1024px)

```
┌──────────────────────────────────────────┐
│          Dashboard Header                 │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         OVERVIEW CARD                    │
│         (2 columns span)                 │
│                                          │
│  Total: 25                               │
│  Active: 15  |  Expired: 3              │
└──────────────────────────────────────────┘

┌────────────────────┬─────────────────────┐
│   EXPIRING SOON    │   ANALYTICS CHART   │
│                    │                     │
│   iPhone 15: 10d   │      [Chart]        │
│   MacBook: 25d     │                     │
└────────────────────┴─────────────────────┘

┌──────────────────────────────────────────┐
│       WARRANTY TIMELINE                  │
│       (Full Width)                       │
│                                          │
│   [Progress Bars]                        │
└──────────────────────────────────────────┘

┌────────────────────┬─────────────────────┐
│    QUICK ADD       │                     │
│       [+]          │                     │
└────────────────────┴─────────────────────┘
```

## Mobile Layout (< 768px)

```
┌─────────────────────────┐
│   Dashboard Header       │
└─────────────────────────┘

┌─────────────────────────┐
│    OVERVIEW CARD        │
│                         │
│    Total: 25            │
│    Active: 15           │
│    Expired: 3           │
└─────────────────────────┘

┌─────────────────────────┐
│   EXPIRING SOON         │
│                         │
│   iPhone 15: 10d        │
│   MacBook: 25d          │
│   AirPods: 45d          │
└─────────────────────────┘

┌─────────────────────────┐
│   ANALYTICS CHART       │
│                         │
│      [Chart]            │
└─────────────────────────┘

┌─────────────────────────┐
│   WARRANTY TIMELINE     │
│                         │
│   [Progress Bars]       │
└─────────────────────────┘

┌─────────────────────────┐
│     QUICK ADD           │
│        [+]              │
└─────────────────────────┘
```

## Grid Configuration

### CSS Grid Classes

```css
/* Container */
.grid {
  display: grid;
  gap: 1.5rem; /* gap-6 */
  grid-auto-rows: 1fr;
}

/* Mobile First */
grid-cols-1

/* Tablet */
@media (min-width: 768px) {
  grid-cols-2
}

/* Desktop */
@media (min-width: 1024px) {
  grid-cols-4
}
```

### Card Spanning

| Card | Mobile | Tablet | Desktop |
|------|--------|--------|---------|
| Overview | 1 col | 2 cols | 2 cols |
| Expiring Soon | 1 col | 1 col | 1 col |
| Analytics | 1 col | 1 col | 1 col |
| Quick Add | 1 col | 1 col | 1 col |
| Timeline | 1 col | 2 cols | 4 cols (full) |

## Color Swatches

### Light Mode
```
Card Background:     #FFFFFF (white)
Primary Text:        #171717 (neutral-900)
Secondary Text:      #737373 (neutral-500)
Icon Background:     #F5F5F5 (neutral-100)
Sub-card Background: #FAFAFA (neutral-50)
Border:              #E5E5E5 (neutral-200)
Shadow:              rgba(0,0,0,0.05)
```

### Dark Mode
```
Card Background:     #171717 (neutral-900)
Primary Text:        #FAFAFA (neutral-100)
Secondary Text:      #737373 (neutral-500)
Icon Background:     #262626 (neutral-800)
Sub-card Background: rgba(38,38,38,0.5)
Border:              #262626 (neutral-800)
Shadow:              rgba(0,0,0,0.05)
```

### Status Colors
```
Active (Green):      #10B981 (emerald-500)
Expiring (Amber):    #F59E0B (amber-500)
Expired (Red):       #DC2626 (red-600)
```

## Animation Timings

```javascript
// Card Entry
duration: 0.5s
delay: 0s, 0.1s, 0.2s, 0.3s, 0.4s (staggered)

// Number Scale
duration: 0.5s
delay: 0.2s

// Progress Bar
duration: 1s
delay: 0.2s + (index * 0.1s)
ease: easeOut

// Hover Interactions
scale: 1.02
duration: 0.3s

// Icon Rotation
rotate: 90deg
duration: 0.3s
```

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| gap-6 | 1.5rem (24px) | Card gaps |
| p-8 | 2rem (32px) | Card padding |
| p-5 | 1.25rem (20px) | Sub-card padding |
| p-4 | 1rem (16px) | List item padding |
| mb-8 | 2rem (32px) | Section margins |
| mb-6 | 1.5rem (24px) | Header margins |

## Border Radius

| Class | Value | Usage |
|-------|-------|-------|
| rounded-3xl | 1.5rem (24px) | Card borders |
| rounded-2xl | 1rem (16px) | Sub-cards, icons |
| rounded-full | 50% | Dots, circles |

## Typography Hierarchy

```
Page Title (Dashboard)
└── text-4xl font-bold tracking-tight (36px)

Card Titles
└── text-2xl font-semibold tracking-tight (24px)

Large Numbers (Total Products)
└── text-6xl font-bold tracking-tight (60px)

Medium Numbers (Active/Expired)
└── text-3xl font-bold (30px)

Small Numbers (Chart Legend)
└── text-lg font-semibold (18px)

Labels
└── text-sm text-neutral-500 (14px)

Captions
└── text-xs text-neutral-500 (12px)
```

## Interactive States

### Quick Add Card
```
Default:  scale(1)
Hover:    scale(1.02) + shadow-xl
Active:   scale(0.98)
```

### List Items (Expiring Soon)
```
Default:  bg-neutral-50
Hover:    bg-neutral-50 + shadow-md
```

### Progress Bars
```
Background: bg-neutral-100
Fill:       bg-emerald-500 | bg-amber-500 | bg-red-500
Transition: width 1s ease-out
```

## Z-Index Layers

```
Base Layer (Cards):           z-0
Hover Effects:                z-10
Tooltips/Popovers:           z-50
Modals/Dialogs:              z-100
```

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```css
focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2
```

### Color Contrast Ratios
- Primary text: 15:1 (AAA)
- Secondary text: 7:1 (AA)
- Icon backgrounds: 4.5:1 (AA)

### Keyboard Navigation
- Tab through all interactive elements
- Enter to activate buttons
- Escape to close modals

## Performance Metrics

### Target Metrics
- First Contentful Paint: < 1s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 200ms
- Cumulative Layout Shift: < 0.1

### Optimization Techniques
- CSS Grid for layout (no JS calculations)
- Transform/opacity animations only
- Lazy load charts
- Debounce resize events
- Request Animation Frame for smooth updates

---

**Design Version**: 1.0  
**Last Updated**: February 18, 2026
