# NIHUB Brand Guide

## Brand Palette (source of truth: `colors.json`)

| Token | Value | Usage |
|---|---|---|
| `primary.deep` | `#70008B` | Logo, headings, dark UI |
| `primary.main` | `#8B2CBA` | Buttons, CTAs |
| `primary.light` | `#8E24AA` | Accents, highlights |
| `secondary.value` | `#0059BB` | Links, secondary actions |
| `error.value` | `#BA1A1A` | Errors, deny buttons |
| `success.value` | `#0070EA` | Success states |
| `background.surface` | `#F8F9FA` | App background |
| `background.card` | `#FFFFFF` | Card backgrounds |
| `background.dark` | `#2E3132` | Scanner/dark backgrounds |
| `text.primary` | `#191C1D` | Main body text |
| `text.secondary` | `#504251` | Secondary text |
| `text.muted` | `#827282` | Placeholders, hints |
| `text.onDark` | `#FFFFFF` | Text on dark backgrounds |
| `border.default` | `#E5E7EB` | Default borders |
| `border.light` | `#D3C1D2` | Input focus, light borders |
| `border.card` | `#E7E8E9` | Card borders |

## Typography

- **Display**: Plus Jakarta Sans — used for web headings, logo
- **UI**: Inter — used for mobile and body text

## Logo Variants

| File | When to use |
|---|---|
| `logo.svg` | Default on light backgrounds |
| `logo-mono.svg` | On dark backgrounds (dark bg sections, photos) |
| `logo-mark.svg` | Standalone icon (favicon, app icon mark only) |

## Generating Assets

- **Web favicon**: Use `logo-mark.svg` or extract the geometric mark as a 32×32 SVG
- **Mobile app icon**: Generate PNG from `logo.svg` at 512×512 for Play Store; use `logo-mark.svg` for the launcher icon
- **Email logo**: Attach `logo.svg` as an inline CID image (`cid:logo`) in HTML emails

## Updating Colors

When updating colors:
1. Edit `brand/colors.json`
2. Propagate values to:
   - `frontend/src/brand.css` (CSS variables)
   - `mobile/lib/core/theme/app_theme.dart` (Flutter `Color` constants)
   - `server/brand/email-template.html` (inline styles in email template)
3. Ensure all three clients reference the same hex values