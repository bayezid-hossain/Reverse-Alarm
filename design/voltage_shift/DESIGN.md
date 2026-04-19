# Design System: Industrial Urgency

## 1. Overview & Creative North Star
**The Creative North Star: "Tactile Brutalism"**

This design system is built to disrupt. It rejects the soft, rounded aesthetic of modern consumer apps in favor of a high-energy, industrial interface that demands immediate action. The "Reverse Alarm" concept requires a psychological shift—moving from passive consumption to active urgency. 

We break the "template" look through **Intentional Asymmetry** and **Massive Scale Contrast**. Layouts should feel like a cockpit or a piece of heavy machinery: precise, high-contrast, and unapologetically sharp. By utilizing a strictly 0px border-radius and dramatic typographic scales, we create a digital environment that feels physical, looming, and essential.

## 2. Colors & Surface Logic

### The Palette
The color strategy relies on a "Vantablack" core (`surface` #0e0e0e) interrupted by aggressive "Caution" signals. 
- **Primary (#ff9069 / #fe5e1e):** The "Heat." Used for the most critical action states and countdowns.
- **Secondary (#eaea00):** The "Warning." Used for state changes and mid-level urgency.
- **Tertiary (#9cff93):** The "Clearance." Used exclusively for successful deactivation or safe states.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define a section, use background shifts. A `surface-container-low` (#131313) block should sit directly against a `surface` (#0e0e0e) background. The eye should perceive the boundary through tonal change, not a drawn line.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked obsidian plates.
- **Base Layer:** `surface` (#0e0e0e).
- **Secondary Containers:** `surface-container` (#1a1a1a) for grouped content.
- **Action Plates:** `surface-container-highest` (#262626) for interactive elements like input fields or toggle backgrounds.

### The "Glass & Gradient" Rule
To prevent the UI from feeling "flat" or "cheap," use **Anodic Gradients**. CTAs should transition from `primary_fixed_dim` (#fe5e1e) to `primary` (#ff9069) at a 45-degree angle. For floating overlays, use a `surface_variant` at 60% opacity with a heavy `backdrop-filter: blur(20px)` to create a "Smoked Glass" effect.

## 3. Typography
The typography is the backbone of the urgency. We use a dual-font system to balance industrial grit with readable data.

*   **Display & Headlines (Space Grotesk):** This is our "Industrial" voice. It is wide, geometric, and aggressive. Use `display-lg` for active countdowns and `headline-lg` for system states. All Display and Headline text must be **Uppercase** to reinforce the "Alert" nature of the app.
*   **Body & Titles (Inter):** This is our "Functional" voice. Inter provides high legibility for settings, descriptions, and fine print. It balances the "loudness" of Space Grotesk with neutral clarity.

**Hierarchy as Identity:** The massive gap between `display-lg` (3.5rem) and `label-sm` (0.68rem) creates a sense of "Information Density"—making the app feel like a professional tool rather than a toy.

## 4. Elevation & Depth

### The Layering Principle
Depth is achieved through **Tonal Stepping**. 
- To make an element "pop," do not use a shadow; instead, drop the background behind it to `surface_container_lowest` (#000000) and keep the element at `surface_bright` (#2c2c2c).

### Ambient Shadows
If a floating element (like a critical modal) requires a shadow, it must be an **Atmospheric Glow**. 
- Shadow: `0px 20px 40px rgba(0, 0, 0, 0.8)`. 
- For an active alarm state, the shadow should be tinted: `0px 0px 30px rgba(254, 94, 30, 0.2)` to simulate a neon glow reflecting off the surface.

### The "Ghost Border" Fallback
Where separation is functionally required but a color shift is too subtle, use a **Ghost Border**: 
- `outline-variant` (#484847) at **15% opacity**. This creates a "machined" edge that looks etched into the screen rather than drawn on top.

## 5. Components

### Buttons (Tactile Triggers)
*   **Primary:** Solid `primary_fixed_dim`. 0px radius. Heavy `label-md` uppercase text.
*   **Secondary:** Ghost style. `outline` color, 0px radius, with a subtle `surface_container_high` hover state.
*   **States:** On press, the button should invert (Background becomes `on_primary_fixed`, text becomes `primary`).

### Cards & Lists
*   **The Divider Ban:** Never use lines. Use a 16px or 24px vertical gap to separate list items.
*   **Active List Item:** An active alarm in a list should have a 4px left-aligned vertical stripe of `secondary` (#eaea00) to indicate its "Armed" status.

### Input Fields
*   Filled style only. Background: `surface_container_highest`. 
*   **Bottom Indicator:** A 2px high bar of `outline` that turns `primary` on focus. No rounded corners.

### The "Urgency Meter" (Custom Component)
A thick, segmented progress bar (12px height) using the `tertiary` color. As the "Reverse Alarm" nears its trigger, the segments should shift from `tertiary` to `secondary` to `error` in a jarring, non-stepped transition.

## 6. Do's and Don'ts

### Do:
*   **Do** use 0px border radius for everything. Sharp corners imply precision.
*   **Do** embrace "Empty Space." Large gaps of `#0e0e0e` make the neon elements feel more dangerous and urgent.
*   **Do** use extreme type scales. If a number is important (like a timer), make it uncomfortably large.

### Don't:
*   **Don't** use soft shadows or "cute" animations. Transitions should be fast (150ms) and linear or "Step" based.
*   **Don't** use 100% opaque borders. They clutter the industrial aesthetic.
*   **Don't** use centered layouts for everything. Use left-aligned, heavy-weighted grids to create a "Technical Manual" feel.
*   **Don't** use "Blue" for anything. In this system, blue represents calm; we are building for energy and action. Use `primary` (Orange) or `secondary` (Yellow).