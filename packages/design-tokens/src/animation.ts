/** Duration values in milliseconds */
export const duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;

/** CSS easing functions */
export const easing = {
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.2, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** React Native Animated easing config */
export const easingNative = {
  easeIn: { x1: 0.4, y1: 0, x2: 1, y2: 1 },
  easeOut: { x1: 0, y1: 0, x2: 0.2, y2: 1 },
  easeInOut: { x1: 0.4, y1: 0, x2: 0.2, y2: 1 },
} as const;

export type Duration = typeof duration;
export type Easing = typeof easing;
export type EasingNative = typeof easingNative;
