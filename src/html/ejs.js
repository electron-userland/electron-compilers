import {SimpleCompilerBase} from '../compiler-base';

// It should be noted that this compiler may not be perfect when it comes to
// caching, due to the ability of ejs to include other files, at least at this 
// time (first created)

const inputMimeTypes = ['text/ejs'];
let ejs = null;

/**
 * @access private
 */ 
export default class EjsCompiler extends SimpleCompilerBase {
  constructor() {
    super();

    // This is here in case the user/developer has access to the compiler
    // Those using ejs with electron may already be assuming they can
    // access/provide the data object to pass in to the renderer.
    this.data = {};
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    ejs = ejs || require('ejs');

    let code = ejs.render(
      sourceCode,
      this.data,
      Object.assign({ filename: filePath, cache: false }, this.compilerOptions));

    return { code, mimeType: 'text/html' };
  }
  
  getCompilerVersion() {
    return require('ejs/package.json').version;
  }

  // Users of ejs will likely be more familiar with the 'options' key
  // This is here in case the user/developer has access to the compiler
  get options() {
    return this.compilerOptions;
  }

  set options(newOptions) {
    this.compilerOptions = newOptions;
  }
}
