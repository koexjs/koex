export interface Config {
  /**
   * Listen Host
   */
  host?: string;
  
  /**
   * Listen Port
   */
  port?: number;

  /**
   * Listen Directory
   */
  dir?: string;

  /**
   * Enable CORS
   */
  cors?: boolean;

  /**
   * Rewrite alk not-found requests to `index.html`
   */
  single?: boolean;

  /**
   * Cache Files
   */
  cache?: boolean;
}