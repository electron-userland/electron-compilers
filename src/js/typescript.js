import {SimpleCompilerBase} from '../compiler-base';
import path from 'path';

const inputMimeTypes = ['text/typescript', 'text/tsx'];
const d = require('debug')('electron-compile:typescript-compiler');

let ts = null;

/**
 * @access private
 */
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

  compileSync(sourceCode, filePath) {
    this._resolveCompiler();
    if (!ts) {
      d(`compiler does not exists, do not process source codes`);
      return {
        code: sourceCode,
        mimeType: this.outMimeType
      };
    }

    const options = this._getParsedConfigOptions(ts);

    const transpileOptions = {
      compilerOptions: options,
      fileName: filePath.match(/\.(ts|tsx)$/i) ? path.basename(filePath) : null
    };

    const output = ts.transpileModule(sourceCode, transpileOptions);

    d(output.diagnostics);

    let sourceMaps;
    if (output.sourceMapText) {
      sourceMaps = output.sourceMapText;
    }

    return {
      code: output.outputText,
      mimeType: this.outMimeType,
      sourceMaps
    };
  }

  getCompilerVersion() {
    try {
      require.resolve('typescript');
      return require('typescript/package.json').version;
    } catch (e) {
      return "0.0.0";
    }
  }

  _resolveCompiler() {
    if (ts) {
      return;
    }

    try {
      require.resolve('typescript');
      ts = require('typescript');
    } catch(e) {
      return;
    }
  }

  _getParsedConfigOptions(tsCompiler) {
    let parsedConfig = this.parsedConfig;
    if (!parsedConfig) {
      const results = tsCompiler.convertCompilerOptionsFromJson(this.compilerOptions);
      if (results.errors && results.errors.length) {
        throw new Error(JSON.stringify(results.errors));
      }
      parsedConfig = this.parsedConfig = results.options;
    }
    return parsedConfig;
  }
}
