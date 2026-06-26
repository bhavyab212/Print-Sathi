"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, type ComponentProps } from "react";
import { useNavigationLoadingOptional } from "./NavigationProvider";
import { useSound } from "@/hooks/useSound";

type NavLinkProps = ComponentProps<typeof Link>;

export function NavLink({ href, onClick, ...props }: NavLinkProps) {
  const pathname = usePathname();
  const navigation = useNavigationLoadingOptional();
  const { play } = useSound();
  const hrefString = typeof href === "string" ? href : href.pathname ?? "";

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (hrefString && hrefString !== pathname) {
        play("navigate-start");
        navigation?.startNavigation();
      } else {
        play("select");
      }
      onClick?.(event);
    },
    [hrefString, pathname, play, navigation, onClick]
  );

  return (
    <Link
      href={href}
      onClick={handleClick}
      onMouseEnter={() => play("hover")}
      {...props}
    />
  );
}
