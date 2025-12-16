declare module 'apca-w3' {
  export function APCAcontrast(textColor: string, bgColor: string): number;
  export function sRGBtoY(color: string): number;
  export function displayP3toY(color: string): number;
}
