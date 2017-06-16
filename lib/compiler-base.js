"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

/**
 * This class is the base interface for compilers that are used by 
 * electron-compile. If your compiler library only supports a 
 * synchronous API, use SimpleCompilerBase instead.
 *
 * @interface
 */
class CompilerBase {
  constructor() {
    this.compilerOptions = {};
  }

  /**  
   * This method describes the MIME types that your compiler supports as input. 
   * Many precompiled file types don't have a specific MIME type, so if it's not
   * recognized by the mime-types package, you need to patch rig-mime-types in
   * electron-compile.
   *
   * @return {string[]}  An array of MIME types that this compiler can compile.
   *
   * @abstract
   */
  static getInputMimeTypes() {
    throw new Error("Implement me!");
  }

  /**
   * Determines whether a file should be compiled
   *    
   * @param  {string} fileName        The full path of a file to compile.
   * @param  {object} compilerContext An object that compilers can add extra
                                    information to as part of a job - the caller
                                    won't do anything with this.
   * @return {Promise<bool>}        True if you are able to compile this file.
   *
   * @abstract
   */
  shouldCompileFile(fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      throw new Error("Implement me!");
    })();
  }

  /**  
   * Returns the dependent files of this file. This is used for languages such
   * as LESS which allow you to import / reference other related files. In future
   * versions of electron-compile, we will use this information to invalidate
   * all of the parent files if a child file changes.
   *    
   * @param  {string} sourceCode    The contents of filePath
   * @param  {string} fileName        The full path of a file to compile.
   * @param  {object} compilerContext An object that compilers can add extra
                                    information to as part of a job - the caller
                                    won't do anything with this.
   * @return {Promise<string[]>}    An array of dependent file paths, or an empty
   *                                array if there are no dependent files. 
   *
   * @abstract
   */
  determineDependentFiles(sourceCode, fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      throw new Error("Implement me!");
    })();
  }

  /**  
   * Compiles the file
   *    
   * @param  {string} sourceCode    The contents of filePath
   * @param  {string} fileName      The full path of a file to compile.
   * @param  {object} compilerContext An object that compilers can add extra
                                    information to as part of a job - the caller
                                    won't do anything with this.
   * @return {Promise<object>}      An object representing the compiled result
   * @property {string} code        The compiled code
   * @property {string} mimeType    The MIME type of the compiled result, which 
   *                                should exist in the mime-types database.
   *
   * @abstract
   */
  compile(sourceCode, fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      throw new Error("Implement me!");
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    throw new Error("Implement me!");
  }

  determineDependentFilesSync(sourceCode, fileName, compilerContext) {
    throw new Error("Implement me!");
  }

  compileSync(sourceCode, fileName, compilerContext) {
    throw new Error("Implement me!");
  }

  /**
   * Returns a version number representing the version of the underlying 
   * compiler library. When this number changes, electron-compile knows
   * to throw all away its generated code.
   *    
   * @return {string}  A version number. Note that this string isn't 
   *                   parsed in any way, just compared to the previous
   *                   one for equality.
   *
   * @abstract
   */
  getCompilerVersion() {
    throw new Error("Implement me!");
  }
}

exports.CompilerBase = CompilerBase; /**
                                      * This class implements all of the async methods of CompilerBase by just 
                                      * calling the sync version. Use it to save some time when implementing 
                                      * simple compilers.
                                      *
                                      * To use it, implement the compile method, the getCompilerVersion method, 
                                      * and the getInputMimeTypes static method. 
                                      * 
                                      * @abstract
                                      */

class SimpleCompilerBase extends CompilerBase {
  constructor() {
    super();
  }

  shouldCompileFile(fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      return true;
    })();
  }

  determineDependentFiles(sourceCode, filePath, compilerContext) {
    return _asyncToGenerator(function* () {
      return [];
    })();
  }

  compile(sourceCode, filePath, compilerContext) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return _this.compileSync(sourceCode, filePath, compilerContext);
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    return [];
  }
}
exports.SimpleCompilerBase = SimpleCompilerBase;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb21waWxlci1iYXNlLmpzIl0sIm5hbWVzIjpbIkNvbXBpbGVyQmFzZSIsImNvbnN0cnVjdG9yIiwiY29tcGlsZXJPcHRpb25zIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJFcnJvciIsInNob3VsZENvbXBpbGVGaWxlIiwiZmlsZU5hbWUiLCJjb21waWxlckNvbnRleHQiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlcyIsInNvdXJjZUNvZGUiLCJjb21waWxlIiwic2hvdWxkQ29tcGlsZUZpbGVTeW5jIiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jIiwiY29tcGlsZVN5bmMiLCJnZXRDb21waWxlclZlcnNpb24iLCJTaW1wbGVDb21waWxlckJhc2UiLCJmaWxlUGF0aCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7Ozs7OztBQU9PLE1BQU1BLFlBQU4sQ0FBbUI7QUFDeEJDLGdCQUFjO0FBQ1osU0FBS0MsZUFBTCxHQUF1QixFQUF2QjtBQUNEOztBQUVEOzs7Ozs7Ozs7O0FBVUEsU0FBT0MsaUJBQVAsR0FBMkI7QUFDekIsVUFBTSxJQUFJQyxLQUFKLENBQVUsZUFBVixDQUFOO0FBQ0Q7O0FBR0Q7Ozs7Ozs7Ozs7O0FBV01DLG1CQUFOLENBQXdCQyxRQUF4QixFQUFrQ0MsZUFBbEMsRUFBbUQ7QUFBQTtBQUNqRCxZQUFNLElBQUlILEtBQUosQ0FBVSxlQUFWLENBQU47QUFEaUQ7QUFFbEQ7O0FBR0Q7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQk1JLHlCQUFOLENBQThCQyxVQUE5QixFQUEwQ0gsUUFBMUMsRUFBb0RDLGVBQXBELEVBQXFFO0FBQUE7QUFDbkUsWUFBTSxJQUFJSCxLQUFKLENBQVUsZUFBVixDQUFOO0FBRG1FO0FBRXBFOztBQUdEOzs7Ozs7Ozs7Ozs7Ozs7QUFlTU0sU0FBTixDQUFjRCxVQUFkLEVBQTBCSCxRQUExQixFQUFvQ0MsZUFBcEMsRUFBcUQ7QUFBQTtBQUNuRCxZQUFNLElBQUlILEtBQUosQ0FBVSxlQUFWLENBQU47QUFEbUQ7QUFFcEQ7O0FBRURPLHdCQUFzQkwsUUFBdEIsRUFBZ0NDLGVBQWhDLEVBQWlEO0FBQy9DLFVBQU0sSUFBSUgsS0FBSixDQUFVLGVBQVYsQ0FBTjtBQUNEOztBQUVEUSw4QkFBNEJILFVBQTVCLEVBQXdDSCxRQUF4QyxFQUFrREMsZUFBbEQsRUFBbUU7QUFDakUsVUFBTSxJQUFJSCxLQUFKLENBQVUsZUFBVixDQUFOO0FBQ0Q7O0FBRURTLGNBQVlKLFVBQVosRUFBd0JILFFBQXhCLEVBQWtDQyxlQUFsQyxFQUFtRDtBQUNqRCxVQUFNLElBQUlILEtBQUosQ0FBVSxlQUFWLENBQU47QUFDRDs7QUFFRDs7Ozs7Ozs7Ozs7QUFXQVUsdUJBQXFCO0FBQ25CLFVBQU0sSUFBSVYsS0FBSixDQUFVLGVBQVYsQ0FBTjtBQUNEO0FBckd1Qjs7UUFBYkosWSxHQUFBQSxZLEVBeUdiOzs7Ozs7Ozs7OztBQVVPLE1BQU1lLGtCQUFOLFNBQWlDZixZQUFqQyxDQUE4QztBQUNuREMsZ0JBQWM7QUFDWjtBQUNEOztBQUVLSSxtQkFBTixDQUF3QkMsUUFBeEIsRUFBa0NDLGVBQWxDLEVBQW1EO0FBQUE7QUFDakQsYUFBTyxJQUFQO0FBRGlEO0FBRWxEOztBQUVLQyx5QkFBTixDQUE4QkMsVUFBOUIsRUFBMENPLFFBQTFDLEVBQW9EVCxlQUFwRCxFQUFxRTtBQUFBO0FBQ25FLGFBQU8sRUFBUDtBQURtRTtBQUVwRTs7QUFFS0csU0FBTixDQUFjRCxVQUFkLEVBQTBCTyxRQUExQixFQUFvQ1QsZUFBcEMsRUFBcUQ7QUFBQTs7QUFBQTtBQUNuRCxhQUFPLE1BQUtNLFdBQUwsQ0FBaUJKLFVBQWpCLEVBQTZCTyxRQUE3QixFQUF1Q1QsZUFBdkMsQ0FBUDtBQURtRDtBQUVwRDs7QUFFREksd0JBQXNCTCxRQUF0QixFQUFnQ0MsZUFBaEMsRUFBaUQ7QUFDL0MsV0FBTyxJQUFQO0FBQ0Q7O0FBRURLLDhCQUE0QkgsVUFBNUIsRUFBd0NPLFFBQXhDLEVBQWtEVCxlQUFsRCxFQUFtRTtBQUNqRSxXQUFPLEVBQVA7QUFDRDtBQXZCa0Q7UUFBeENRLGtCLEdBQUFBLGtCIiwiZmlsZSI6ImNvbXBpbGVyLWJhc2UuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIFRoaXMgY2xhc3MgaXMgdGhlIGJhc2UgaW50ZXJmYWNlIGZvciBjb21waWxlcnMgdGhhdCBhcmUgdXNlZCBieSBcbiAqIGVsZWN0cm9uLWNvbXBpbGUuIElmIHlvdXIgY29tcGlsZXIgbGlicmFyeSBvbmx5IHN1cHBvcnRzIGEgXG4gKiBzeW5jaHJvbm91cyBBUEksIHVzZSBTaW1wbGVDb21waWxlckJhc2UgaW5zdGVhZC5cbiAqXG4gKiBAaW50ZXJmYWNlXG4gKi8gXG5leHBvcnQgY2xhc3MgQ29tcGlsZXJCYXNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jb21waWxlck9wdGlvbnMgPSB7fTtcbiAgfVxuICBcbiAgLyoqICBcbiAgICogVGhpcyBtZXRob2QgZGVzY3JpYmVzIHRoZSBNSU1FIHR5cGVzIHRoYXQgeW91ciBjb21waWxlciBzdXBwb3J0cyBhcyBpbnB1dC4gXG4gICAqIE1hbnkgcHJlY29tcGlsZWQgZmlsZSB0eXBlcyBkb24ndCBoYXZlIGEgc3BlY2lmaWMgTUlNRSB0eXBlLCBzbyBpZiBpdCdzIG5vdFxuICAgKiByZWNvZ25pemVkIGJ5IHRoZSBtaW1lLXR5cGVzIHBhY2thZ2UsIHlvdSBuZWVkIHRvIHBhdGNoIHJpZy1taW1lLXR5cGVzIGluXG4gICAqIGVsZWN0cm9uLWNvbXBpbGUuXG4gICAqXG4gICAqIEByZXR1cm4ge3N0cmluZ1tdfSAgQW4gYXJyYXkgb2YgTUlNRSB0eXBlcyB0aGF0IHRoaXMgY29tcGlsZXIgY2FuIGNvbXBpbGUuXG4gICAqXG4gICAqIEBhYnN0cmFjdFxuICAgKi8gICBcbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkltcGxlbWVudCBtZSFcIik7XG4gIH1cblxuXG4gIC8qKlxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgYSBmaWxlIHNob3VsZCBiZSBjb21waWxlZFxuICAgKiAgICBcbiAgICogQHBhcmFtICB7c3RyaW5nfSBmaWxlTmFtZSAgICAgICAgVGhlIGZ1bGwgcGF0aCBvZiBhIGZpbGUgdG8gY29tcGlsZS5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBjb21waWxlckNvbnRleHQgQW4gb2JqZWN0IHRoYXQgY29tcGlsZXJzIGNhbiBhZGQgZXh0cmFcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluZm9ybWF0aW9uIHRvIGFzIHBhcnQgb2YgYSBqb2IgLSB0aGUgY2FsbGVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3b24ndCBkbyBhbnl0aGluZyB3aXRoIHRoaXMuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbD59ICAgICAgICBUcnVlIGlmIHlvdSBhcmUgYWJsZSB0byBjb21waWxlIHRoaXMgZmlsZS5cbiAgICpcbiAgICogQGFic3RyYWN0XG4gICAqLyAgIFxuICBhc3luYyBzaG91bGRDb21waWxlRmlsZShmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiSW1wbGVtZW50IG1lIVwiKTtcbiAgfVxuXG4gIFxuICAvKiogIFxuICAgKiBSZXR1cm5zIHRoZSBkZXBlbmRlbnQgZmlsZXMgb2YgdGhpcyBmaWxlLiBUaGlzIGlzIHVzZWQgZm9yIGxhbmd1YWdlcyBzdWNoXG4gICAqIGFzIExFU1Mgd2hpY2ggYWxsb3cgeW91IHRvIGltcG9ydCAvIHJlZmVyZW5jZSBvdGhlciByZWxhdGVkIGZpbGVzLiBJbiBmdXR1cmVcbiAgICogdmVyc2lvbnMgb2YgZWxlY3Ryb24tY29tcGlsZSwgd2Ugd2lsbCB1c2UgdGhpcyBpbmZvcm1hdGlvbiB0byBpbnZhbGlkYXRlXG4gICAqIGFsbCBvZiB0aGUgcGFyZW50IGZpbGVzIGlmIGEgY2hpbGQgZmlsZSBjaGFuZ2VzLlxuICAgKiAgICBcbiAgICogQHBhcmFtICB7c3RyaW5nfSBzb3VyY2VDb2RlICAgIFRoZSBjb250ZW50cyBvZiBmaWxlUGF0aFxuICAgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVOYW1lICAgICAgICBUaGUgZnVsbCBwYXRoIG9mIGEgZmlsZSB0byBjb21waWxlLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IGNvbXBpbGVyQ29udGV4dCBBbiBvYmplY3QgdGhhdCBjb21waWxlcnMgY2FuIGFkZCBleHRyYVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5mb3JtYXRpb24gdG8gYXMgcGFydCBvZiBhIGpvYiAtIHRoZSBjYWxsZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvbid0IGRvIGFueXRoaW5nIHdpdGggdGhpcy5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59ICAgIEFuIGFycmF5IG9mIGRlcGVuZGVudCBmaWxlIHBhdGhzLCBvciBhbiBlbXB0eVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyYXkgaWYgdGhlcmUgYXJlIG5vIGRlcGVuZGVudCBmaWxlcy4gXG4gICAqXG4gICAqIEBhYnN0cmFjdFxuICAgKi8gICBcbiAgYXN5bmMgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMoc291cmNlQ29kZSwgZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkltcGxlbWVudCBtZSFcIik7XG4gIH1cblxuICBcbiAgLyoqICBcbiAgICogQ29tcGlsZXMgdGhlIGZpbGVcbiAgICogICAgXG4gICAqIEBwYXJhbSAge3N0cmluZ30gc291cmNlQ29kZSAgICBUaGUgY29udGVudHMgb2YgZmlsZVBhdGhcbiAgICogQHBhcmFtICB7c3RyaW5nfSBmaWxlTmFtZSAgICAgIFRoZSBmdWxsIHBhdGggb2YgYSBmaWxlIHRvIGNvbXBpbGUuXG4gICAqIEBwYXJhbSAge29iamVjdH0gY29tcGlsZXJDb250ZXh0IEFuIG9iamVjdCB0aGF0IGNvbXBpbGVycyBjYW4gYWRkIGV4dHJhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmZvcm1hdGlvbiB0byBhcyBwYXJ0IG9mIGEgam9iIC0gdGhlIGNhbGxlclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29uJ3QgZG8gYW55dGhpbmcgd2l0aCB0aGlzLlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG9iamVjdD59ICAgICAgQW4gb2JqZWN0IHJlcHJlc2VudGluZyB0aGUgY29tcGlsZWQgcmVzdWx0XG4gICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBjb2RlICAgICAgICBUaGUgY29tcGlsZWQgY29kZVxuICAgKiBAcHJvcGVydHkge3N0cmluZ30gbWltZVR5cGUgICAgVGhlIE1JTUUgdHlwZSBvZiB0aGUgY29tcGlsZWQgcmVzdWx0LCB3aGljaCBcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNob3VsZCBleGlzdCBpbiB0aGUgbWltZS10eXBlcyBkYXRhYmFzZS5cbiAgICpcbiAgICogQGFic3RyYWN0XG4gICAqLyAgIFxuICBhc3luYyBjb21waWxlKHNvdXJjZUNvZGUsIGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBsZW1lbnQgbWUhXCIpO1xuICB9XG5cbiAgc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBsZW1lbnQgbWUhXCIpO1xuICB9XG5cbiAgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBsZW1lbnQgbWUhXCIpO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkltcGxlbWVudCBtZSFcIik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHZlcnNpb24gbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgdmVyc2lvbiBvZiB0aGUgdW5kZXJseWluZyBcbiAgICogY29tcGlsZXIgbGlicmFyeS4gV2hlbiB0aGlzIG51bWJlciBjaGFuZ2VzLCBlbGVjdHJvbi1jb21waWxlIGtub3dzXG4gICAqIHRvIHRocm93IGFsbCBhd2F5IGl0cyBnZW5lcmF0ZWQgY29kZS5cbiAgICogICAgXG4gICAqIEByZXR1cm4ge3N0cmluZ30gIEEgdmVyc2lvbiBudW1iZXIuIE5vdGUgdGhhdCB0aGlzIHN0cmluZyBpc24ndCBcbiAgICogICAgICAgICAgICAgICAgICAgcGFyc2VkIGluIGFueSB3YXksIGp1c3QgY29tcGFyZWQgdG8gdGhlIHByZXZpb3VzXG4gICAqICAgICAgICAgICAgICAgICAgIG9uZSBmb3IgZXF1YWxpdHkuXG4gICAqXG4gICAqIEBhYnN0cmFjdFxuICAgKi8gICBcbiAgZ2V0Q29tcGlsZXJWZXJzaW9uKCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkltcGxlbWVudCBtZSFcIik7XG4gIH1cbn1cblxuXG4vKipcbiAqIFRoaXMgY2xhc3MgaW1wbGVtZW50cyBhbGwgb2YgdGhlIGFzeW5jIG1ldGhvZHMgb2YgQ29tcGlsZXJCYXNlIGJ5IGp1c3QgXG4gKiBjYWxsaW5nIHRoZSBzeW5jIHZlcnNpb24uIFVzZSBpdCB0byBzYXZlIHNvbWUgdGltZSB3aGVuIGltcGxlbWVudGluZyBcbiAqIHNpbXBsZSBjb21waWxlcnMuXG4gKlxuICogVG8gdXNlIGl0LCBpbXBsZW1lbnQgdGhlIGNvbXBpbGUgbWV0aG9kLCB0aGUgZ2V0Q29tcGlsZXJWZXJzaW9uIG1ldGhvZCwgXG4gKiBhbmQgdGhlIGdldElucHV0TWltZVR5cGVzIHN0YXRpYyBtZXRob2QuIFxuICogXG4gKiBAYWJzdHJhY3RcbiAqLyBcbmV4cG9ydCBjbGFzcyBTaW1wbGVDb21waWxlckJhc2UgZXh0ZW5kcyBDb21waWxlckJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgYXN5bmMgc2hvdWxkQ29tcGlsZUZpbGUoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGUoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0aGlzLmNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpO1xuICB9XG5cbiAgc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG4iXX0=