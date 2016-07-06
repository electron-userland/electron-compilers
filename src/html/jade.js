import {SimpleCompilerBase} from '../compiler-base';

const inputMimeTypes = ['text/jade'];
let jade = null;

/**
 * @access private
 */ 
export default class JadeCompiler extends SimpleCompilerBase {
  constructor() {
    super();
    this.compilerOptions.sourceMap = true;
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    jade = pug || require('pug');

    let code = jade.render(
      sourceCode,
      Object.assign({ filename: filePath, cache: false }, this.compilerOptions));

    return { code, mimeType: 'text/html' };
  }
  
  getCompilerVersion() {
    return require('pug/package.json').version;
  }
}
