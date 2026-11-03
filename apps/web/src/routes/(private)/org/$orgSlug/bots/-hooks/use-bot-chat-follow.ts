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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [chatStyle, setChatStyle] = useState<CSSProperties>();
  const [toolbarStyle, setToolbarStyle] = useState<CSSProperties>();

  useEffect(() => {
    const slot = slotRef.current;
    const boundary = boundaryRef.current;
    const toolbar = toolbarRef.current;
    if (!slot || !boundary || !toolbar) return;

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const scrollTargets = findScrollTargets(slot);
    let animationFrame = 0;

    const updatePosition = () => {
      animationFrame = 0;

      if (!mediaQuery.matches) {
        setChatStyle((current) => (current ? undefined : current));
        setToolbarStyle((current) => (current ? undefined : current));
        return;
      }

      const boundaryRect = boundary.getBoundingClientRect();
      const slotRect = slot.getBoundingClientRect();
      const toolbarHeight = toolbar.getBoundingClientRect().height;
      const toolbarMarginBottom =
        Number.parseFloat(window.getComputedStyle(toolbar).marginBottom) || 0;
      const chatTopOffset = toolbarHeight + toolbarMarginBottom;
      const chatHeight = chatRef.current?.getBoundingClientRect().height ?? 0;
      const minimumToolbarTop = Math.max(
        APP_HEADER_HEIGHT + VIEWPORT_GAP,
        boundaryRect.top,
      );
      const maximumToolbarTop = Math.max(
        minimumToolbarTop,
        Math.min(window.innerHeight, boundaryRect.bottom) -
          chatHeight -
          chatTopOffset,
      );
      const toolbarTop = clamp(
        slotRect.top,
        minimumToolbarTop,
        maximumToolbarTop,
      );
      const nextToolbarStyle: CSSProperties = {
        boxSizing: "border-box",
        left: slotRect.left,
        position: "fixed",
        top: toolbarTop,
        width: slotRect.width,
        zIndex: 10,
      };
      const nextChatStyle: CSSProperties = {
        ...nextToolbarStyle,
        top: toolbarTop + chatTopOffset,
      };

      setToolbarStyle((current) => {
        if (
          current?.left === nextToolbarStyle.left &&
          current?.top === nextToolbarStyle.top &&
          current?.width === nextToolbarStyle.width
        ) {
          return current;
        }

        return nextToolbarStyle;
      });
      setChatStyle((current) => {
        if (
          current?.left === nextChatStyle.left &&
          current?.top === nextChatStyle.top &&
          current?.width === nextChatStyle.width
        ) {
          return current;
        }

        return nextChatStyle;
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
    resizeObserver.observe(toolbar);
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

  return {
    boundaryRef,
    chatRef,
    chatStyle,
    slotRef,
    toolbarRef,
    toolbarStyle,
  };
}
