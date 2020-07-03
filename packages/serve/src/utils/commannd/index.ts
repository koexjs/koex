import program from './utils/program';
import exec from './utils/exec';

const api = {
  program,
  exec,
}

export type Api = typeof api;

export default api;