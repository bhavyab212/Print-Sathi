"use client";

import * as React from "react";

type ClientIconProps = {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  className?: string;
  style?: React.CSSProperties;
};

export function ClientIcon({ icon: Icon, className, style }: ClientIconProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span aria-hidden className={className} style={style} />;
  }

  return <Icon className={className} style={style} />;
}
