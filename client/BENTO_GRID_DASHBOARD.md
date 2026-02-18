# Apple-Inspired Bento Grid Dashboard

## Overview

The WarrantyVault dashboard has been completely redesigned with an Apple-inspired premium Bento Grid layout that prioritizes minimalism, spaciousness, and professional aesthetics.

## Design Philosophy

- **Minimal**: Clean, uncluttered interface with focus on content
- **Spacious**: Generous padding and whitespace
- **Soft Shadows**: Subtle depth with `shadow-lg shadow-black/5`
- **Rounded Corners**: Apple-like `rounded-3xl` borders
- **Clean Typography**: Using tracking-tight and semantic font sizes
- **Subtle Gradients**: Neutral color palette (no loud colors)
- **Professional SaaS Look**: Enterprise-grade appearance
- **Authentic Design**: Natural, hand-crafted feel (NOT AI-generated look)

## Layout Structure

### Bento Grid Configuration

The dashboard uses CSS Grid with responsive breakpoints:

```
Mobile (1 column)    → Stack vertically
Tablet (2 columns)   → 2-column grid
Desktop (4 columns)  → Complex Bento Grid layout
```

### Card Components

#### 1. Overview Card (Large 2x1)
- **Size**: Spans 2 columns, 1 row
- **Content**:
  - Total Products (large display - 6xl)
  - Active count (in sub-grid)
  - Expired count (in sub-grid)
- **Icon**: Package icon from lucide-react
- **Animation**: Number scale animation on load

#### 2. Expiring Soon Card (Medium)
- **Size**: 1 column, 1 row
- **Content**:
  - Top 3 nearest expiry products
  - Product name + remaining days
  - Red text if < 30 days remaining
- **Icon**: Clock icon
- **Animation**: Stagger animation for list items

#### 3. Warranty Timeline Card (Full Width)
- **Size**: Full width (col-span-full)
- **Content**:
  - Top 4 products sorted by expiry
  - Horizontal progress bars
  - Status-based colors:
    - Green: Active (> 30 days)
    - Amber: Expiring (≤ 30 days)
    - Red: Expired (< 0 days)
- **Icon**: TrendingUp icon
- **Animation**: Progress bar fill animation

#### 4. Analytics Chart Card (Medium)
- **Size**: 1 column, 1 row
- **Content**:
  - Minimal doughnut chart
  - Active vs Expired distribution
  - Total in center
  - Legend below chart
- **Colors**: 
  - Light mode: `neutral-800` and `neutral-300`
  - Dark mode: `neutral-300` and `neutral-700`
- **Icon**: BarChart3 icon
- **Animation**: Chart render + center text scale

#### 5. Quick Add Card (Small)
- **Size**: 1 column, 1 row
- **Content**:
  - Plus icon (rotates on hover)
  - "Add Product" text
  - Clickable card
- **Action**: Routes to `/products/add`
- **Animation**: 
  - Hover scale (1.02)
  - Tap scale (0.98)
  - Icon rotation (90°)

## Color System

### Neutral Palette
```css
/* Light Mode */
bg-white           - Card backgrounds
text-neutral-900   - Primary text
text-neutral-500   - Secondary text/labels
bg-neutral-100     - Icon background
bg-neutral-50      - Sub-card background
border-neutral-200 - Card borders

/* Dark Mode */
dark:bg-neutral-900        - Card backgrounds
dark:text-neutral-100      - Primary text
dark:text-neutral-500      - Secondary text/labels
dark:bg-neutral-800        - Icon background
dark:bg-neutral-800/50     - Sub-card background
dark:border-neutral-800    - Card borders
```

### Accent Colors (Minimal Usage)
```css
/* Status Indicators Only */
red-600/red-500      - Urgent/Expired
amber-500/amber-600  - Expiring Soon
emerald-500/emerald-600 - Active
```

## Typography Scale

| Element | Class | Font Size |
|---------|-------|-----------|
| Page Title | `text-4xl font-bold` | 36px |
| Card Title | `text-2xl font-semibold tracking-tight` | 24px |
| Large Number | `text-6xl font-bold` | 60px |
| Medium Number | `text-3xl font-bold` | 30px |
| Small Number | `text-lg font-semibold` | 18px |
| Label | `text-sm text-neutral-500` | 14px |
| Caption | `text-xs text-neutral-500` | 12px |

## Shadow System

| Type | Class | Usage |
|------|-------|-------|
| Default | `shadow-lg shadow-black/5` | All cards |
| Hover | `shadow-xl shadow-black/10` | Quick Add Card |
| Sub-card | None or minimal | Inner elements |

## Spacing

| Level | Padding | Usage |
|-------|---------|-------|
| Card | `p-8` | Main card content |
| Sub-card | `p-4` or `p-5` | Inner card elements |
| Gap | `gap-6` | Between cards |
| Margin | `mb-6`, `mb-8` | Section spacing |

## Animations

### Entry Animations
All cards use Framer Motion with staggered delays:

```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: [0-0.4] }}
```

### Interactive Animations

#### Quick Add Card
```typescript
whileHover={{ scale: 1.02 }}
whileTap={{ scale: 0.98 }}
```

#### Plus Icon Rotation
```typescript
whileHover={{ rotate: 90 }}
transition={{ duration: 0.3 }}
```

#### Progress Bar Fill
```typescript
initial={{ width: 0 }}
animate={{ width: `${percent}%` }}
transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
```

#### Number Scale
```typescript
initial={{ scale: 0.5, opacity: 0 }}
animate={{ scale: 1, opacity: 1 }}
transition={{ duration: 0.5, delay: 0.2 }}
```

## Responsive Behavior

### Mobile (< 768px)
```css
grid-cols-1
- All cards stack vertically
- Full width for all components
```

### Tablet (768px - 1024px)
```css
grid-cols-2
- 2-column grid
- Overview card spans 2 columns
- Other cards take 1 column each
```

### Desktop (> 1024px)
```css
grid-cols-4
- 4-column Bento Grid
- Overview: 2 columns
- Expiring Soon: 1 column
- Analytics: 1 column
- Quick Add: 1 column
- Timeline: Full width (4 columns)
```

## Dark Mode Support

Every component includes full dark mode support with `dark:` prefixes:

- Background colors transition naturally
- Text remains readable
- Borders remain subtle
- Icons adapt to theme
- Charts use theme-appropriate colors

### Dark Mode Detection
The AnalyticsChartCard detects dark mode:

```typescript
const isDark = typeof window !== 'undefined' && 
  document.documentElement.classList.contains('dark');
```

## File Structure

```
client/components/dashboard/bento/
├── index.ts                    # Barrel exports
├── OverviewCard.tsx           # Large 2x1 stats card
├── ExpiringSoonCard.tsx       # Medium expiring products
├── WarrantyTimelineCard.tsx   # Full-width timeline
├── AnalyticsChartCard.tsx     # Medium chart card
└── QuickAddCard.tsx           # Small action card
```

## Data Flow

### Hook: useProducts()
```typescript
const { 
  products,          // All products
  stats,             // { total, active, expiringSoon, expired }
  expiringProducts,  // Products expiring soon
  isLoading 
} = useProducts();
```

### API Endpoints Used
- `GET /api/products` - All products
- `GET /api/products/stats` - Dashboard stats
- `GET /api/products/expiring` - Expiring products

### Virtual Fields (from Backend)
The backend provides these computed fields:
- `remainingDays` - Days until expiry
- `warrantyUsagePercent` - Usage percentage

## Component Props

### OverviewCard
```typescript
interface OverviewCardProps {
  total: number;
  active: number;
  expired: number;
}
```

### ExpiringSoonCard
```typescript
interface ExpiringSoonCardProps {
  products: Product[];
}
```

### WarrantyTimelineCard
```typescript
interface WarrantyTimelineCardProps {
  products: Product[];
}
```

### AnalyticsChartCard
```typescript
interface AnalyticsChartCardProps {
  active: number;
  expired: number;
}
```

### QuickAddCard
```typescript
// No props - self-contained
```

## Performance Optimizations

1. **Conditional Rendering**: Loading state shows spinner
2. **Efficient Animations**: Use `transform` and `opacity` only
3. **Lazy Calculations**: Only calculate what's needed
4. **Sorted Once**: Data sorted once, not on every render
5. **Limited Lists**: Show only top 3-4 items

## Accessibility

- All interactive elements have proper focus states
- Semantic HTML structure
- Color contrast meets WCAG standards
- Keyboard navigation supported
- Screen reader friendly text

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS/Android)

## Implementation Checklist

✅ Create Bento Grid components
✅ Implement responsive layout
✅ Add smooth animations
✅ Support dark mode
✅ Type all components
✅ Add loading states
✅ Optimize performance
✅ Test on multiple devices

## Future Enhancements

- [ ] Add skeleton loaders
- [ ] Implement drag-and-drop card reordering
- [ ] Add more chart types (bar, line)
- [ ] Export dashboard as PDF
- [ ] Add filters and date ranges
- [ ] Implement real-time updates
- [ ] Add user preferences for card visibility

## Credits

Design inspired by Apple's design language with modern SaaS dashboard patterns.

Built with:
- Next.js 14
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide React Icons

---

**Version**: 1.0  
**Last Updated**: February 18, 2026
