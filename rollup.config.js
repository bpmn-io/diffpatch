import fs from 'fs';
import path from 'path';
import mkdirp from 'mkdirp';
import replace from 'rollup-plugin-replace';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import istanbul from 'rollup-plugin-istanbul';
import pkg from './package.json';

// import Visualizer from 'rollup-plugin-visualizer';

function copyFromFolderToDist(folder) {
  return function(filename) {
    let executed = false;
    return {
      ongenerate: () => {
        if (executed) {
          return;
        }
        const distFilename = path.join(__dirname, 'dist', filename);
        mkdirp(path.dirname(distFilename));
        fs.writeFileSync(
          distFilename,
          fs.readFileSync(path.join(__dirname, folder, filename))
        );
        console.log(`${folder}/${filename} → dist/${filename} (copied)`);
        executed = true;
      },
    };
  };
}


const copySrcFileToDist = copyFromFolderToDist('src');
const copyDocsFileToDist = copyFromFolderToDist('docs');

/**
 * browser-friendly UMD build
 * @param {string} dirName Output destination directory
 */
function createBrowserUmdBuildConfig(dirName = 'dist') {
  return {
    input: 'src/index.js',
    external: [
      // external node modules
      'chalk',
      'diff-match-patch',
    ],
    output: {
      name: pkg.name,
      file: pkg.browser.replace(/^dist\//, `${dirName}/`),
      format: 'umd',
    },
    plugins: [
      replace({ 'process.browser': true }),
      babel({
        exclude: 'node_modules/**',
        plugins: ['external-helpers'],
      }),
      resolve(), // so Rollup can find node modules
      commonjs(), // so Rollup can convert node modules to ES modules
    ],
  };
}

/**
 * CommonJS (for Node) and ES module (for bundlers) build.
 * @param {string} dirName Output destination directory
 * @param {boolean} includeCoverage Whether to compute test coverage
 *   and include it in outputted .js files
 */
function createModuleBuild(dirName = 'dist', includeCoverage = false) {
  let plugins = [
    babel({
      exclude: 'node_modules/**',
      plugins: ['external-helpers'],
    }),
    resolve(), // so Rollup can find node modules
    commonjs(), // so Rollup can convert node modules to ES modules
  ];
  if (includeCoverage) {
    plugins.push(
      istanbul({
        include: ['src/**/*.js'],
        exclude: ['test/**/*.js', 'node_modules/**'],
      })
    );
  }
  if (dirName === 'dist') {
    plugins.push(copySrcFileToDist('index.d.ts'));
    plugins.push(copyDocsFileToDist('formatters-styles/annotated.css'));
    plugins.push(copyDocsFileToDist('formatters-styles/html.css'));
  }

  return {
    input: 'src/index.js',
    external: [
      // external node modules
      'diff-match-patch',
      'chalk',
    ],
    plugins,
    output: [
      {
        file: pkg.main.replace(/^dist\//, `${dirName}/`),
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: pkg.module.replace(/^dist\//, `${dirName}/`),
        format: 'es',
        sourcemap: true,
      },
    ],
  };
}

export default [
  createBrowserUmdBuildConfig(),
  createModuleBuild(),
];
