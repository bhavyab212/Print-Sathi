# Handoff Report: Boxicons to Lucide React Mapping

## Observation

We scanned four key files in the project to identify all generic Boxicons (`bx`, `bx-`, `bxs-`, or `bxl-` class prefixes) and map them to their corresponding Lucide React components and Tailwind CSS styles.

The files investigated were:
1. `apps/web/src/app/page.tsx` (17 occurrences)
2. `apps/web/src/app/s/[slug]/page.tsx` (67 occurrences)
3. `apps/web/src/app/dashboard/page.tsx` (42 occurrences)
4. `apps/web/src/app/admin/AdminPanelClient.tsx` (16 occurrences)

Across these four files, we found a total of **142 Boxicon occurrences**.

---

### MAPPING TABLES BY FILE

#### 1. apps/web/src/app/page.tsx (17 occurrences)

| Line | Original Boxicon Class / String | Proposed Lucide React Component | Recommended Tailwind CSS Classes | Context / Notes |
|---|---|---|---|---|
| 17 | `bx-id-card` (string) | `IdCard` | `h-6 w-6 text-white` | Feature card array icon definition |
| 25 | `bx-calculator` (string) | `Calculator` | `h-6 w-6 text-white` | Feature card array icon definition |
| 32 | `bx-file` (string) | `FileText` | `h-6 w-6 text-white` | Feature card array icon definition |
| 39 | `bx-qr` (string) | `QrCode` | `h-6 w-6 text-white` | Feature card array icon definition |
| 49 | `bx-qr-scan` (string) | `ScanQrCode` | `h-6 w-6 text-white` | Steps array icon definition |
| 54 | `bx-list-check` (string) | `ListChecks` | `h-6 w-6 text-white` | Steps array icon definition |
| 59 | `bx-printer` (string) | `Printer` | `h-6 w-6 text-white` | Steps array icon definition |
| 73 | `bx bx-printer text-xl text-white` | `Printer` | `h-5 w-5 text-white` | Logo header icon |
| 82 | `bx bx-right-arrow-alt text-base` | `ArrowRight` | `h-4 w-4` | Shop Login button icon |
| 100 | `bx bx-rocket text-[var(--ps-primary)]` | `Rocket` | `h-4 w-4 text-[var(--ps-primary)]` | Shimmer badge in hero |
| 130 | `bx bx-right-arrow-alt text-lg` | `ArrowRight` | `h-5 w-5` | CTA primary button icon |
| 145 | `bx bx-check-circle text-[var(--ps-success)]` | `CheckCircle` | `h-4 w-4 text-[var(--ps-success)]` | Badge bullet in hero |
| 149 | `bx bx-check-circle text-[var(--ps-success)]` | `CheckCircle` | `h-4 w-4 text-[var(--ps-success)]` | Badge bullet in hero |
| 204 | `bx bx-heart` | `Heart` | `h-4 w-4` | Loved badge icon |
| 262 | `bx bx-right-arrow-alt text-lg` | `ArrowRight` | `h-5 w-5` | CTA footer button icon |
| 268 | `bx bxl-windows text-lg` | `Monitor` or `Laptop` | `h-5 w-5` | CTA footer button icon (Lucide lacks brand logos) |
| 283 | `bx bx-printer text-white` | `Printer` | `h-4 w-4 text-white` | Logo footer icon |

---

#### 2. apps/web/src/app/s/[slug]/page.tsx (67 occurrences)

| Line | Original Boxicon Class / String | Proposed Lucide React Component | Recommended Tailwind CSS Classes | Context / Notes |
|---|---|---|---|---|
| 94 | `bxs-file-pdf` (string) | `FileText` | Dynamic size / color | File type badge mapper (PDF) |
| 95 | `bxs-image` (string) | `Image` | Dynamic size / color | File type badge mapper (Image) |
| 96 | `bxs-file-doc` (string) | `FileText` | Dynamic size / color | File type badge mapper (Word) |
| 97 | `bxs-spreadsheet` (string) | `FileSpreadsheet` | Dynamic size / color | File type badge mapper (Excel) |
| 98 | `bxs-slideshow` (string) | `Presentation` | Dynamic size / color | File type badge mapper (PPT) |
| 99 | `bxs-file` (string) | `File` | Dynamic size / color | File type badge mapper (Fallback) |
| 167 | `bx-check-circle` (string) | `CheckCircle` | Dynamic size / color | `addToast` default icon parameter |
| 263 | `bx-paperclip` (string) | `Paperclip` | Dynamic size / color | `addToast` call (file added) |
| 305 | `bx-x-circle` (string) | `XCircle` | Dynamic size / color | `addToast` call (file removed) |
| 319 | `bx-layer` (string) | `Layers` | Dynamic size / color | `addToast` call (group slot assigned) |
| 319 | `bx-minus-circle` (string) | `MinusCircle` | Dynamic size / color | `addToast` call (separate print assigned) |
| 506 | `bx bx-printer text-3xl text-slate-800 dark:text-white` | `Printer` | `h-8 w-8 text-slate-800 dark:text-white` | Initialization loader page |
| 518 | `bx bx-error-circle text-5xl text-red-400 mb-4` | `AlertCircle` | `h-12 w-12 text-red-400 mb-4` | Shop not found error page |
| 559 | `bx ${t.icon} text-sm text-emerald-400` | Dynamic (Mapped Component) | `h-3.5 w-3.5 text-emerald-400` | Render toast loop |
| 581 | `bx bx-upload text-5xl text-emerald-400` | `Upload` | `h-12 w-12 text-emerald-400` | Drag-and-drop placeholder icon |
| 593 | `bx bx-arrow-back text-2xl` | `ArrowLeft` | `h-6 w-6` | Crop modal back button |
| 642 | `bx bx-x text-2xl` | `X` | `h-6 w-6` | Passport modal close button |
| 681 | `bx bx-printer text-slate-800 dark:text-white text-lg` | `Printer` | `h-5 w-5 text-slate-800 dark:text-white` | Header print icon |
| 698 | `bx bx-help-circle text-xl` | `HelpCircle` | `h-5 w-5` | Header help guide trigger |
| 700 | `bx bx-dots-vertical-rounded text-xl ...` | `MoreVertical` | `h-5 w-5 text-slate-500 dark:text-white/40 hover:text-slate-800 dark:text-white cursor-pointer transition` | Header menu trigger |
| 708 | `bx-paperclip` (string) | `Paperclip` | Dynamic size / color | Steps array icon (Upload) |
| 709 | `bx-edit` (string) | `Edit2` | Dynamic size / color | Steps array icon (Notes) |
| 710 | `bx-check-double` (string) | `CheckCheck` | Dynamic size / color | Steps array icon (Review) |
| 711 | `bx-check-circle` (string) | `CheckCircle` | Dynamic size / color | Steps array icon (Done) |
| 725 | `bx ${done ? 'bx-check' : s.icon} text-xs` | Dynamic (Mapped Component) | `h-3 w-3` | Step bubble icon renderer |
| 748 | `bx bx-store text-4xl text-slate-800 dark:text-white` | `Store` | `h-10 w-10 text-slate-800 dark:text-white` | Welcome overlay shop icon |
| 761 | `bx bx-right-arrow-alt text-xl` | `ArrowRight` | `h-5 w-5` | Welcome start chat button icon |
| 793 | `bx bx-printer text-slate-800 dark:text-white text-xs` | `Printer` | `h-3 w-3 text-slate-800 dark:text-white` | Bot typing bubble icon |
| 809 | `bx bx-loader-alt animate-spin text-sm` | `Loader2` | `h-3.5 w-3.5 animate-spin` | Queue status loading spinner |
| 819 | `bx bx-printer text-slate-800 dark:text-white text-xs` | `Printer` | `h-3 w-3 text-slate-800 dark:text-white` | System message print icon |
| 823 | `bx bx-receipt text-slate-800 dark:text-white text-lg` | `Receipt` | `h-4.5 w-4.5 text-slate-800 dark:text-white` | System message invoice icon |
| 841 | `bx bxs-file-pdf text-sm` | `FileText` | `h-3.5 w-3.5` | PDF group indicator |
| 870 | `bx bx-paper-plane text-lg` | `Send` | `h-4.5 w-4.5` | Action button send |
| 945 | `bx bx-x text-sm` | `X` | `h-3.5 w-3.5` | Remove file icon |
| 956 | `bx bxs-file-pdf text-xs text-slate-400 dark:text-white/30 shrink-0` | `FileText` | `h-3 w-3 text-slate-400 dark:text-white/30 shrink-0` | Attached file list item PDF |
| 986 | `bx bx-paperclip text-2xl rotate-[-45deg]` | `Paperclip` | `h-6 w-6 -rotate-45` | Attach button paperclip |
| 1016 | `bx bx-send text-lg` | `Send` | `h-4.5 w-4.5` | Action send icon |
| 1038 | `bx bx-plus text-lg` | `Plus` | `h-4.5 w-4.5` | Add new group button icon |
| 1053 | `bx bx-layer text-lg` | `Layers` | `h-4.5 w-4.5` | Open group organiser button |
| 1068 | `bx bx-check-circle text-lg` | `CheckCircle` | `h-4.5 w-4.5` | Send files checklist button |
| 1108 | `bx bx-help-circle text-2xl` | `HelpCircle` | `h-6 w-6` | Guidance banner help icon |
| 1229 | `bx bx-x text-sm` | `X` | `h-3.5 w-3.5` | Guidance close banner button |
| 1255 | `bx-layer` (string) | `Layers` | Dynamic size / color | Coach-marks layout step icon |
| 1264 | `bx bx-right-arrow-alt text-2xl` | `ArrowRight` | `h-6 w-6` | Steps next arrow divider |
| 1270 | `bx-grid-alt` (string) | `LayoutGrid` | Dynamic size / color | Coach-marks layout step icon |
| 1292 | `bxs-hand-right` (string) | `Pointer` or `Hand` | Dynamic size / color | Coach-marks layout step icon |
| 1299 | `bx bx-layer text-lg` | `Layers` | `h-4.5 w-4.5` | Organize button icon |
| 1365 | `bx bx-layer text-lg` | `Layers` | `h-4.5 w-4.5` | Open organiser CTA button icon |
| 1371 | `bx bx-right-arrow-alt text-lg` | `ArrowRight` | `h-5 w-5` | Next CTA button icon |
| 1391 | `bxs-file-pdf` (string) | `FileText` | Dynamic size / color | Group slots icon mapping |
| 1392 | `bx-printer` (string) | `Printer` | Dynamic size / color | Separate slot print icon mapping |
| 1419 | `bx bx-x text-xs text-slate-600 dark:text-white/70` | `X` | `h-3 w-3 text-slate-600 dark:text-white/70` | Close organizer badge |
| 1456 | `bx bx-x text-2xl` | `X` | `h-6 w-6` | Organizer overlay close button |
| 1462 | `bx bx-info-circle text-lg shrink-0 mt-0.5` | `Info` | `h-4.5 w-4.5 shrink-0 mt-0.5` | Organizer info note icon |
| 1476 | `bx bxs-file-pdf text-xs` | `FileText` | `h-3 w-3` | PDF icon in organizer files list |
| 1521 | `bx bx-plus text-xs text-white/25` | `Plus` | `h-3 w-3 text-white/25` | Add to group trigger icon |
| 1585 | `bx bx-x text-xs` | `X` | `h-3 w-3` | Clear item overlay icon |
| 1627 | `bx bx-layer text-sm` | `Layers` | `h-3.5 w-3.5` | Item group badge tag icon |
| 1629 | `bx bx-chevron-${open ? 'up' : 'down'} text-sm ml-auto` | `ChevronUp`/`ChevronDown` | `h-3.5 w-3.5 ml-auto` | Dropdown panel trigger icon |
| 1647 | `bx bx-check ml-auto text-sm` | `Check` | `h-3.5 w-3.5 ml-auto` | Selected group check indicator |
| 1656 | `bx bx-minus text-xs` | `Minus` | `h-3 w-3` | Remove from group list item |
| 1659 | `bx bx-check ml-auto text-sm text-slate-500 dark:text-white/40` | `Check` | `h-3.5 w-3.5 ml-auto text-slate-500 dark:text-white/40` | Separate print check indicator |
| 1689 | `bx bx-printer text-slate-800 dark:text-white text-xs` | `Printer` | `h-3 w-3 text-slate-800 dark:text-white` | Group bubble print icon |
| 1707 | `bx bxs-file-pdf text-[10px]` | `FileText` | `h-2.5 w-2.5` | PDF label in group bubble |
| 1739 | `bx-layer` (string) | `Layers` | Dynamic size / color | Assigned group toast icon trigger |
| 1741 | `bx-minus-circle` (string) | `MinusCircle` | Dynamic size / color | Separate print toast icon trigger |
| 1815 | `bx bx-crop text-sm` | `Crop` | `h-3.5 w-3.5` | Crop / rotate action button |
| 1831 | `bx bx-id-card text-lg` | `IdCard` | `h-4.5 w-4.5` | Passport photo options badge |
| 1867 | `bx bx-check-double text-[10px]` | `CheckCheck` | `h-2.5 w-2.5` | Double check mark in message bubble |

---

#### 3. apps/web/src/app/dashboard/page.tsx (42 occurrences)

| Line | Original Boxicon Class / String | Proposed Lucide React Component | Recommended Tailwind CSS Classes | Context / Notes |
|---|---|---|---|---|
| 47 | `bxs-file-pdf` (string) | `FileText` | Dynamic size / color | File type icon mapping (PDF) |
| 48 | `bxs-image` (string) | `Image` | Dynamic size / color | File type icon mapping (Image) |
| 49 | `bxs-file-doc` (string) | `FileText` | Dynamic size / color | File type icon mapping (Word) |
| 50 | `bxs-spreadsheet` (string) | `FileSpreadsheet` | Dynamic size / color | File type icon mapping (Excel) |
| 51 | `bxs-slideshow` (string) | `Presentation` | Dynamic size / color | File type icon mapping (PPT) |
| 52 | `bxs-file-txt` (string) | `FileText` | Dynamic size / color | File type icon mapping (Text) |
| 53 | `bxs-file` (string) | `File` | Dynamic size / color | File type icon mapping (Fallback) |
| 387 | `bx bx-message-dots text-5xl` | `MessageSquareMore` | `h-12 w-12 text-[var(--ps-primary)]` | Dashboard empty queue state |
| 415 | `bx bx-arrow-back text-xl` | `ArrowLeft` | `h-5 w-5` | Job detail panel back button |
| 453 | `bx bx-trash text-lg` | `Trash2` | `h-4.5 w-4.5` | Delete job button icon |
| 478 | `bx bx-check-double` | `CheckCheck` | `h-4 w-4 text-[var(--ps-primary)]` | Job timestamp indicator |
| 520 | `bx bx-cog text-base` | `Settings` | `h-4 w-4` | Settings icon |
| 523 | `bx bx-show text-base` | `Eye` | `h-4 w-4` | Show preview action |
| 566 | `bx bx-id-card mr-1` | `IdCard` | `h-4 w-4 mr-1` | Passport tools indicator tag |
| 580 | `bx bx-bolt-circle text-sm` | `Zap` | `h-3.5 w-3.5` | Quick passport tab icon |
| 587 | `bx bx-slider text-sm` | `Sliders` | `h-3.5 w-3.5` | Custom passport layout tab icon |
| 595 | `bx bx-cut` | `Scissors` or `Sparkles` | `h-4 w-4` | Remove background button icon |
| 635 | `bx bx-loader-alt animate-spin text-xl` | `Loader2` | `h-5 w-5 animate-spin` | Reject button loading spinner |
| 636 | `bx bx-x text-xl` | `X` | `h-5 w-5` | Reject button reject cross |
| 647 | `bx bx-loader-alt animate-spin text-xl` | `Loader2` | `h-5 w-5 animate-spin` | Approve button loading spinner |
| 648 | `bx bx-check text-xl` | `Check` | `h-5 w-5` | Approve button check mark |
| 662 | `bx bx-loader-alt animate-spin text-2xl` | `Loader2` | `h-6 w-6 animate-spin` | Printer send loading spinner |
| 663 | `bx bx-printer text-2xl` | `Printer` | `h-6 w-6` | Send to printer action button |
| 675 | `bx bx-refresh text-xl` | `RefreshCw` | `h-5 w-5` | Reprint action button |
| 683 | `bx bx-check-double text-xl` | `CheckCheck` | `h-5 w-5` | Job completion button icon |
| 713 | `bx bx-printer text-white text-lg` | `Printer` | `h-4.5 w-4.5 text-white` | Topbar brand print icon |
| 773 | `bx bx-refresh text-lg ${isRefreshing ? 'animate-spin' : ''}` | `RefreshCw` | `h-4.5 w-4.5` (plus `animate-spin`) | Queue list manual refresh icon |
| 782 | `bx bx-qr-scan text-lg` | `ScanQrCode` | `h-4.5 w-4.5` | View Shop QR code button icon |
| 803 | `bx bx-search text-base` | `Search` | `h-4 w-4 text-[var(--ps-ink-subtle)]` | Queue search input field icon |
| 818 | `bx bx-filter-alt text-lg` | `ListFilter` | `h-4.5 w-4.5` | Queue filter list button icon |
| 827 | `bx bx-qr-scan text-3xl` | `ScanQrCode` | `h-7 w-7 text-[var(--ps-primary)]` | Queue empty scan badge icon |
| 892 | `bx bx-x text-xl` | `X` | `h-5 w-5` | QR modal close button |
| 973 | `bx bx-save text-lg` | `Save` | `h-4.5 w-4.5` | Save settings action icon |
| 994 | `bx bxs-file-blank text-2xl shrink-0` | `File` | `h-6 w-6 shrink-0 text-[var(--ps-primary)]` | PDF print item panel placeholder |
| 1011 | `bx bx-fullscreen` | `Maximize2` | `h-4 w-4` | Full screen preview icon |
| 1019 | `bx bx-download` | `Download` | `h-4 w-4` | Download preview icon |
| 1027 | `bx bx-x text-xl` | `X` | `h-5 w-5` | Preview modal close icon |
| 1038 | `bx bxs-file-doc text-5xl` | `FileText` | `h-12 w-12 text-[var(--ps-warning)]` | Word preview placeholder |
| 1051 | `bx bx-download text-xl` | `Download` | `h-5 w-5` | Document print panel download icon |
| 1085 | `bx bx-loader-alt animate-spin text-3xl` | `Loader2` | `h-8 w-8 animate-spin text-[var(--ps-primary)]` | Preview loader placeholder |
| 1102 | `bx ${copied ? 'bx-check' : 'bx-copy'}` | `Check` / `Copy` | `h-4 w-4` | Share link copy clipboard icon |
| 1119 | `bx bx-printer` | `Printer` | `h-4 w-4` | Share flyer print button |

---

#### 4. apps/web/src/app/admin/AdminPanelClient.tsx (16 occurrences)

| Line | Original Boxicon Class / String | Proposed Lucide React Component | Recommended Tailwind CSS Classes | Context / Notes |
|---|---|---|---|---|
| 204 | `bx bx-bar-chart-alt-2 mr-2` | `BarChart3` | `h-4 w-4 mr-2` | Sidebar statistics overview tab |
| 211 | `bx bx-store mr-2` | `Store` | `h-4 w-4 mr-2` | Sidebar shops panel tab |
| 216 | `bx bx-refresh text-lg ${isRefreshing ? "animate-spin" : ""}` | `RefreshCw` | `h-4.5 w-4.5 mr-2` (plus `animate-spin`) | Refresh statistics metric icon |
| 226 | `bx bx-store-alt text-3xl` | `Store` | `h-8 w-8` | Total shops metrics card icon |
| 236 | `bx bx-user-voice text-3xl` | `Users` | `h-8 w-8` | Active customers metrics card icon |
| 250 | `bx bx-check-double text-3xl` | `CheckCheck` | `h-8 w-8` | Completed jobs metrics card icon |
| 263 | `bx bx-pie-chart-alt-2 text-primary` | `PieChart` | `h-5 w-5 text-primary` | Service usage tracking header icon |
| 286 | `bx bx-map-alt text-primary` | `Map` | `h-5 w-5 text-primary` | Geographic stats section header icon |
| 306 | `bx bx-plus-circle text-primary text-xl` | `PlusCircle` | `h-5 w-5 text-primary` | Add new shop trigger button icon |
| 437 | `bx bx-loader-alt animate-spin text-lg` | `Loader2` | `h-4.5 w-4.5 animate-spin` | Shop registration loading spinner |
| 442 | `bx bx-store-alt text-lg` | `Store` | `h-4.5 w-4.5` | Shop registration submit icon |
| 453 | `bx bx-table text-primary text-xl` | `Table` | `h-5 w-5 text-primary` | Existing shops list section icon |
| 486 | `bx bx-map-pin text-muted-foreground` | `MapPin` | `h-4 w-4 text-muted-foreground` | Area coordinate pin location tag |
| 500 | `bx ${copiedSlug === shop.slug ? "bx-check text-[var(--ps-success)]" : "bx-copy"}` | `Check` / `Copy` | `h-4 w-4` (plus `text-[var(--ps-success)]` when checked) | Copy shop URL link button icon |
| 523 | `bx bx-edit text-lg` | `Edit2` | `h-4.5 w-4.5` | Edit shop configuration icon |
| 526 | `bx bx-trash text-lg` | `Trash2` | `h-4.5 w-4.5` | Delete shop profile icon |

---

## Logic Chain

1. **Grep and Scanned Scope Identification**:
   - We used `grep -rn -E "bx[sl]?-|bx bx"` command inside directory `/media/bhavya/backup and etc/Project/Printo_` restricted to paths starting inside `apps/web/src/app/` to identify all file occurrences.
   - The matches were cross-referenced with the list of four files specified by the user: `page.tsx`, `s/[slug]/page.tsx`, `dashboard/page.tsx`, and `admin/AdminPanelClient.tsx`.

2. **Boxicons Class Mapping Strategy**:
   - Boxicons defines standard prefixes `bx`, `bxs-` (solid), and `bxl-` (logos). All of these are generic Boxicons.
   - Sizing in Boxicons is set using Tailwind font size utility classes like `text-xs`, `text-lg`, `text-2xl`, etc.
   - When migrating to Lucide React, it is standard practice to render these icons as components (e.g. `<Printer />`) instead of html `<i>` tags.
   - Sizing props or Tailwind size dimensions (`h-* w-*`) must replace the typography sizes to preserve the intended layout:
     - `text-xs` (12px) maps to `h-3 w-3`
     - `text-sm` (14px) maps to `h-3.5 w-3.5`
     - `text-base` (16px) maps to `h-4 w-4`
     - `text-lg` (18px) maps to `h-4.5 w-4.5`
     - `text-xl` (20px) maps to `h-5 w-5`
     - `text-2xl` (24px) maps to `h-6 w-6`
     - `text-3xl` (30px) maps to `h-8 w-8`
     - `text-4xl` (36px) maps to `h-10 w-10`
     - `text-5xl` (48px) maps to `h-12 w-12`

3. **Lucide Component Selection**:
   - Standard components were matched based on name and semantic meaning (e.g. `bx-printer` matches `Printer`, `bxs-spreadsheet` matches `FileSpreadsheet`).
   - For icons representing brands or file formats that Lucide doesn't have native logo shapes for (like `bxl-windows` or `bxs-file-pdf`), standard representative replacements like `Monitor`/`Laptop` and `FileText` were chosen.

---

## Caveats

- **External Script / Style Check**: In `layout.tsx`, the Boxicons library style tag is loaded via a CDN (`unpkg.com/boxicons`). If replacing all Boxicons, this CDN script tag in `layout.tsx` should also be cleaned up.
- **Dynamic Icons Rendering**: In both `s/[slug]/page.tsx` and `dashboard/page.tsx`, arrays and helper functions store icon classes as plain strings. Standard string concatenation like `className={`bx ${t.icon}`}` will need to be replaced by a dynamic component helper or an object mapping look-up dictionary when migrating to Lucide React (since Lucide components cannot be instantiated dynamically directly from raw string classes without a mapping object). Example lookup dictionary proposed:
  ```typescript
  import * as Icons from 'lucide-react';
  const iconMap: Record<string, keyof typeof Icons> = {
    'bxs-file-pdf': 'FileText',
    'bxs-image': 'Image',
    ...
  };
  ```

---

## Conclusion

We successfully scanned all 4 requested files and cataloged 142 distinct occurrences of generic Boxicons. Moving these to Lucide React is highly feasible since `lucide-react` is already present in `apps/web/package.json` at version `^1.11.0`. The detailed mapping tables provided above contain exact line matches and clear Tailwind instructions.

---

## Verification Method

The mapping tables can be verified by running the following commands to confirm line locations and counts:

1. **Confirm total occurrence counts**:
   ```bash
   grep -c -E "bx[sl]?-|bx bx" apps/web/src/app/page.tsx
   grep -c -E "bx[sl]?-|bx bx" apps/web/src/app/s/\[slug\]/page.tsx
   grep -c -E "bx[sl]?-|bx bx" apps/web/src/app/dashboard/page.tsx
   grep -c -E "bx[sl]?-|bx bx" apps/web/src/app/admin/AdminPanelClient.tsx
   ```

2. **Check lines inside specific files**:
   For example, inspect line 73 in `page.tsx` or line 506 in `s/[slug]/page.tsx` using `head` / `tail` commands:
   ```bash
   sed -n '73p' apps/web/src/app/page.tsx
   sed -n '506p' apps/web/src/app/s/\[slug\]/page.tsx
   ```
