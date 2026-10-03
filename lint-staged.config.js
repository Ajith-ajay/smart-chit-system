import path from 'path';

export default {
  '*.{js,jsx,ts,tsx}': (filenames) => {
    const apiFiles = [];
    const webFiles = [];

    for (const file of filenames) {
      const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
      if (relativePath.startsWith('apps/api/')) {
        apiFiles.push(path.relative(path.resolve('apps/api'), file).replace(/\\/g, '/'));
      } else if (relativePath.startsWith('apps/web/')) {
        webFiles.push(path.relative(path.resolve('apps/web'), file).replace(/\\/g, '/'));
      }
    }

    const commands = [];

    if (apiFiles.length > 0) {
      commands.push(`pnpm --filter api exec eslint --fix ${apiFiles.join(' ')}`);
    }
    if (webFiles.length > 0) {
      commands.push(`pnpm --filter web exec eslint --fix ${webFiles.join(' ')}`);
    }

    commands.push(`prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`);

    return commands;
  },

  '*.{json,md,yml,yaml,css,scss}': (filenames) => {
    return [`prettier --write ${filenames.map((f) => `"${f}"`).join(' ')}`];
  },
};
