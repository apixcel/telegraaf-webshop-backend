import { IPdfFormPosition } from "../interface/pdf.interface";

export const pdfPosition: Record<string, IPdfFormPosition[]> = {
  birthYear: [
    { page: 5, x: 453, y: 442 },
    { page: 5, x: 651, y: 431 },
    { page: 0, x: 668, y: 261 },
  ],
  firstName: [
    { page: 5, x: 290, y: 333 },
    { page: 4, x: 97, y: 103 },
    { page: 4, x: 82, y: 172 },
    { page: 4, x: 142, y: 222 },
    { page: 3, x: 397, y: 201, rotate: 90 },
    { page: 1, x: 71, y: 329 },
    { page: 1, x: 71, y: 396 },
    { page: 1, x: 140, y: 506 },
    { page: 0, x: 198, y: 436 },
    { page: 0, x: 664, y: 301 },
    { page: 0, x: 606.66, y: 219.3 }, //
  ],
  lastName: [
    { page: 5, x: 345, y: 332 },
    { page: 4, x: 121, y: 172 },
    { page: 4, x: 182, y: 222 },
    { page: 3, x: 397, y: 150, rotate: 90 },
    { page: 0, x: 250, y: 436 },
    { page: 0, x: 589, y: 234 },
  ],
  photo: [
    {
      page: 0,
      x: 556.66,
      y: 566.66,
      type: "image",
      width: 230,
      height: 226.66,
    },
    {
      page: 4,
      width: 176,
      height: 254.61,
      type: "image",
      x: 620,
      y: 465,
    },
    {
      page: 6,
      width: 178,
      height: 260,
      type: "image",
      x: 431,
      y: 570,
    },
  ],
  age: [
    { page: 3, x: 407, y: 450, rotate: 90 },
    { page: 3, x: 693, y: 315 },
    { page: 2, x: 160, y: 468, rotate: 90 },
    { page: 2, x: 690, y: 480, rotate: 90 },
    { page: 1, x: 598, y: 489, rotate: 90 },
    { page: 1, x: 324, y: 250 },
    { page: 1, x: 340, y: 152 },
    { page: 0, x: 140, y: 450 },
    { page: 0, x: 587, y: 248 },
  ],
};
export function generatePdfFileName(data: { firstName: string; lastName: string }) {
  const safeFirst = data.firstName.replace(/\s+/g, "_");
  const safeLast = data.lastName.replace(/\s+/g, "_");
  const dateStr = new Date().toISOString().split("T")[0];
  return `${safeFirst}_${safeLast}_${dateStr}.pdf`;
}
