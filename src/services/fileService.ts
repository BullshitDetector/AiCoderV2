// src/services/fileService.ts
import { WebContainer } from '@webcontainer/api';

export class FileService {
  private wc: WebContainer;
  private cache = new Map<string, string>();

  constructor(wc: WebContainer) {
    this.wc = wc;
  }

  /** Ensure directory exists */
  private async ensureDir(path: string) {
    const parts = path.split('/').slice(0, -1);
    let cur = '';
    for (const p of parts) {
      cur += (cur ? '/' : '') + p;
      await this.wc.fs.mkdir(cur, { recursive: true }).catch(() => {});
    }
  }

  /** Write file (in-memory cache + FS) */
  async write(path: string, content: string) {
    this.cache.set(path, content);
    await this.ensureDir(path);
    await this.wc.fs.writeFile(path, content);
  }

  /** Apply AI response – write component + inject into App.tsx */
  async applyAIResponse(resp: { code: string; filename: string }) {
    const componentPath = `src/components/${resp.filename}`;
    await this.write(componentPath, resp.code);

    const componentName = resp.filename.replace(/\.tsx$/, '');
    await this.injectIntoApp(componentName);
  }

  /** Add import + render tag in App.tsx */
  private async injectIntoApp(name: string) {
    const appPath = 'src/App.tsx';
    let code =
      this.cache.get(appPath) ??
      (await this.wc.fs.readFile(appPath, 'utf-8').catch(() => ''));

    // ---- Add import ----
    const importLine = `import ${name} from './components/${name}';\n`;
    if (!code.includes(importLine)) {
      const lastImport = code.match(/import .*?;\n/g)?.pop() ?? '';
      code = code.replace(lastImport, lastImport + importLine);
    }

    // ---- Add render tag inside return (JSX) ----
    const tag = `<${name} />`;
    if (!code.includes(tag)) {
      code = code.replace(
        /(return\s*\()<>/,
        `$1<>\n    ${tag}\n    <>`
      );
      // Close the fragment correctly
      code = code.replace(/<\/>\s*<\/>\)/, `  </>\n</>\n)`);
    }

    await this.write(appPath, code);
  }
}

/* Singleton */
let inst: FileService | null = null;
export const getFileService = (wc: WebContainer) => {
  if (!inst) inst = new FileService(wc);
  return inst;
};