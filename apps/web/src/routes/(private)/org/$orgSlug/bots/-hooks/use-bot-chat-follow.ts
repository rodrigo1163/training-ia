import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const APP_HEADER_HEIGHT = 56;
const VIEWPORT_GAP = 16;

function findScrollTargets(element: HTMLElement): Array<HTMLElement | Window> {
  const targets: Array<HTMLElement | Window> = [window];
  let parent = element.parentElement;

  while (parent) {
    const styles = window.getComputedStyle(parent);
    const canScroll = /auto|overlay|scroll/.test(styles.overflowY);

    if (canScroll) targets.push(parent);
    parent = parent.parentElement;
  }

  return targets;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function useBotChatFollow() {
  const boundaryRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>();

  useEffect(() => {
    const slot = slotRef.current;
    const boundary = boundaryRef.current;
    if (!slot || !boundary) return;

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const scrollTargets = findScrollTargets(slot);
    let animationFrame = 0;

    const updatePosition = () => {
      animationFrame = 0;

      if (!mediaQuery.matches) {
        setStyle((current) => (current ? undefined : current));
        return;
      }

      const boundaryRect = boundary.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const chatHeight = chatRef.current?.getBoundingClientRect().height ?? 0;
      const minimumTop = Math.max(
        APP_HEADER_HEIGHT + VIEWPORT_GAP,
        boundaryRect.top,
      );
      const maximumTop = Math.max(
        minimumTop,
        Math.min(window.innerHeight, boundaryRect.bottom) -
          chatHeight,
      );
      const top = clamp(slotRect.top, minimumTop, maximumTop);
      const nextStyle: CSSProperties = {
        boxSizing: "border-box",
        left: slotRect.left,
        position: "fixed",
        top,
        width: slotRect.width,
        zIndex: 10,
      };

      setStyle((current) => {
        if (
          current?.left === nextStyle.left &&
          current?.top === nextStyle.top &&
          current?.width === nextStyle.width
        ) {
          return current;
        }

        return nextStyle;
      });
    };

    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updatePosition);
    };

    for (const scrollTarget of scrollTargets) {
      scrollTarget.addEventListener("scroll", scheduleUpdate, {
        passive: true,
      });
    }
    window.addEventListener("resize", scheduleUpdate);
    mediaQuery.addEventListener("change", scheduleUpdate);

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(boundary);
    resizeObserver.observe(slot);
    if (chatRef.current) resizeObserver.observe(chatRef.current);

    scheduleUpdate();

    return () => {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      for (const scrollTarget of scrollTargets) {
        scrollTarget.removeEventListener("scroll", scheduleUpdate);
      }
      window.removeEventListener("resize", scheduleUpdate);
      mediaQuery.removeEventListener("change", scheduleUpdate);
      resizeObserver.disconnect();
    };
  }, []);

  return { boundaryRef, chatRef, slotRef, style };
}
