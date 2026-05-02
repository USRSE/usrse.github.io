import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to the top of the page on route change */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
