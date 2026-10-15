import { ArabicPitch } from "../../core/pitch"

export interface OudCourse {
  id: string
  label: string
  arabicLabel: string
  openPitch: ArabicPitch
  thickness: string
}

export const OUD_COURSES: readonly OudCourse[] = [
  {
    id: "course-1",
    label: "1st course",
    arabicLabel: "دو جواب",
    openPitch: new ArabicPitch("C", "♮", 4),
    thickness: "1.5px",
  },
  {
    id: "course-2",
    label: "2nd course",
    arabicLabel: "نوى",
    openPitch: new ArabicPitch("G", "♮", 3),
    thickness: "1.8px",
  },
  {
    id: "course-3",
    label: "3rd course",
    arabicLabel: "دوكاه",
    openPitch: new ArabicPitch("D", "♮", 3),
    thickness: "2.1px",
  },
  {
    id: "course-4",
    label: "4th course",
    arabicLabel: "عشيران",
    openPitch: new ArabicPitch("A", "♮", 2),
    thickness: "2.4px",
  },
  {
    id: "course-5",
    label: "5th course",
    arabicLabel: "يكاه",
    openPitch: new ArabicPitch("G", "♮", 2),
    thickness: "2.8px",
  },
  {
    id: "course-6",
    label: "6th course",
    arabicLabel: "قرار راست",
    openPitch: new ArabicPitch("C", "♮", 2),
    thickness: "3.2px",
  },
]

export function getOudPositionPitch(
  openPitch: ArabicPitch,
  quarterTonePosition: number
): ArabicPitch {
  if (!Number.isInteger(quarterTonePosition) || quarterTonePosition < 0) {
    throw new RangeError("Oud position must be a non-negative integer.")
  }
  return openPitch.transpose(quarterTonePosition)
}
