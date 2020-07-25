export interface Options {
  // directory
  dir: string;

  // functions
  gzip?: boolean; // default: true
  md5?: boolean; // default: true

  // attributes
  cacheControl?: string;
  maxAge?: string;

  // index
  index?: true | string;

  // try file suffix
  suffix?: string;

  // show hidden paths(include file and directory), default false
  //  such as .gitignore, .travis.yml
  showHidden?: boolean;
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
