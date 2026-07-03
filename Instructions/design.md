# PolarNest Mobile Design System & Product Specification

Version: 2.0
Platform: Expo / React Native
Design Philosophy: Modern Nordic Minimalism

---

# Vision

PolarNest is a premium personal home-management application that combines wardrobe management, food inventory, AI assistance, outfit planning and recipe management into one cohesive experience.

The redesign should preserve every existing workflow while elevating the visual experience to feel polished, premium and highly approachable.

The application should communicate:

* Clean
* Calm
* Intelligent
* Organized
* Modern
* Warm despite the dark theme

The design language should feel closer to Linear, Arc Browser, Notion Mobile, Apple Human Interface Guidelines and modern fintech applications than traditional Material Design.

---

# Design Principles

## Mobile First

Every screen should be optimized for one-handed usage.

Primary actions should remain within thumb reach whenever possible.

Large touch targets.

Generous spacing.

Minimal visual noise.

---

## Visual Style

Use a premium dark theme inspired by Nordic interiors instead of a flat black interface.

Characteristics:

* Frosted surfaces
* Soft gradients
* Rounded geometry
* Layered elevation
* Subtle shadows
* Gentle animations
* Large imagery
* Clean typography
* Minimal borders

Avoid heavy outlines.

Prefer depth through lighting and spacing.

---

# Color Palette

## Backgrounds

Primary Background

```
#0D1117
```

Secondary Surface

```
#161B22
```

Elevated Surface

```
#1F2630
```

Card Background

```
#202938
```

Overlay

```
rgba(0,0,0,0.45)
```

---

## Primary Accent

Polar Cyan

```
#3BC9F5
```

Hover

```
#67D8F8
```

Pressed

```
#28B5E5
```

Gradient

```
#44CFF5
→
#69A7FF
```

---

## Wardrobe Accent

```
#3BA4F5
```

Gradient

```
#318CE7
→
#4FD1FF
```

---

## Fridge Accent

```
#4FD08A
```

Gradient

```
#40C97A
→
#63E2A1
```

---

## Success

```
#46D37B
```

---

## Warning

```
#F2C94C
```

---

## Error

```
#F56A6A
```

---

## Text

Primary

```
#F5F7FA
```

Secondary

```
#B8C1CC
```

Muted

```
#8A95A6
```

Disabled

```
#5E6978
```

---

# Typography

Headings should feel spacious.

Use medium weights instead of bold whenever possible.

Example scale:

Display

32

H1

28

H2

24

H3

20

Body

16

Caption

14

Small Labels

12

---

# Spacing System

Base unit

8

Spacing scale

```
4
8
12
16
24
32
40
48
64
```

Cards should breathe.

Avoid dense layouts.

---

# Border Radius

Buttons

16

Cards

24

Bottom Sheets

28

Inputs

18

Chips

999

Images

20

---

# Elevation

Cards should not rely on borders.

Instead use:

* subtle shadow
* layered surfaces
* slight highlight

---

# Icons

Use outlined icons with slightly thicker strokes.

Preferred style:

Rounded

Large

Minimal

Avoid filled icons except notifications.

---

# Components

## Buttons

### Primary

Large rounded pill

Polar Cyan gradient

White text

Soft glow

---

### Secondary

Glass background

Subtle border

Muted text

---

### Danger

Soft red background

Rounded pill

---

### Success

Green gradient

Rounded pill

---

# Inputs

Rounded.

Filled.

Soft surface.

Optional leading icon.

Floating label preferred.

No uppercase labels.

Placeholder text uses muted gray.

---

# Chips

Rounded pills.

Animated selection.

Variants:

* Filter
* Tag
* Active
* Success
* Error
* Disabled

---

# Cards

Every card should have:

24px radius

Soft shadow

Large internal padding

Optional image header

---

# Animations

Use short spring animations.

Examples:

Card press

95% scale

Button ripple

Fade transitions

Slide navigation

Chip selection animation

Image loading fade

Empty state illustration fade

---

# Navigation

Bottom navigation should float above content.

Rounded container.

Blurred background.

Large active indicator.

Icons animate when selected.

---

# Screen Specifications

---

# 1 Login / Register

Purpose

Authentication.

Layout

Top

Language selector

English

Romanian

Segmented rounded control.

Center

PolarNest logo

Large title

Short welcoming subtitle.

Bottom

Large authentication card.

Contains:

Email

Password

Forgot password

Primary action

Secondary toggle action

Validation

Footer

Visual improvements

Soft gradient behind logo.

Animated card appearance.

Large spacing.

Minimal borders.

---

# 2 Tutorial

Background

Full-screen wardrobe photography.

Dark blur overlay.

Three swipeable slides.

Centered glass card.

Contains:

Illustration

Title

Description

Footer

Pagination

Primary CTA

Skip button floats top right.

---

# 3 Home

Split vertically.

Upper module

Wardrobe

Large illustration

Blue gradient

Rounded corners

Lower module

Fridge

Green gradient

Both panels feel like premium dashboard tiles.

Tap animation.

Parallax optional.

---

# 4 Wardrobe Library

Header

Greeting

Title

Subtitle

Optional Try-On banner.

Toolbar

Search

Filter chips

Tag chips

Grid/List toggle

Add Item button

Cards

Large image

Gradient overlay

Item title

Metadata

Actions

Edit

Try On

Delete

Empty state

Illustration

Helpful text

CTA

---

# 5 Add/Edit Wardrobe

Large image upload section.

Drag-and-drop feel.

Preview card.

Inputs grouped into sections.

General

Image

Appearance

Tags

Save button sticks near bottom.

Cancel remains subtle.

---

# 6 Try On

Header

Title

Suggestion button

Sections

Top

Middle

Bottom

Each behaves as draggable shelves.

Cards

Image

Layer badge

Delete

Bottom

Configuration management

Input

Save

Configuration chips

Active highlight

Delete action

---

# 7 Fridge

Very similar to Wardrobe.

Food cards additionally display:

Expiration indicator

Freshness badge

Calories

Quantity

History mode changes actions.

Use subtle freshness colors.

---

# 8 Add/Edit Fridge

Same form language.

Organize into:

General

Nutrition

Expiration

Tags

Image

Large Save button.

---

# 9 Receipt Import

Step 1

Upload receipt

Step 2

AI Processing

Animated progress indicator.

Step 3

Review extracted products.

Each product expands into editable card.

Completion

Save all.

Celebrate with success animation.

---

# 10 Recipes

Recipe cards

Large title

Calories

Portions

Ingredients grouped into:

Available

Missing

Color coding:

Green

Red

Edit action

Pinned pagination.

---

# 11 Recipe Details

Hero section

Recipe image placeholder

Title

Calories

Portions

Instructions

Ingredient groups

Back button

Recipe editor mirrors same styling.

---

# 12 Assistant

Conversation style

Friendly.

Modern.

Empty state illustration.

Messages

Assistant

Dark rounded card

User

Cyan gradient bubble

Composer

Rounded multiline input

Floating send button

Typing indicator

Streaming animation

Optional suggested prompts.

---

# 13 Settings

Sections

Account

Language

AI

Appearance (future)

About

Sign Out

Segmented controls should animate.

API Key field only appears in Cloud mode.

Save confirmation uses success toast.

---

# Navigation

Global

Home

Settings

Wardrobe Module

Home

Wardrobe

Try On

Assistant

Settings

Fridge Module

Home

Fridge

Recipes

Assistant

Settings

Tab Bar

Floating.

Rounded.

Blurred.

Active indicator uses Polar Cyan.

Icons slightly enlarge when active.

---

# Accessibility

Minimum touch target

48x48

High contrast text.

Dynamic font support.

Screen reader labels.

Reduced motion compatibility.

---

# AI Experience

Assistant should feel integrated throughout the application.

AI suggestions should appear as lightweight recommendation cards instead of intrusive dialogs.

Wardrobe suggestions:

* Outfit recommendations
* Seasonal recommendations
* Color matching

Fridge suggestions:

* Expiring foods
* Shopping recommendations
* Recipe suggestions

---

# Future Enhancements

* Dynamic themes
* Weather-aware outfit suggestions
* Calendar integration
* Grocery planning
* Nutrition dashboard
* Barcode scanning
* Camera-first inventory capture
* Smart notifications
* Offline-first synchronization

---

# Overall Experience Goal

The redesigned PolarNest experience should feel premium, cohesive and intelligent while preserving all existing functionality and workflows. Users should perceive the application as a polished personal assistant rather than a collection of inventory screens. Every interaction should reinforce clarity, calmness and confidence through thoughtful spacing, refined motion, accessible layouts and a consistent Nordic-inspired visual language.
