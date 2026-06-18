"use client";
import { Boxicon } from "@/components/ui";


export type PassportStep =
  | "upload"
  | "processing"
  | "bg-review"
  | "crop"
  | "enhance"
  | "print";

const STEPS: { id: PassportStep; label: string; icon: string }[] = [
  { id: "upload",     label: "Upload",     icon: "bx-cloud-upload"  },
  { id: "processing", label: "Processing", icon: "bx-brain"         },
  { id: "bg-review",  label: "Background", icon: "bx-eraser"        },
  { id: "crop",       label: "Crop",       icon: "bx-crop"          },
  { id: "enhance",    label: "Enhance",    icon: "bx-slider-alt"    },
  { id: "print",      label: "Print",      icon: "bx-printer"       },
];

interface StepNavProps {
  current: PassportStep;
  onStepClick?: (step: PassportStep) => void;
  completedUpTo: number; // index of last completed step
}

export function StepNav({ current, onStepClick, completedUpTo }: StepNavProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto scrollbar-none glass-faint rounded-xl px-2 py-1.5">
      {STEPS.map((step, idx) => {
        const isDone    = idx <= completedUpTo && idx !== currentIdx;
        const isActive  = step.id === current;
        const isLocked  = idx > completedUpTo + 1;

        return (
          <div key={step.id} className="flex items-center flex-1 min-w-0">
            {/* Step pill */}
            <button
              onClick={() => !isLocked && onStepClick?.(step.id)}
              disabled={isLocked}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all select-none whitespace-nowrap
                ${isActive
                  ? "bg-primary text-white glow-primary"
                  : isDone
                    ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 cursor-pointer"
                    : isLocked
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : "text-muted-foreground hover:text-foreground cursor-pointer"
                }`}
            >
              <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold
                ${isActive ? "bg-white/25" : isDone ? "bg-emerald-500 text-white" : "bg-muted"}`}
              >
                {isDone ? <Boxicon className="bx bx-check text-[10px]" /> : <span>{idx + 1}</span>}
              </div>
              <i className={`bx ${step.icon} text-sm`} />
              <span className="hidden sm:inline">{step.label}</span>
            </button>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div className={`h-px flex-1 mx-1 rounded-full transition-colors ${
                idx < completedUpTo ? "bg-emerald-500/40" : "bg-border"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
