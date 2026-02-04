# Jenkins Library Design System

## Philosophy

The Jenkins Library design system creates a warm, bookish, homey aesthetic inspired by an old house library with soft afternoon light. The visual language emphasizes:

- **Warmth**: Off-white and cream backgrounds feel aged and inviting like parchment
- **Coziness**: Soft, diffuse shadows and subtle borders create depth without harshness
- **Bookishness**: Typography and spacing optimize for comfortable, extended reading
- **Restraint**: Muted colors and minimal decoration feel vintage and calm
- **Accessibility**: High contrast and clear hierarchy ensure readability

## Color Palette

### Primary Colors (inspired by old house aesthetic)

- **Parchment (#faf7f2)**: Warm off-white main background, like aged paper
- **Cream (#f5f1e8)**: Soft cream for secondary surfaces and containers
- **Charcoal (#2c2c2c)**: Deep ink-like text color with excellent readability

### Accent Colors (library aesthetic)

- **Sage (#7a8b6f)**: Muted eucalyptus green - primary interactive element, like trees outside a library window
- **Sage Light (#a4b598)**: Lighter sage for subtle accents and hover states
- **Sage Dark (#5a6b4f)**: Deep sage for emphasis and active states
- **Brass (#c9a96e)**: Soft warm brass/tan accent, like warm metal fixtures
- **Wood (#8b7355)**: Warm wood brown for rich accents, reference to book bindings

### Neutral Colors (supporting palette)

- **Warm Gray (#e8e6e0)**: Light warm gray for borders and subtle dividers
- **Warm Gray Light (#f0ede7)**: Very light for minimal background differentiation

## Typography

### Font Families

- **Display Font**: Fraunces (serif) - Slightly characterful with restraint, used for headings. Creates a print/library feel without being excessive
- **Body Font**: Inter (humanist sans-serif) - Clean and readable for extended reading sessions

### Type Scale & Usage

- **H1**: 3xl/4xl, 1.2 line-height - Page titles
- **H2**: 2xl/3xl, 1.3 line-height - Section headings
- **H3**: xl/2xl, 1.4 line-height - Subsection headings
- **Body**: 1rem, 1.6 line-height - Default paragraph text, optimized for reading
- **Body (relaxed)**: 1.75 line-height - For longer reading passages

### Text Color

- Primary: Charcoal (#2c2c2c) - Deep, sophisticated, ink-like
- Secondary: Charcoal/70 opacity - Muted for less emphasis
- Links: Sage green - Clear but calm, hover state uses darker sage

## UI Components

### Buttons

- **Primary Buttons**: Sage background with white text, soft shadows, subtle rounded corners (8px)
- **Hover State**: Darker sage background with enhanced shadow
- **Active State**: Reduced shadow for "pressed" feeling
- **Secondary Buttons**: Transparent with sage text, warm gray background on hover

### Forms

- **Inputs**: Cream background (#f5f1e8), warm gray border, subtle soft shadow
- **Focus State**: White background, sage border, light sage ring
- **Textarea**: Same styling as inputs for consistency

### Cards & Surfaces

- **Background**: White or cream
- **Border**: Warm gray, 1px
- **Shadow**: Soft diffuse shadows (4-24px, rgba(44,44,44,0.06-0.1))
- **Rounded Corners**: 8-12px, subtle not aggressive

### Navigation

- **Active State**: Warm gray light background with charcoal text
- **Hover State**: Same styling approach, transitions smooth at 200ms
- **Inactive**: Charcoal text at 70% opacity

## Spacing & Whitespace

- Used generously around the logo to create calm, breathing room
- Grid gaps: 4-6px for tight groupings, 8-16px for distinct sections
- Padding: 12-16px for internal container spacing

## Shadows

- **Soft Shadow**: `0 4px 12px rgba(44, 44, 44, 0.06)` - Default for most elements
- **Medium Shadow**: `0 8px 16px rgba(44, 44, 44, 0.08)` - Cards and containers
- **Large Shadow**: `0 12px 24px rgba(44, 44, 44, 0.1)` - Modal-like prominence

All shadows use charcoal at low opacity for consistency and warmth.

## Design Patterns

### The Logo Space

The house logo is surrounded by generous whitespace. The header uses:

- Cream background (#f5f1e8) to complement the logo
- 24px gap between logo and title
- Minimal vertical padding (8px) to prevent compression
- The logo maintains its natural aspect ratio

### Interactive Patterns

- Buttons transition at 200ms duration for smooth, calm interactions
- Focus states use ring shadows for accessibility without harshness
- Hover states intensify existing colors rather than introducing new ones

### Reading Comfort

- Maximum line width of 65 characters (optimal for comfortable reading)
- Leading (line-height) ranges from 1.4 (headings) to 1.75 (body text)
- Letter spacing is increased slightly (0.3px) for print-like quality

## Accessibility

- Text color contrast (charcoal on cream/white): WCAG AAA compliant
- Focus states use visible rings with good contrast
- Interactive elements have clear affordances
- Buttons maintain semantic size for easy clicking

## Implementation

All styles are implemented via:

- **CSS Custom Properties** in `src/index.css` for easy theming
- **Tailwind Config** extensions in `tailwind.config.ts` for component integration
- **Global Styles** applied consistently across all pages

This system maintains warmth and accessibility while avoiding bright, saturated, or playful tones that would clash with the old library aesthetic.
