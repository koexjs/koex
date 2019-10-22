export interface Options {
  // directory
  dir: string;

  // functions
  gzip?: boolean; // default: true
  md5?: boolean; // default: true

  // attributes
  cacheControl?: string;
  maxAge?: string;
}

export interface File {
  path: string;
  cacheControl: string;
  maxAge: string | number;
  type: string;
  mtime: Date;
  length: number;
  md5: string;
}
