# Lumat-Color Quick Reference

> One-page cheat sheet for rapid development

**Version**: 1.0.0 | **Last Updated**: December 14, 2025

---

## 🚀 Quick Start (30 seconds)

```bash
npm install && npm run dev
# Open http://localhost:5173
# Click "+ Add Scale" → Adjust Hue/Chroma → Export
```

---

## 🎨 OKLCH Cheat Sheet

| Component     | Range  | Visual Guide                                   |
| ------------- | ------ | ---------------------------------------------- |
| **L**ightness | 0-100  | 98=near white, 50=medium, 14=near black        |
| **C**hroma    | 0-0.4  | 0=gray, 0.05=subtle, 0.15=vibrant, 0.3=intense |
| **H**ue       | 0-360° | 0=red, 120=green, 240=blue                     |

**Typical Values:**

- UI Backgrounds: L85-98, C0.02-0.08
- Interactive Elements: L40-70, C0.10-0.20
- Text: L20-30 (dark) or L95-98 (light), C0.05-0.10
- Neutrals: L14-98, C0.005-0.015

---

## 🎯 Contrast Mode Decision Tree

```
Need consistent text contrast across hues? → APCA Fixed
Need grayscale-matching colors? → Luminance Matched
Need maximum vibrancy? → Standard
Need specific APCA Lc value? → APCA Target
Need specific WCAG ratio? → WCAG Target
```

---

## 📊 Accessibility Thresholds

| Standard        | Normal Text | Large Text | Use Case               |
| --------------- | ----------- | ---------- | ---------------------- |
| **WCAG AA**     | 4.5:1       | 3:1        | Minimum compliance     |
| **WCAG AAA**    | 7:1         | 4.5:1      | Enhanced accessibility |
| **APCA Bronze** | 60 Lc       | 45 Lc      | Modern standard        |
| **APCA Silver** | 75 Lc       | 60 Lc      | Body text              |
| **APCA Gold**   | 90 Lc       | 75 Lc      | Fine print             |

---

## 🎛️ Power Curve Presets

| Goal                | Hue Power       | Chroma Power | Result                      |
| ------------------- | --------------- | ------------ | --------------------------- |
| Natural falloff     | 1.0             | 1.2-1.5      | Peak chroma at midtones     |
| Warm darks          | 0.7-0.9 + shift | 1.0          | More yellow/orange in darks |
| Cool lights         | 1.1-1.3 + shift | 1.0          | More blue in lights         |
| Constant saturation | 1.0             | 1.0          | Linear chroma               |
| Desaturated darks   | 1.0             | 1.5-2.0      | Less chroma in darks        |

---

## 📤 Export Format Comparison

| Format            | Size   | Use Case                      | Includes Metadata |
| ----------------- | ------ | ----------------------------- | ----------------- |
| **CSS Variables** | Small  | Direct stylesheet integration | ✅ Comments       |
| **JSON**          | Medium | Build tools, databases        | ✅ Full data      |
| **Markdown**      | Medium | Documentation, wikis          | ✅ Formatted      |
| **DTCG Tokens**   | Small  | Figma Tokens Studio           | ❌ Minimal        |
| **SVG**           | Large  | Presentations, print          | ❌ Visual only    |
| **HTML**          | Large  | Client reviews                | ✅ Interactive    |
| **CSV**           | Small  | Spreadsheets, analysis        | ✅ Precise ratios |

---

## ⌨️ Keyboard Shortcuts

| Action          | Shortcut       | Context                  |
| --------------- | -------------- | ------------------------ |
| Close Dialog    | `ESC`          | Export modal, any dialog |
| Exit Fullscreen | `ESC`          | Matrix view fullscreen   |
| Copy Color      | Click swatch   | Swatch view              |
| Copy Cell       | Click cell     | Matrix view              |
| Add Scale       | Sidebar button | Project view             |
| Rename Scale    | Click name     | Sidebar                  |

---

## 🔧 Common Workflows

### Create Accessible Brand Color

```
1. Set Hue to brand color (e.g., 220° blue)
2. Set Chroma to 0.15-0.20
3. Select APCA Fixed mode
4. Choose white background
5. Check Analysis view for ≥60 Lc
6. Export CSS Variables
```

### Build Neutral Palette

```
1. Select Grayscale Profile (Cool Gray)
2. Set Chroma to 0.008-0.012
3. Use Luminance Matched mode
4. Verify grayscale appearance
5. Export JSON for design system
```

### Fix Contrast Issue

```
1. Select failing scale
2. Set background color
3. Click Auto-Fix WCAG AA (or AAA)
4. Review changes in Analysis view
5. Adjust Chroma if needed
6. Re-export
```

### Detect Color Banding

```
1. Switch to Gradient view
2. Select Linear mode
3. Observe for visible bands
4. If banding: Increase steps or adjust curves
5. Use Animated mode to verify smooth transitions
```

---

## 🐛 Troubleshooting (1-line fixes)

| Issue                        | Fix                                                      |
| ---------------------------- | -------------------------------------------------------- |
| Colors too dark after export | P3 gamut clamping - reduce chroma or check Analysis view |
| Matrix cells too small       | Use Zoom controls (0.5x-2x) or toggle fullscreen         |
| Auto-fix does nothing        | Scale already meets threshold or background incorrect    |
| Gradient shows banding       | Increase lightness steps (use Extreme preset)            |
| Export disabled              | No scale selected - click scale in sidebar               |
| Dev server won't start       | Ensure Node 22+ installed (`nvm use 22`)                 |

---

## 📐 Matrix View Math

**Cell Size Formula:**

```javascript
cellSize = Math.max(
  40,
  Math.min(
    (containerWidth - padding - gaps) / (numColumns + 1), // +1 for label
    (containerHeight - padding - gaps) / numRows,
    120 // Maximum size
  )
);
```

**Grid Template:**

```
[Label Column: cellSize px] [Cell 1: cellSize px] ... [Cell N: cellSize px]
```

---

## 🎨 Preset Comparison

| Preset            | Steps | L Range | Use Case                  |
| ----------------- | ----- | ------- | ------------------------- |
| **Standard**      | 15    | 98-14   | General-purpose, balanced |
| **High Contrast** | 13    | 98-12   | Accessibility-first       |
| **Subtle**        | 11    | 97-30   | Minimal hierarchy         |
| **Extreme**       | 19    | 99-5    | Maximum range, technical  |

---

## 🔗 Essential Links

- **Full Docs**: [DOCUMENTATION.md](DOCUMENTATION.md)
- **Changelog**: [CHANGELOG.md](CHANGELOG.md)
- **OKLCH Info**: https://oklch.com
- **APCA Docs**: https://git.apcacontrast.com
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- **Radix UI**: https://www.radix-ui.com/themes
- **Culori**: https://culorijs.org

---

## 💡 Pro Tips

1. **Use APCA Fixed for UI text** - Consistent contrast across hues
2. **Test on Matrix View** - Verify opacity variations before export
3. **Enable Chroma Compensation** - Maintains vibrancy when fixing contrast
4. **Use Grayscale Profiles for neutrals** - Subtle tint prevents blandness
5. **Check Analysis View delta metrics** - ΔE < 5 indicates smooth scale
6. **Export multiple formats** - CSS for dev, JSON for tools, Markdown for docs
7. **Use Linear Gradient** - Best for detecting banding issues
8. **Global lightness scale** - Ensures consistent naming (blue-60, red-60)
9. **Save projects regularly** - Export project JSON as backup
10. **Browser DevTools** - Use color picker to verify P3 gamut rendering

---

**Built with** ❤️ **by Cody Fitzgerald**
For detailed information, see [DOCUMENTATION.md](DOCUMENTATION.md)
