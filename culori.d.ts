declare module 'culori' {
  export interface Color {
    mode: string;
    [key: string]: any;
  }

  export interface OklchColor extends Color {
    mode: 'oklch';
    l: number;
    c: number;
    h?: number;
  }

  export interface P3Color extends Color {
    mode: 'p3';
    r: number;
    g: number;
    b: number;
  }

  export interface RgbColor extends Color {
    mode: 'rgb';
    r: number;
    g: number;
    b: number;
  }

  export function converter(mode: string): (color: Color) => Color | undefined;
  export function formatHex(color: Color): string;
  export function formatRgb(color: Color): string;
  export function formatHsl(color: Color): string;
  export function clampChroma(color: Color, mode?: string): Color;
}
