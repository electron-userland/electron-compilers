import _ from 'lodash';
import path from 'path';
import {SimpleCompilerBase} from '../compiler-base';

const mimeTypes = ['text/scss', 'text/x-scss'];
let scss = null;

/**
 * @access private
 */
export default class ScssCompiler extends SimpleCompilerBase {
  constructor() {
    super();
    this.compilerOptions.sourceMap = true;
    this.seenFilePaths = {};
  }

  static getInputMimeTypes() {
    return mimeTypes;
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    return [];
  }

  compileSync(sourceCode, filePath, compilerContext) {
    scss = scss || require('node-sass');

    let paths = Object.keys(this.seenFilePaths);
    paths.unshift('.');

    this.seenFilePaths[path.dirname(filePath)] = true;

    let opts = _.extend({}, this.compilerOptions, {
      includePaths: paths,
      file: path.basename(filePath),
      data: sourceCode
    });

    let result = scss.renderSync(opts);

    if (!result) {
      throw result;
    }

    return {
      code: result.css,
      mimeType: 'text/css'
    };
  }

  getCompilerVersion() {
    return require('node-sass/package.json').version;
  }
}
