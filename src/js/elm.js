import fs from 'fs';
import tmp from 'tmp';
import {SimpleCompilerBase} from '../compiler-base';

const inputMimeTypes = ['text/elm'];
let elmCompiler = null;

/**
 * @access private
 */
export default class ElmCompiler extends SimpleCompilerBase {
  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    elmCompiler = elmCompiler || require('node-elm-compiler');
    const output = tmp.fileSync({ postfix: '.js' });

    const make = elmCompiler.compileSync(filePath, {
      pathToMake: require.resolve('.bin/elm-make'),
      output: output.name,
      yes: true
    });

    if (make.status > 0) {
      throw new Error('elm-make failed, see console for details');
    }
    if (make.error) {
      throw make.error;
    }

    const code = String(fs.readFileSync(output.name));
    output.removeCallback();
    return {
      code,
      mimeType: 'application/javascript'
    };
  }


  getCompilerVersion() {
    return require('coffee-script/package.json').version;
  }
}
