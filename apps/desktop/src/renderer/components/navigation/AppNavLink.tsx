import { NavLink, type NavLinkProps } from "react-router-dom";
import { useNavigationLoadingOptional } from "./NavigationProvider";

export function AppNavLink({ to, onClick, ...props }: NavLinkProps) {
  const navigation = useNavigationLoadingOptional();

  return (
    <NavLink
      to={to}
      onClick={(event) => {
        navigation?.startNavigation();
        onClick?.(event);
      }}
      {...props}
    />
  );
}
