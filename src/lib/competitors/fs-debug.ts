import { promises as fs } from 'fs';
import { join } from 'path';

export async function writeDebugText(filename: string, text: string): Promise<string> {
  try {
    const dir = join(process.cwd(), 'public', 'competitors-debug');
    await fs.mkdir(dir, { recursive: true });
    const target = join(dir, filename);
    await fs.writeFile(target, text, 'utf8');
    return target;
  } catch {
    return '';
  }
}


