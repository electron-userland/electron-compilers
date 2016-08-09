import _ from 'lodash';
import path from 'path';
import {CompilerBase} from '../compiler-base';

const mimeTypes = ['text/less'];
let lessjs = null;

/**
 * @access private
 */
export default class LessCompiler extends CompilerBase {
  constructor() {
    super();

    this.compilerOptions = {
      sourceMap: { sourceMapFileInline: true }
    };

    this.seenFilePaths = {};
  }

  static getInputMimeTypes() {
    return mimeTypes;
  }

  async shouldCompileFile(fileName, compilerContext) {
    return true;
  }

  async determineDependentFiles(sourceCode, filePath, compilerContext) {
    // NB: We have to compile the Less first to determine dependent files –
    // otherwise we'd have to use some private APIs.
    try {
      compilerContext.result = await this.render(sourceCode, filePath);
      return [...compilerContext.result.imports];
    } catch(e) {
      compilerContext.err = e;
      return [];
    }
  }

  async compile(sourceCode, filePath, compilerContext) {
    // NB: We already compiled the Less in `determineDependentFiles`, so we can
    // just return it here.
    if (compilerContext.err) {
      throw compilerContext.err;
    }

    compilerContext.result = compilerContext.result || await this.render(sourceCode, filePath);

    return {
      code: compilerContext.result.css,
      mimeType: 'text/css'
    };
  }

  async render(sourceCode, filePath) {
    lessjs = lessjs || require('less');

    let paths = Object.keys(this.seenFilePaths);
    paths.unshift('.');

    this.seenFilePaths[path.dirname(filePath)] = true;

    if (this.compilerOptions.paths) {
      paths.push(...this.compilerOptions.paths);
    }

    let opts = {
      ...this.compilerOptions,
      paths: paths,
      filename: path.basename(filePath)
    };

    return lessjs.render(sourceCode, opts);
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    // NB: We have to compile the Less first to determine dependent files –
    // otherwise we'd have to use some private APIs.
    lessjs = lessjs || require('less');

    let error = null;

    let paths = Object.keys(this.seenFilePaths);
    paths.unshift('.');
    this.seenFilePaths[path.dirname(filePath)] = true;

    let opts = _.extend({}, this.compilerOptions, {
      paths: paths,
      filename: path.basename(filePath),
      fileAsync: false, async: false, syncImport: true
    });

    lessjs.render(sourceCode, opts, (err, out) => {
      if (err) {
        error = err;
        compilerContext.err = err;
      } else {
        // NB: Because we've forced less to work in sync mode, we can do this
        compilerContext.result = out;
      }
    });

    if (error) {
      throw error;
    }

    return compilerContext.result ? [...compilerContext.result.imports] : [];

  }

  compileSync(sourceCode, filePath, compilerContext) {
    // NB: We already compiled the Less in `determineDependentFiles`, so we can
    // just return it here.
    if (!compilerContext.result) {
      try {
        this.determineDependentFilesSync(sourceCode, filePath, compilerContext);
      } catch(e) {
        throw e;
      }
    }

    if (compilerContext.err) {
      throw compilerContext.err;
    }

    return {
      code: compilerContext.result.css || '',
      mimeType: 'text/css'
    };
  }

  getCompilerVersion() {
    return require('less/package.json').version;
  }
}
