export class CompilerBase {
  constructor() {
    this.compilerOptions = {};
  }

  static getInputMimeTypes() {
    throw new Error("Implement me!");
  }

  async shouldCompileFile(fileName, compilerContext) {
    throw new Error("Implement me!");
  }

  async determineDependentFiles(sourceCode, filePath, compilerContext) {
    throw new Error("Implement me!");
  }

  async compile(sourceCode, filePath, compilerContext) {
    throw new Error("Implement me!");
  }

  shouldCompileFileSync(fileName, compilerContext) {
    throw new Error("Implement me!");
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    throw new Error("Implement me!");
  }

  compileSync(sourceCode, filePath, compilerContext) {
    throw new Error("Implement me!");
  }

  getCompilerVersion() {
    throw new Error("Implement me!");
  }
}

export class SimpleCompilerBase extends CompilerBase {
  constructor() {
    super();
  }

  async shouldCompileFile(fileName, compilerContext) {
    return true;
  }

  async determineDependentFiles(sourceCode, filePath, compilerContext) {
    return [];
  }

  async compile(sourceCode, filePath, compilerContext) {
    return this.compileSync(sourceCode, filePath, compilerContext);
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    return [];
  }

  compileSync(sourceCode, filePath, compilerContext) {
    throw new Error("Implement me!");
  }
}
