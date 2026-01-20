import esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['server/index.ts'],
  platform: 'node',
  bundle: true,
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'],
});
