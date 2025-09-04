export interface IPdfFormPosition {
  page: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotate?: number;
  type?: "text" | "image";
}
