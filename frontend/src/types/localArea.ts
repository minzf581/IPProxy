export interface LocalArea {
  code: string;
  name: string;
  parent_code?: string;
  level: number;
  children?: LocalArea[];
} 