"use client";

import * as React from "react";
import * as Lucide from "lucide-react";

interface BoxiconProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<SVGElement>;
}

/**
 * A drop-in replacement for Boxicons <i> tags that dynamically renders
 * professional Lucide React icons instead, maintaining class-based styling.
 */
export function Boxicon({ className, style, onClick }: BoxiconProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!className) return null;

  const classes = className.split(" ");
  const bxClass = classes.find(
    (c) => c.startsWith("bx-") || c.startsWith("bxs-") || c.startsWith("bxl-")
  );

  if (!bxClass) return null;

  const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties; onClick?: React.MouseEventHandler<SVGElement> }>> = {
    // General UI
    "bx-printer": Lucide.Printer,
    "bx-x": Lucide.X,
    "bx-arrow-back": Lucide.ArrowLeft,
    "bx-upload": Lucide.Upload,
    "bx-error-circle": Lucide.AlertCircle,
    "bx-help-circle": Lucide.HelpCircle,
    "bx-dots-vertical-rounded": Lucide.MoreVertical,
    "bx-message-dots": Lucide.MessageSquare,
    "bx-qr-scan": Lucide.QrCode,
    "bxs-file-blank": Lucide.File,
    "bx-edit": Lucide.Edit2,
    "bx-check-double": Lucide.CheckCircle2,
    "bx-check-circle": Lucide.CheckCircle2,
    "bx-check": Lucide.Check,
    "bx-store": Lucide.Store,
    "bx-right-arrow-alt": Lucide.ArrowRight,
    "bx-loader-alt": Lucide.Loader2,
    "bx-receipt": Lucide.FileText,
    "bx-paper-plane": Lucide.Send,
    "bx-paperclip": Lucide.Paperclip,
    "bx-send": Lucide.Send,
    "bx-plus": Lucide.Plus,
    "bx-layer": Lucide.Layers,
    "bx-chevron-up": Lucide.ChevronUp,
    "bx-chevron-down": Lucide.ChevronDown,
    "bx-info-circle": Lucide.Info,
    "bx-minus-circle": Lucide.MinusCircle,
    "bx-x-circle": Lucide.XCircle,
    "bx-minus": Lucide.Minus,
    "bx-grid-alt": Lucide.Grid,
    "bx-heart": Lucide.Heart,
    "bx-cog": Lucide.Settings,
    "bx-show": Lucide.Eye,
    "bx-cut": Lucide.Scissors,
    "bx-refresh": Lucide.RefreshCw,
    "bx-trash": Lucide.Trash2,
    "bx-store-alt": Lucide.Store,
    "bx-user-voice": Lucide.Users,
    "bx-bar-chart-alt-2": Lucide.BarChart3,
    "bx-pie-chart-alt-2": Lucide.PieChart,
    "bx-map-alt": Lucide.Map,
    "bx-map-pin": Lucide.MapPin,
    "bx-copy": Lucide.Copy,
    "bx-table": Lucide.Table,
    "bx-plus-circle": Lucide.PlusCircle,
    "bx-rocket": Lucide.Rocket,
    "bxl-windows": Lucide.Download,
    "bx-trending-up": Lucide.TrendingUp,
    "bx-chevron-right": Lucide.ChevronRight,
    "bx-calendar": Lucide.Calendar,
    "bx-time": Lucide.Clock,
    "bx-history": Lucide.History,
    "bx-log-out": Lucide.LogOut,
    "bx-search": Lucide.Search,
    "bx-sun": Lucide.Sun,
    "bx-moon": Lucide.Moon,
    "bx-menu": Lucide.Menu,
    "bx-checkbox": Lucide.Square,
    "bx-checkbox-checked": Lucide.CheckSquare,
    "bx-save": Lucide.Save,
    "bx-purchase-tag": Lucide.Tag,
    "bx-list-ol": Lucide.ListOrdered,
    "bx-check-shield": Lucide.ShieldCheck,
    "bx-chevron-left": Lucide.ChevronLeft,
    "bx-download": Lucide.Download,
    "bx-eraser": Lucide.Eraser,

    
    "bx-adjust": Lucide.Sliders,
    "bx-aperture": Lucide.Aperture,
    "bx-bolt-circle": Lucide.Zap,
    "bx-book": Lucide.Book,
    "bx-book-open": Lucide.BookOpen,
    "bx-box": Lucide.Package,
    "bx-brain": Lucide.Brain,
    "bx-brush": Lucide.Brush,
    "bx-brush-alt": Lucide.Brush,
    "bx-bulb": Lucide.Lightbulb,
    "bx-calculator": Lucide.Calculator,
    "bx-circle": Lucide.Circle,
    "bx-cloud-upload": Lucide.UploadCloud,
    "bx-crop": Lucide.Crop,
    "bx-desktop": Lucide.Monitor,
    "bx-error": Lucide.AlertTriangle,
    "bx-error-alt": Lucide.AlertOctagon,
    "bx-exclude": Lucide.CircleSlash,
    "bx-face": Lucide.Smile,
    "bx-file": Lucide.File,
    "bx-file-blank": Lucide.File,
    "bx-filter-alt": Lucide.Filter,
    "bx-fullscreen": Lucide.Maximize,
    "bx-id-card": Lucide.Contact,
    "bx-image-add": Lucide.ImagePlus,
    "bx-image-alt": Lucide.Image,
    "bx-key": Lucide.Key,
    "bx-lasso": Lucide.MousePointer2,
    "bx-layout": Lucide.LayoutDashboard,
    "bx-left-arrow-alt": Lucide.ArrowLeft,
    "bx-list-check": Lucide.ListChecks,
    "bx-list-ul": Lucide.List,
    "bx-lock-alt": Lucide.Lock,
    "bx-lock-open-alt": Lucide.Unlock,
    "bx-magic-wand": Lucide.Wand2,
    "bx-palette": Lucide.Palette,
    "bx-qr": Lucide.QrCode,
    "bx-redo": Lucide.Redo2,
    "bx-reflect-horizontal": Lucide.FlipHorizontal,
    "bx-reflect-vertical": Lucide.FlipVertical,
    "bx-reset": Lucide.RotateCcw,
    "bx-rotate-left": Lucide.RotateCcw,
    "bx-rotate-right": Lucide.RotateCw,
    "bx-run": Lucide.PlayCircle,
    "bx-rupee": Lucide.IndianRupee,
    "bxs-hand-right": Lucide.Hand,
    "bx-shield-quarter": Lucide.Shield,
    "bx-slider": Lucide.SlidersHorizontal,
    "bx-slider-alt": Lucide.Sliders,
    "bx-spa": Lucide.Flower2,
    "bx-undo": Lucide.Undo2,
    "bx-up-arrow-circle": Lucide.ArrowUpCircle,
    "bx-user": Lucide.User,
    "bx-user-pin": Lucide.UserSquare2,
    "bx-user-x": Lucide.UserX,
    "bx-wand": Lucide.Wand2,
    "bx-zap": Lucide.Zap,
    "bx-zoom-in": Lucide.ZoomIn,

    // File Types (Solid/Brands)
    "bxs-file-pdf": Lucide.FileText,
    "bxs-image": Lucide.FileImage,
    "bxs-file-doc": Lucide.FileText,
    "bxs-spreadsheet": Lucide.FileSpreadsheet,
    "bxs-slideshow": Lucide.Presentation,
    "bxs-file-txt": Lucide.FileText,
    "bxs-file": Lucide.File,
  };

  const Component = iconMap[bxClass] || Lucide.File;

  // Remove the Boxicon-specific classnames so they don't conflict,
  // but keep utility classes (like text-xl, text-white, animate-spin, etc.)
  const cleanClassName = className
    .replace(/bx-[a-z0-9-]+|bxs-[a-z0-9-]+|bxl-[a-z0-9-]+|bx|bxs/g, "")
    .trim();

  if (!mounted) {
    return <span aria-hidden className={cleanClassName || undefined} style={style} />;
  }

  return (
    <Component
      className={cleanClassName || undefined}
      style={style}
      onClick={onClick}
    />
  );
}
