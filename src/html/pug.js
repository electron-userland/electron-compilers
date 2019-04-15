import {SimpleCompilerBase} from '../compiler-base';

const inputMimeTypes = ['text/pug'];
let pug = null;

/**
 * @access private
 */ 
export default class PugCompiler extends SimpleCompilerBase {
  constructor() {
    super();
    this.compilerOptions.sourceMap = true;
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    pug = pug || require('pug');
    let code = pug.render(
      sourceCode,
      Object.assign({ filename: filePath, cache: false }, this.compilerOptions));

    return { code, mimeType: 'text/html' };
  }
  
  getCompilerVersion() {
    return require('pug/package.json').version;
  }
}
