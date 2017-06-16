'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _compilerBase = require('./compiler-base');

var _mimeTypes = require('@paulcbetts/mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const inputMimeTypes = ['text/plain', 'image/svg+xml'];

/**
 * @access private
 * 
 * This class is used for binary files and other files that should end up in 
 * your cache directory, but aren't actually compiled
 */
class PassthroughCompiler extends _compilerBase.SimpleCompilerBase {
  constructor() {
    super();
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
  }

  compileSync(sourceCode, filePath) {
    return {
      code: sourceCode,
      mimeType: _mimeTypes2.default.lookup(filePath)
    };
  }

  getCompilerVersion() {
    return require(_path2.default.join(__dirname, '..', 'package.json')).version;
  }
}
exports.default = PassthroughCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9wYXNzdGhyb3VnaC5qcyJdLCJuYW1lcyI6WyJpbnB1dE1pbWVUeXBlcyIsIlBhc3N0aHJvdWdoQ29tcGlsZXIiLCJjb25zdHJ1Y3RvciIsImdldElucHV0TWltZVR5cGVzIiwiY29tcGlsZVN5bmMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJjb2RlIiwibWltZVR5cGUiLCJsb29rdXAiLCJnZXRDb21waWxlclZlcnNpb24iLCJyZXF1aXJlIiwiam9pbiIsIl9fZGlybmFtZSIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLGlCQUFpQixDQUFDLFlBQUQsRUFBZSxlQUFmLENBQXZCOztBQUdBOzs7Ozs7QUFNZSxNQUFNQyxtQkFBTiwwQ0FBcUQ7QUFDbEVDLGdCQUFjO0FBQ1o7QUFDRDs7QUFFRCxTQUFPQyxpQkFBUCxHQUEyQjtBQUN6QixXQUFPSCxjQUFQO0FBQ0Q7O0FBRURJLGNBQVlDLFVBQVosRUFBd0JDLFFBQXhCLEVBQWtDO0FBQ2hDLFdBQU87QUFDTEMsWUFBTUYsVUFERDtBQUVMRyxnQkFBVSxvQkFBVUMsTUFBVixDQUFpQkgsUUFBakI7QUFGTCxLQUFQO0FBSUQ7O0FBRURJLHVCQUFxQjtBQUNuQixXQUFPQyxRQUFRLGVBQUtDLElBQUwsQ0FBVUMsU0FBVixFQUFxQixJQUFyQixFQUEyQixjQUEzQixDQUFSLEVBQW9EQyxPQUEzRDtBQUNEO0FBbEJpRTtrQkFBL0NiLG1CIiwiZmlsZSI6InBhc3N0aHJvdWdoLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQge1NpbXBsZUNvbXBpbGVyQmFzZX0gZnJvbSAnLi9jb21waWxlci1iYXNlJztcbmltcG9ydCBtaW1lVHlwZXMgZnJvbSAnQHBhdWxjYmV0dHMvbWltZS10eXBlcyc7XG5cbmNvbnN0IGlucHV0TWltZVR5cGVzID0gWyd0ZXh0L3BsYWluJywgJ2ltYWdlL3N2Zyt4bWwnXTtcblxuXG4vKipcbiAqIEBhY2Nlc3MgcHJpdmF0ZVxuICogXG4gKiBUaGlzIGNsYXNzIGlzIHVzZWQgZm9yIGJpbmFyeSBmaWxlcyBhbmQgb3RoZXIgZmlsZXMgdGhhdCBzaG91bGQgZW5kIHVwIGluIFxuICogeW91ciBjYWNoZSBkaXJlY3RvcnksIGJ1dCBhcmVuJ3QgYWN0dWFsbHkgY29tcGlsZWRcbiAqLyBcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFBhc3N0aHJvdWdoQ29tcGlsZXIgZXh0ZW5kcyBTaW1wbGVDb21waWxlckJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHJldHVybiBpbnB1dE1pbWVUeXBlcztcbiAgfVxuXG4gIGNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IHNvdXJjZUNvZGUsXG4gICAgICBtaW1lVHlwZTogbWltZVR5cGVzLmxvb2t1cChmaWxlUGF0aClcbiAgICB9O1xuICB9XG4gIFxuICBnZXRDb21waWxlclZlcnNpb24oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUocGF0aC5qb2luKF9fZGlybmFtZSwgJy4uJywgJ3BhY2thZ2UuanNvbicpKS52ZXJzaW9uO1xuICB9XG59XG4iXX0=