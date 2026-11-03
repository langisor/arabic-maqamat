export { cn } from "cn"

/**
 *
 * @param scale remove all natural marks (♮) from the scale string
 * @example
 * removeNaturalMarks("C♮ D♮ E♮ F♮ G♮ A♮ B♮") // returns "C D E F G A B"
 * @returns string without natural marks
 */
export function removeNaturalMarks(scale: string): string {
  return scale.replace(/♮/g, "")
}
