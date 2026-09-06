import { useEffect, useLayoutEffect } from "react";

/** useLayoutEffect warns during SSR; the band must measure before paint on the client. */
export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;
