# PolarNest — Developer Handoff Document

> Version: 2.0 | Platform: Expo / React Native | Theme: Dark
> Primary: #00d4ff (Cyan) | Secondary: #00e676 (Green)

---

## 1. Project Structure

```
PolarNest/
  screens/
    Login.tsx              # Login / Register screen
    Home.tsx               # Dashboard with stats, modules, recent activity
    WardrobeLibrary.tsx    # Wardrobe grid / list view
    WardrobeEdit.tsx       # Add / Edit wardrobe item
    TryOnBuilder.tsx       # Outfit composition tool
    FridgeLibrary.tsx      # Fridge grid / list view
    FridgeEdit.tsx         # Add / Edit fridge item
    ReceiptImport.tsx      # Receipt scanning and review
    Recipes.tsx            # Recipe library
    RecipeDetails.tsx      # Single recipe view
    RecipeEditor.tsx       # Create / Edit recipe
    Assistant.tsx          # AI chat assistant
    Settings.tsx           # App settings
  components/
    Button.tsx             # Primary, Secondary, Ghost, Danger + sizes
    Input.tsx              # Text input with label, error, disabled states
    Card.tsx               # Wardrobe, Fridge, Recipe card variants
    TabBar.tsx             # Bottom tab navigation
    SegmentedControl.tsx   # Segmented tab selector
    SearchBar.tsx          # Search input with icon
    Chip.tsx               # Filter and tag chips
    Modal.tsx              # Dialog modal
    BottomSheet.tsx        # Bottom sheet with handle
    Toast.tsx              # Success/error toast notifications
    ChatBubble.tsx         # User and assistant message bubbles
    EmptyState.tsx         # Empty state with icon, title, action
    LoadingDots.tsx        # Animated loading indicator
    ProgressBar.tsx        # Linear progress bar
    Skeleton.tsx           # Skeleton loading placeholder
    FloatingActionButton.tsx # FAB for add actions
    ImageUpload.tsx        # Photo capture / gallery picker
    Pagination.tsx         # Page controls
  theme/
    tokens.json            # All design tokens (colors, type, spacing, etc.)
    colors.ts              # Color constants
    typography.ts          # Type scale constants
    spacing.ts             # Spacing constants
    shadows.ts             # Shadow elevation constants
    animations.ts          # Animation constants
```

---

## 2. Component Hierarchy

### Screen → Component mapping

Each screen composes from the shared component library. No screen should define its own button styles, card styles, or input styles — always use the library.

```
Home
  ├── StatusBar
  ├── Header (title + greeting + action icons)
  ├── StatsRow (3x stat cards)
  ├── ModuleGrid (Wardrobe + Fridge quick cards)
  ├── SectionLabel ("Recent activity")
  ├── RecentList (list items with image + text + tag)
  ├── EmptyState (contextual)
  ├── TabBar (bottom)
  └── FloatingActionButton

WardrobeLibrary
  ├── StatusBar
  ├── Header (title + item count)
  ├── SearchBar
  ├── FilterChips (horizontal scroll)
  ├── CardGrid (2-column, WardrobeCard)
  ├── EmptyState (when no items match)
  ├── TabBar
  └── FloatingActionButton

FridgeLibrary
  ├── StatusBar
  ├── Header
  ├── AlertBanner (expiring items)
  ├── SearchBar
  ├── SegmentedControl (categories)
  ├── ItemList (FridgeCard, horizontal)
  ├── EmptyState
  ├── TabBar
  └── FloatingActionButton
```

---

## 3. Layout Measurements

### Content padding
- Mobile (< 375px): 16px horizontal
- Mobile (375–430px): 20px horizontal
- Tablet (768px+): 24px horizontal

### Grid rules
- Wardrobe grid: 2 columns, 12px gap
- Fridge list: single column, 10px gap
- Recipe list: 2 columns, 12px gap
- Home stats: 3 columns, 8px gap
- Home modules: 2 columns, 12px gap

### Card dimensions
- Wardrobe card: 1:1 image ratio, 16px padding
- Fridge card: 56x56px thumbnail, horizontal layout, 12px padding
- Recipe card: 56x56px thumbnail, horizontal layout, 12px padding

### Image ratios
- Wardrobe item photo: 4:3 (detail view), 1:1 (grid)
- Fridge item photo: 4:3 (detail view), 1:1 (list thumbnail)
- Recipe photo: 16:9 (detail), 1:1 (card)
- Receipt scan: 4:3

### Section spacing
- Between sections: 24px
- Between cards in a list: 8px
- Between grid items: 12px
- Between form fields: 16px

---

## 4. Interaction Behavior

### Tab bar
- 5 tabs: Home, Wardrobe, Fridge, Search, Settings
- Active tab: primary cyan (#00d4ff)
- Inactive tab: text-muted (#5a5e6e)
- Transition: 150ms ease-out on color change
- Icon + label stack, 56px height

### Segmented control
- Background: surface-2 (#1a1d23)
- Active segment: surface-3 (#242830)
- 3px padding around segments
- 150ms ease-out transition

### Cards
- Press: transform scale(0.97), 150ms ease-out
- Hover: none (mobile)
- Link to detail screen on tap

### Bottom sheet
- Slides up from bottom: 400ms spring
- Overlay: rgba(0,0,0,0.6) with 4px blur
- Handle: 36x4px, centered, rounded
- Swipe down to dismiss

### Modal
- Scale from 0.95→1 + fade in: 300ms ease-out
- Overlay: rgba(0,0,0,0.6)
- Tap backdrop to dismiss (unless destructive)

### Chat
- User bubble: right-aligned, bg primary, dark text, 16px radius, 4px bottom-right
- Assistant bubble: left-aligned, bg surface-2, border, 16px radius, 4px bottom-left
- Loading dots: 3 dots, 8px, 1.2s pulse loop, staggered 0.2s

### Floating action button
- 52x52px, full radius, shadow level 4
- Position: bottom-right, 76px from bottom (above tab bar)
- Press: scale(0.92), 150ms

### Search bar
- Tap to focus: border changes to primary cyan
- Clear button appears when text is entered
- 300ms debounce on search input

### Filters
- Chip tap: toggles active state
- Horizontal scroll for many chips
- Only one category active at a time (or "All" as default)

### Pagination
- Infinite scroll for long lists (12 items per page)
- Loading indicator at bottom while fetching
- "No more items" state at end

---

## 5. Image and Media Guidelines

### Product photos
- Wardrobe: White/light grey background, well-lit, centered
- Food: Natural lighting, on surface or in container
- Receipts: Flat, well-lit, text readable

### Image placeholders
- Use gradient placeholders (surface-3 → surface-1) while loading
- Show icon overlay for empty images
- Skeleton shimmer animation during load

### Image upload
- Tap to capture (camera) or choose from gallery
- Crop to aspect ratio after selection
- Show preview with replace button
- Max file size: 10MB

---

## 6. Animation Timing Reference

| Interaction | Duration | Easing | Transform |
|---|---|---|---|
| Button hover | 150ms | ease-out | translateY(-1px) |
| Button press | 150ms | ease-out | scale(0.97) |
| Card press | 150ms | ease-out | scale(0.97) |
| Tab switch | 150ms | ease-out | color change |
| Page enter | 350ms | ease-out | translateY(20) + fade |
| Modal open | 300ms | ease-out | scale(0.95→1) + fade |
| Sheet open | 400ms | spring | translateY(100%→0) |
| Toast enter | 250ms | ease-out | translateY(-20) + fade |
| Loading pulse | 1.2s | ease-in-out | opacity + scale |

---

## 7. Accessibility Checklist

- [ ] All touch targets ≥ 44px
- [ ] Color contrast ≥ 4.5:1 for text (AA)
- [ ] Color contrast ≥ 3:1 for large text and UI (AA)
- [ ] All icons have aria-labels/accessibilityLabels
- [ ] Form inputs have associated labels
- [ ] Error states are announced by screen readers
- [ ] Loading states announce to screen readers
- [ ] Reduced motion disables all animations
- [ ] Dynamic type scales to 200% without breaking
- [ ] Focus indicators visible on all interactive elements

---

## 8. File-by-File Implementation Notes

### screens/Login.tsx
- Email + password fields
- "Remember me" checkbox
- Forgot password link
- "Log in" primary button (full width)
- Divider with "Or continue with"
- Google + Apple social buttons
- "Don't have an account? Sign up" link
- Form validation: email format, password not empty
- Error state: inline error messages below fields
- States: default, focused, error, submitting, success

### screens/Home.tsx
- Stats row: Total items, Wardrobe count, Fridge count
- Module cards: Wardrobe (with item count + browse link), Fridge (with expiring count)
- Recent activity section: 3-5 recent items with image, name, timestamp, tag
- Empty state when no items exist
- Pull-to-refresh
- Scrollable content

### screens/WardrobeLibrary.tsx
- Search bar with debounce
- Filter chips: All, Tops, Bottoms, Outerwear, Footwear, Accessories
- 2-column grid of WardrobeCards
- Each card: image, name, brand, color, tags
- Tap card → WardrobeItemDetail
- Empty state when no items or no matches
- Pull-to-refresh

### screens/FridgeLibrary.tsx
- Alert banner at top when items are expiring (count + "expiring soon")
- Search bar
- Segmented control: All, Produce, Dairy, Meat, Pantry
- List of FridgeCards (horizontal layout)
- Each card: small image, name, quantity, category, expiry badge
- Expiry badge colors: OK (green), Soon (warning), Critical (danger)
- Empty state per category

### screens/Assistant.tsx
- Message list with ChatBubbles
- User bubble (right, cyan) and Assistant bubble (left, surface-2)
- Loading dots while thinking
- Input bar at bottom: text input + send button
- Suggestions chips above input
- Scroll to bottom on new messages

---

## 9. State Management Patterns

### Loading states
- Initial load: skeleton screen matching layout
- Refresh: subtle indicator at top (pull-to-refresh)
- Pagination: spinner at bottom of list
- Image load: gradient placeholder + shimmer

### Empty states
- Icon + heading + description + CTA button
- Contextual: different empty state for each screen
- Wardrobe: "Your wardrobe is empty" + "Add item"
- Fridge: "No food tracked yet" + "Scan receipt" / "Add item"
- Search: "No results found" + "Try a different search"

### Error states
- Form validation: inline error below field, red border
- Network error: toast notification, retry option
- Image upload failure: toast + retry button
- Delete confirmation: modal dialog with Cancel/Delete

---

## 10. Final Notes

- The font is Inter (loaded from Google Fonts or bundled). Use JetBrains Mono for code/numeric display.
- All spacing follows the 8px baseline grid with 4px micro steps.
- The dark theme is the default. No light theme is provided.
- Cyan (#00d4ff) is the primary action color — use it sparingly for maximum impact.
- Green (#00e676) is the secondary/success color — use for fridge items, fresh indicators.
- All cards have a subtle 1px border (#2a2e38) for definition on the dark background.
- Use frosted glass (backdrop-filter: blur) for tab bars, nav bars, and overlays.
- Maintain 44px minimum touch targets everywhere.
- This handoff is complete — an AI coding agent should be able to implement every screen and component from these specifications without visual ambiguity.
