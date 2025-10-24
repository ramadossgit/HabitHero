# Habit Heroes Parent Dashboard - Design Guidelines

## Design Approach

**Hybrid Strategy**: Combine Notion's clean dashboard aesthetics with Duolingo's playful gamification and Apple HIG's professional minimalism. Create an interface that feels trustworthy for parents while maintaining visual energy from the gamified nature.

**Core Principle**: Professional structure with playful accents - serious functionality wrapped in encouraging design language.

## Typography System

**Font Families**:
- Primary: 'Plus Jakarta Sans' (Google Fonts) - modern, friendly, excellent readability
- Accent: 'Fredoka' (Google Fonts) - for gamification elements, hero counts, achievement callouts

**Type Scale**:
- Page Titles: text-4xl font-bold (Fredoka for numbers, Plus Jakarta for text)
- Section Headers: text-2xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base
- Metadata/Labels: text-sm font-medium
- Micro-copy: text-xs

## Layout Architecture

**Spacing System**: Use Tailwind units of 3, 4, 6, 8, 12 for consistent rhythm throughout.

**Grid Structure**:
- Sidebar: Fixed 280px width (w-70) with smooth slide-in mobile drawer
- Main Content: Remaining space with max-w-7xl container, padding px-6 py-8
- Card Grids: 3 columns on desktop (grid-cols-3), 2 on tablet (md:grid-cols-2), 1 on mobile
- Gutters: gap-6 for cards, gap-4 for list items

**Sidebar Navigation**:
- Vertically stacked menu items with icon + label
- Icons from Heroicons (outline style via CDN)
- Active state: full-width pill shape background
- Menu items: py-3 px-4 with rounded-xl
- Logo area: p-6 at top with app name and tagline
- Bottom section: parent profile card with avatar, name, sign-out link

## Component Library

### Dashboard Cards
**Stats Cards**: Compact metrics cards showing key numbers (Total Habits, Active Streaks, Rewards Earned)
- Icon in top-left (subtle filled circle background)
- Large number display (text-3xl Fredoka)
- Label below (text-sm)
- Trend indicator (+12% this week)
- Subtle shadow: shadow-sm hover:shadow-md transition

**Child Profile Cards**: Display each child with avatar, name, level, current streak
- Horizontal layout: avatar (60px rounded-full) + info column
- Progress bar showing XP to next level
- Mini badge cluster (recent achievements)
- "View Details" link
- Card: p-5 rounded-2xl

**Habit Cards**: Show individual habit details
- Checkbox status indicator
- Habit name and frequency (Daily/Weekly)
- Assigned child avatars (overlapping circles)
- Completion streak visualization
- Quick action menu (three dots)

### Progress Visualizations
**Weekly Heatmap**: 7-day grid showing completion status
- Squares with rounded corners (rounded-lg)
- Size: w-10 h-10
- Empty state, partial, complete states
- Hover tooltip with day details

**Level Progress Ring**: Circular progress indicator
- SVG-based ring showing XP progress
- Center: level number in Fredoka
- Surrounding: "Level X" text

**Achievement Badges**: Icon-based rewards display
- Hexagon or shield container shapes
- Layered shadow effect for depth
- Unlock animation state indication
- Badge rarity indicators (common, rare, epic)

### Data Tables
**Habits Management Table**: Sortable, filterable list
- Columns: Habit Name | Assigned To | Frequency | Status | Actions
- Row: py-4 hover state
- Inline edit capability indicators
- Bulk action checkboxes

**Rewards Catalog**: Grid of available rewards
- Card format with reward image placeholder
- Point cost (large, Fredoka font)
- Redemption button
- "Claimed" vs "Available" states

### Forms & Inputs
**Add Habit Form**: Multi-step card-based flow
- Step indicators at top
- Icon picker (grid of Heroicon options)
- Frequency selector (pill buttons)
- Child assignment (avatar multi-select)
- Point value slider with visual feedback

**Search & Filters**: Header bar component
- Search input with icon prefix
- Filter dropdown buttons
- Sort controls
- "Clear All" action link

### Navigation & Actions
**Page Headers**: Full-width section at top of each view
- Breadcrumb trail (text-sm)
- Page title (text-4xl)
- Action buttons aligned right (Add Habit, Export Report, etc.)
- Spacing: pb-8 border-b

**Action Buttons**:
- Primary: Large rounded-xl with icon prefix, px-6 py-3
- Secondary: Outlined style with hover fill
- Tertiary: Text-only with icon, underline on hover
- Icon-only: rounded-full p-2 for compact actions

### Modals & Overlays
**Detail Panels**: Slide-out drawer from right
- Full-height overlay backdrop
- Width: 480px max-w-xl
- Header with close button
- Scrollable content area
- Footer with actions (sticky)

**Confirmation Dialogs**: Centered modal
- Max width: max-w-md
- Rounded corners: rounded-3xl
- Icon at top (warning, success, info)
- Action buttons in footer (Cancel + Confirm)

## Gamification Elements

**Streak Flame Icon**: Always visible with current streak count
- Animated subtle pulse on milestone days
- Size variations: small (list items), large (hero stats)

**XP Particles**: Micro-animation indicators for point gains
- Small floating numbers with fade-out
- Appear on habit completion confirmation

**Trophy Showcase**: Featured achievement display
- 3D-style trophy illustrations (use images)
- Podium layout for top 3 recent wins
- Confetti burst effect indicators

## Page-Specific Layouts

### Overview Dashboard
**Hero Stats Row**: 3 stat cards spanning width (grid-cols-3)
- Total habits completed this week
- Active streaks across all children  
- Points earned today

**Children Quick View**: Grid of child profile cards (grid-cols-2 lg:grid-cols-3)

**Recent Activity Feed**: Timeline-style list
- Avatar + action description + timestamp
- Grouped by day with date headers
- "Load more" pagination

**Upcoming Habits**: Table view of habits due today/tomorrow

### Children Management
**Child Grid View**: Large profile cards with detailed stats
- Add new child CTA card (dashed border)
- Edit/delete actions on hover
- Click card to expand detail panel

**Individual Child Detail Panel**:
- Header: avatar, name, level ring
- Tabs: Habits | Rewards | Stats | Settings
- Chart showing weekly completion rate
- Badges collection showcase

### Habits Page
**Filter Bar**: Fixed at top with search, status filter, child filter
**Habit Table**: Sortable columns with inline actions
**Floating Action Button**: "Create New Habit" (bottom-right, rounded-full)

### Rewards Page
**Points Balance Banner**: Sticky header showing available points per child
**Reward Grid**: Cards in 4-column layout (grid-cols-4)
**Redemption History**: Collapsible table below grid

### Progress Reports
**Date Range Selector**: Horizontal pill options (This Week, This Month, Custom)
**Metric Cards**: Key KPIs in 4-column grid
**Comparison Charts**: Line/bar charts showing trends (use Chart.js or similar via CDN)
**Export Button**: Top-right for PDF/CSV download

### Settings
**Settings Sections**: Accordion-style groups
- Account Settings
- Notification Preferences  
- Reward Rules
- App Appearance
**Save Changes Bar**: Sticky footer when modifications made

## Images Section

**No Large Hero Image**: This is a dashboard interface focused on data and functionality.

**Required Images**:
1. **Child Avatars**: Circular profile photos (upload capability), 60px default size, placeholder with initials
2. **Achievement Badges**: Icon-based reward graphics, 80x80px, use illustrative style matching gamification theme
3. **Reward Items**: Product/reward photos in catalog grid, 200x200px, consistent aspect ratio
4. **Trophy Illustrations**: 3D-style trophy graphics for milestone celebrations, used in achievement showcases
5. **Empty State Illustrations**: Friendly graphics for "No habits yet" or "No children added" states, centered in empty containers, 240x180px

**Image Treatment**: All images use rounded-xl corners, subtle shadow-sm, consistent padding within containers.

**Icon Implementation**: Use Heroicons (outline) via CDN for all UI icons - navigation, actions, status indicators. Reserve illustrative images for gamification and personalization elements only.