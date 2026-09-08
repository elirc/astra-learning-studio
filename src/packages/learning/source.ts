import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { sourcePaths } from './source-catalog';

export async function readSource(filePath: string): Promise<string | null> {
  if (!sourcePaths.includes(filePath)) return null;

  // Literal directory roots keep Next's file tracing bounded to source folders;
  // the exact catalog above remains the authorization boundary for every read.
  if (filePath.startsWith('src/')) {
    return readFile(path.join(process.cwd(), 'src', filePath.slice(4)), 'utf8');
  }
  if (filePath.startsWith('tests/')) {
    return readFile(path.join(process.cwd(), 'tests', filePath.slice(6)), 'utf8');
  }
  if (filePath.startsWith('prisma/')) {
    return readFile(path.join(process.cwd(), 'prisma', filePath.slice(7)), 'utf8');
  }
  if (filePath.startsWith('fabledocs/')) {
    return readFile(path.join(process.cwd(), 'fabledocs', filePath.slice(10)), 'utf8');
  }
  switch (filePath) {
    case 'CONTRIBUTING.md':
      return readFile(path.join(process.cwd(), 'CONTRIBUTING.md'), 'utf8');
    case 'package.json':
      return readFile(path.join(process.cwd(), 'package.json'), 'utf8');
    case 'tsconfig.json':
      return readFile(path.join(process.cwd(), 'tsconfig.json'), 'utf8');
    default:
      throw new Error(`Cataloged source needs an explicit read branch: ${filePath}`);
  }
}
