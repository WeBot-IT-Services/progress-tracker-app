# Visual Design Elements Inventory

## Design System Components Reference

### Core Layout Elements

#### 1. Background Patterns
```css
/* Primary gradient background */
bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50

/* Glass-morphism cards */
bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/30

/* Header styling */
bg-white/90 backdrop-blur-xl shadow-xl border-b border-white/30
```

#### 2. Container System
```tsx
// ModuleContainer standardization
<ModuleContainer
  title="Module Name"
  subtitle="Module description"
  icon={IconComponent}
  iconColor="text-white"
  iconBgColor="bg-gradient-to-r from-blue-500 to-blue-600"
>
  {children}
</ModuleContainer>
```

### Typography Scale

#### Headings
- `text-2xl sm:text-3xl lg:text-4xl font-bold` - Main dashboard title
- `text-xl sm:text-2xl font-bold` - Module titles
- `text-lg font-semibold` - Section headings
- `text-base font-medium` - Subsection titles

#### Body Text
- `text-sm` - Default body text
- `text-xs` - Secondary information
- `text-gray-600` - Secondary text color
- `text-gray-500` - Tertiary text color

### Color System

#### Status Colors
```css
/* Sales/Success */
bg-green-100 text-green-800 border-green-200
bg-green-500 hover:bg-green-600 (buttons)

/* Design/DNE */
bg-blue-100 text-blue-800 border-blue-200
bg-blue-500 hover:bg-blue-600 (buttons)

/* Production */
bg-orange-100 text-orange-800 border-orange-200
bg-orange-500 hover:bg-orange-600 (buttons)

/* Installation */
bg-purple-100 text-purple-800 border-purple-200
bg-purple-500 hover:bg-purple-600 (buttons)

/* Completed/Neutral */
bg-gray-100 text-gray-800 border-gray-200
bg-gray-500 hover:bg-gray-600 (buttons)
```

#### Role Colors
```css
/* Admin */
bg-purple-100 text-purple-800 border-purple-200

/* Sales */
bg-green-100 text-green-800 border-green-200

/* Designer */
bg-blue-100 text-blue-800 border-blue-200

/* Production */
bg-orange-100 text-orange-800 border-orange-200

/* Installation */
bg-red-100 text-red-800 border-red-200
```

### Button Styles

#### Primary Buttons
```css
/* Gradient with hover effects */
bg-gradient-to-r from-blue-500 to-blue-600 
hover:from-blue-600 hover:to-blue-700 
text-white py-3 px-6 rounded-xl 
font-semibold transition-all duration-200 
hover:shadow-lg hover:scale-105
```

#### Secondary Buttons
```css
/* Light background with colored text */
bg-blue-50 hover:bg-blue-100 
text-blue-600 px-4 py-2 rounded-xl 
transition-all duration-200 hover:shadow-md
```

#### Icon Buttons
```css
/* Small circular buttons */
p-2 rounded-lg hover:bg-gray-100 
transition-all duration-200
```

### Card Styles

#### Primary Cards
```css
/* Main content cards */
bg-white/80 backdrop-blur-sm rounded-2xl 
shadow-lg border border-white/50 
hover:shadow-xl transition-all duration-300
```

#### Module Cards (Dashboard)
```css
/* Interactive module cards */
bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl 
p-6 sm:p-8 shadow-lg hover:shadow-2xl 
transition-all duration-500 cursor-pointer 
transform hover:-translate-y-2 hover:scale-[1.02] 
border border-white/50
```

#### Information Cards
```css
/* Smaller content cards */
bg-white/70 rounded-xl px-4 py-2 
shadow-sm border border-white/50
```

### Form Elements

#### Input Fields
```css
/* Standard text inputs */
w-full px-4 py-2 border border-gray-300 
rounded-xl focus:ring-2 focus:ring-blue-500 
focus:border-transparent transition-all duration-200
```

#### Textareas
```css
/* Multi-line inputs */
w-full px-4 py-2 border border-gray-300 
rounded-xl focus:ring-2 focus:ring-blue-500 
focus:border-transparent
```

#### Select Elements
```css
/* Dropdown selects */
w-full px-4 py-2 border border-gray-300 
rounded-xl focus:ring-2 focus:ring-blue-500 
focus:border-transparent
```

### Navigation Elements

#### Tab Navigation
```css
/* Active tab */
bg-white/90 text-blue-600 border-b-2 
border-blue-600 font-semibold

/* Inactive tab */
text-gray-600 hover:text-blue-600 
hover:bg-white/50 transition-colors
```

#### Breadcrumbs
```css
/* Back button */
flex items-center space-x-2 text-gray-600 
hover:text-gray-900 mr-4 p-2 rounded-lg 
hover:bg-gray-100 transition-all duration-200
```

### Loading States

#### Spinners
```css
/* Primary loader */
animate-spin rounded-full h-12 w-12 
border-b-2 border-blue-500 mx-auto
```

#### Skeleton Loading
```css
/* Placeholder content */
animate-pulse bg-gray-200 rounded-xl
```

### Status Indicators

#### Badges
```css
/* Status badges */
inline-flex items-center px-2.5 py-0.5 
rounded-full text-xs font-medium 
bg-green-100 text-green-800
```

#### Progress Bars
```css
/* Progress indicator */
bg-gray-200 rounded-full h-2
bg-gradient-to-r from-blue-500 to-blue-600 
h-2 rounded-full transition-all duration-500
```

### Animation Patterns

#### Hover Effects
```css
/* Scale animation */
hover:scale-105 transition-transform duration-200

/* Translate animation */
hover:-translate-y-2 transition-transform duration-300

/* Shadow animation */
hover:shadow-lg transition-shadow duration-200
```

#### Fade Animations
```css
/* Fade in */
animate-fade-in opacity-0 animate-opacity-100

/* Smooth transitions */
transition-all duration-300 ease-in-out
```

### Responsive Patterns

#### Grid Systems
```css
/* Module grid */
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 
gap-4 sm:gap-6 lg:gap-8

/* Form grid */
grid-cols-1 md:grid-cols-2 gap-6
```

#### Spacing Scale
```css
/* Padding scale */
p-4 sm:p-6 lg:p-8

/* Margin scale */
mb-4 sm:mb-6 lg:mb-8

/* Space between elements */
space-y-4 sm:space-y-6 lg:space-y-8
```

### Icon System

#### Icon Sizes
```css
/* Small icons */
h-4 w-4

/* Medium icons */
h-5 w-5

/* Large icons */
h-6 w-6 sm:h-8 sm:w-8

/* Extra large icons */
h-12 w-12 sm:h-16 sm:w-16
```

#### Icon Containers
```css
/* Circular icon container */
w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 
rounded-xl shadow-lg flex items-center justify-center

/* Square icon container */
w-14 h-14 bg-blue-500 rounded-2xl 
flex items-center justify-center
```

### Glass-morphism Effects

#### Backdrop Blur Levels
```css
/* Light blur */
backdrop-blur-sm

/* Medium blur */
backdrop-blur-md

/* Heavy blur */
backdrop-blur-xl
```

#### Transparency Levels
```css
/* Light transparency */
bg-white/70

/* Medium transparency */
bg-white/80

/* Heavy transparency */
bg-white/90
```

### Accessibility Considerations

#### Focus States
```css
/* Keyboard focus */
focus:ring-2 focus:ring-blue-500 
focus:border-transparent focus:outline-none

/* Focus visible */
focus-visible:ring-2 focus-visible:ring-blue-500
```

#### Color Contrast
- All text maintains WCAG AA contrast ratios
- Interactive elements have clear visual states
- Status colors are distinguishable by shape/icon as well as color

### Performance Optimizations

#### Efficient Animations
```css
/* Hardware acceleration */
transform hover:scale-105 transition-transform duration-200

/* Composited properties */
opacity transition-opacity duration-300
```

#### Reduced Motion
```css
/* Respects user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Design System Guidelines

1. **Always use the ModuleContainer** for consistent headers and layouts
2. **Maintain color consistency** across status indicators and role badges
3. **Use glass-morphism effects** for modern, layered appearance
4. **Implement smooth transitions** for better user experience
5. **Follow responsive patterns** for mobile-first design
6. **Maintain accessibility** with proper focus states and contrast
7. **Use consistent spacing** following the established scale
8. **Apply animations purposefully** to enhance UX without distraction
