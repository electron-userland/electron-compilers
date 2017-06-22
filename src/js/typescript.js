import {SimpleCompilerBase} from '../compiler-base';
import path from 'path';
import jsEscape from 'js-string-escape';

const inputMimeTypes = ['text/typescript', 'text/tsx'];
const d = require('debug')('electron-compile:typescript-compiler');

let ts = null;

const builtinKeys = ['hotModuleReload', 'coverage', 'babel'];

export default class TypeScriptCompiler extends SimpleCompilerBase {
  constructor() {
    super();

    this.outMimeType = 'application/javascript';
    this.compilerOptions = {
      inlineSourceMap: true,
      inlineSources: true
    };
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  _getParsedConfigOptions(tsCompiler) {
    let parsedConfig = this.parsedConfig;

    if (!parsedConfig) {
      let opts = Object.assign({}, this.compilerOptions);
      let builtinOpts = {};
      builtinKeys.forEach((k) => {
        if (k in this.compilerOptions) {
          delete opts[k];
          builtinOpts[k] = this.compilerOptions[k];
        }
      });

      const results = tsCompiler.convertCompilerOptionsFromJson(opts);

      if (results.errors && results.errors.length) {
        throw new Error(JSON.stringify(results.errors));
      }

      parsedConfig = this.parsedConfig = { typescriptOpts: results.options, builtinOpts };
    }

    return parsedConfig;
  }

  compileSync(sourceCode, filePath, compilerContext) {
    ts = ts || require('typescript');
    const options = this._getParsedConfigOptions(ts);

    let userBabelOpts = this.parsedConfig.builtinOpts.babel;
    let useCoverage = false;
    if ('coverage' in options.builtinOpts) {
      const coverage = options.builtinOpts.coverage;
      if (typeof coverage === 'string') {
        useCoverage = this.getEnv() === coverage;
      } else {
        useCoverage = !!coverage;
      }
    }

    let useBabel = !!userBabelOpts || useCoverage;

    let compilerOptions = Object.assign({}, options.typescriptOpts);
    if (useBabel) {
      if (compilerOptions.inlineSourceMap) {
        // force generating external sourceMaps, so we can feed them through babel.
        // babel will then generate them inline.
        delete compilerOptions.inlineSourceMap;
        delete compilerOptions.inlineSources;
        compilerOptions.sourceMap = true;
      }
    }

    const isTsx = filePath.match(/\.tsx$/i);
    const transpileOptions = {
      compilerOptions,
      fileName: filePath.match(/\.(ts|tsx)$/i) ? path.basename(filePath) : null
    };

    if (isTsx && options.builtinOpts.hotModuleReload !== false) {
      sourceCode = this.addHotModuleLoadingRegistration(sourceCode, filePath, this.getExportsForFile(sourceCode, filePath, options.typescriptOpts));
    }

    let output = ts.transpileModule(sourceCode, transpileOptions);

    d(JSON.stringify(output.diagnostics));

    // map typescript compiler output to electron-compilers expectations
    let code = output.outputText;
    let sourceMaps = output.sourceMapText ? output.sourceMapText : null; // prefer 'null' over 'undefined'

    if (useBabel) {
      if (!this.babel) {
        const BabelCompiler = require('./babel').default;
        this.babel = new BabelCompiler();

        let babelOpts = Object.assign({}, userBabelOpts || {});
        if (useCoverage) {
          babelOpts.coverage = true;
        }

        // translate sourceMap options from typescript to babel
        if (options.typescriptOpts.inlineSourceMap) {
          babelOpts.sourceMaps = 'inline';
        } else if (options.typescriptOpts.sourceMap) {
          babelOpts.sourceMaps = true;
        }

        this.babelOpts = babelOpts;
      }

      this.babel.compilerOptions = Object.assign({}, this.babelOpts, {
        // babel API wants sourceMap as an object or a path. let's not touch the disk.
        inputSourceMap: sourceMaps ? JSON.parse(sourceMaps) : null,
      });
      let babelOutput = this.babel.compileSync(code, filePath, {});

      // babel-transformed, potentially instrumented code
      code = babelOutput.code;

      // null if inline sourceMaps are used, which is okay.
      sourceMaps = babelOutput.sourceMaps;

      // NB we don't need to mess with mime type, it's application/javascript all the way down.
    }

    return {
      code,
      mimeType: this.outMimeType,
      sourceMaps
    };
  }

  addHotModuleLoadingRegistration(sourceCode, fileName, exports) {
    if (exports.length < 1) return sourceCode;

    let registrations = exports.map(x => {
      let id = `${x}` == 'default' ? '(typeof _default !== \'undefined\' ? _default : exports.default)' : `${x}`;
      let name = `"${x}"`;
      return `__REACT_HOT_LOADER__.register(${id}, ${name}, __FILENAME__);\n`;
    });

    let tmpl = `
${sourceCode}

if (typeof __REACT_HOT_LOADER__ !== 'undefined') {
  const __FILENAME__ = "${jsEscape(fileName)}";
  ${registrations}
}`;

    return tmpl;
  }

  getExportsForFile(sourceCode, fileName, tsOptions) {
    let sourceFile = ts.createSourceFile(fileName, sourceCode, ts.ScriptTarget.ES6);
    let ret = [];

    // Walk the tree to search for classes
    let visit = (node) => {
      if (!this.isNodeExported(node)) return;
      
      if (node.kind === ts.SyntaxKind.ClassDeclaration || node.kind === ts.SyntaxKind.FunctionDeclaration) {
        ret.push(node.name.text);
      }
    };

    ts.forEachChild(sourceFile, visit);

    return ret;
  }

  isNodeExported(node) {
    return (node.flags & ts.NodeFlags.Export) !== 0 || (node.parent && node.parent.kind === ts.SyntaxKind.SourceFile);
  }

  getCompilerVersion() {
    return require('typescript/package.json').version;
  }
}
