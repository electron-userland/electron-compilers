import _ from 'lodash';
import path from 'path';
import {SimpleCompilerBase} from '../compiler-base';

const mimeTypes = ['text/sass', 'text/x-sass'];
let sass = null;

/**
 * @access private
 */
export default class SassCompiler extends SimpleCompilerBase {
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
    sass = sass || require('node-sass');

    let paths = Object.keys(this.seenFilePaths);
    paths.unshift('.');

    this.seenFilePaths[path.dirname(filePath)] = true;

    let opts = _.extend({}, this.compilerOptions, {
      indentedSyntax: true,
      includePaths: paths,
      file: path.basename(filePath),
      data: sourceCode
    });

    let result = sass.renderSync(opts);

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
