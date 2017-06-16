'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _detectiveLess = require('detective-less');

var _detectiveLess2 = _interopRequireDefault(_detectiveLess);

var _compilerBase = require('../compiler-base');

var _toutsuite = require('toutsuite');

var _toutsuite2 = _interopRequireDefault(_toutsuite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const mimeTypes = ['text/less'];
let lessjs = null;

/**
 * @access private
 */
class LessCompiler extends _compilerBase.CompilerBase {
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

  shouldCompileFile(fileName, compilerContext) {
    return _asyncToGenerator(function* () {
      return true;
    })();
  }

  determineDependentFiles(sourceCode, filePath, compilerContext) {
    var _this = this;

    return _asyncToGenerator(function* () {
      return _this.determineDependentFilesSync(sourceCode, filePath, compilerContext);
    })();
  }

  compile(sourceCode, filePath, compilerContext) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      lessjs = lessjs || _this2.getLess();

      let thisPath = _path2.default.dirname(filePath);
      _this2.seenFilePaths[thisPath] = true;

      let paths = Object.keys(_this2.seenFilePaths);

      if (_this2.compilerOptions.paths) {
        paths.push(..._this2.compilerOptions.paths);
      }

      let opts = Object.assign({}, _this2.compilerOptions, {
        paths: paths,
        filename: _path2.default.basename(filePath)
      });

      let result = yield lessjs.render(sourceCode, opts);
      let source = result.css;

      // NB: If you compile a file that is solely imports, its
      // actual content is '' yet it is a valid file. '' is not
      // truthy, so we're going to replace it with a string that
      // is truthy.
      if (!source && typeof source === 'string') {
        source = ' ';
      }

      return {
        code: source,
        mimeType: 'text/css'
      };
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    let dependencyFilenames = (0, _detectiveLess2.default)(sourceCode);
    let dependencies = [];

    for (let dependencyName of dependencyFilenames) {
      dependencies.push(_path2.default.join(_path2.default.dirname(filePath), dependencyName));
    }

    return dependencies;
  }

  compileSync(sourceCode, filePath, compilerContext) {
    lessjs = lessjs || this.getLess();

    let source;
    let error = null;

    let thisPath = _path2.default.dirname(filePath);
    this.seenFilePaths[thisPath] = true;

    let paths = Object.keys(this.seenFilePaths);

    if (this.compilerOptions.paths) {
      paths.push(...this.compilerOptions.paths);
    }

    let opts = Object.assign({}, this.compilerOptions, {
      paths: paths,
      filename: _path2.default.basename(filePath),
      fileAsync: false, async: false, syncImport: true
    });

    (0, _toutsuite2.default)(() => {
      lessjs.render(sourceCode, opts, (err, out) => {
        if (err) {
          error = err;
        } else {
          // NB: Because we've forced less to work in sync mode, we can do this
          source = out.css;
        }
      });
    });

    if (error) {
      throw error;
    }

    // NB: If you compile a file that is solely imports, its
    // actual content is '' yet it is a valid file. '' is not
    // truthy, so we're going to replace it with a string that
    // is truthy.
    if (!source && typeof source === 'string') {
      source = ' ';
    }

    return {
      code: source,
      mimeType: 'text/css'
    };
  }

  getLess() {
    let ret;
    (0, _toutsuite2.default)(() => ret = require('less'));
    return ret;
  }

  getCompilerVersion() {
    return require('less/package.json').version;
  }
}
exports.default = LessCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3MvbGVzcy5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJsZXNzanMiLCJMZXNzQ29tcGlsZXIiLCJjb25zdHJ1Y3RvciIsImNvbXBpbGVyT3B0aW9ucyIsInNvdXJjZU1hcCIsInNvdXJjZU1hcEZpbGVJbmxpbmUiLCJzZWVuRmlsZVBhdGhzIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJzaG91bGRDb21waWxlRmlsZSIsImZpbGVOYW1lIiwiY29tcGlsZXJDb250ZXh0IiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJjb21waWxlIiwiZ2V0TGVzcyIsInRoaXNQYXRoIiwiZGlybmFtZSIsInBhdGhzIiwiT2JqZWN0Iiwia2V5cyIsInB1c2giLCJvcHRzIiwiYXNzaWduIiwiZmlsZW5hbWUiLCJiYXNlbmFtZSIsInJlc3VsdCIsInJlbmRlciIsInNvdXJjZSIsImNzcyIsImNvZGUiLCJtaW1lVHlwZSIsInNob3VsZENvbXBpbGVGaWxlU3luYyIsImRlcGVuZGVuY3lGaWxlbmFtZXMiLCJkZXBlbmRlbmNpZXMiLCJkZXBlbmRlbmN5TmFtZSIsImpvaW4iLCJjb21waWxlU3luYyIsImVycm9yIiwiZmlsZUFzeW5jIiwiYXN5bmMiLCJzeW5jSW1wb3J0IiwiZXJyIiwib3V0IiwicmV0IiwicmVxdWlyZSIsImdldENvbXBpbGVyVmVyc2lvbiIsInZlcnNpb24iXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFQSxNQUFNQSxZQUFZLENBQUMsV0FBRCxDQUFsQjtBQUNBLElBQUlDLFNBQVMsSUFBYjs7QUFFQTs7O0FBR2UsTUFBTUMsWUFBTixvQ0FBd0M7QUFDckRDLGdCQUFjO0FBQ1o7O0FBRUEsU0FBS0MsZUFBTCxHQUF1QjtBQUNyQkMsaUJBQVcsRUFBRUMscUJBQXFCLElBQXZCO0FBRFUs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QixFQUF3QztBQUNqRGdCLGFBQU9BLEtBRDBDO0FBRWpETSxnQkFBVSxlQUFLQyxRQUFMLENBQWNiLFFBQWQsQ0FGdUM7QUFHakQyQixpQkFBVyxLQUhzQyxFQUcvQkMsT0FBTyxLQUh3QixFQUdqQkMsWUFBWTtBQUhLLEtBQXhDLENBQVg7O0FBTUEsNkJBQVUsTUFBTTtBQUNkMUMsYUFBTzRCLE1BQVAsQ0FBY2hCLFVBQWQsRUFBMEJXLElBQTFCLEVBQWdDLENBQUNvQixHQUFELEVBQU1DLEdBQU4sS0FBYztBQUM1QyxZQUFJRCxHQUFKLEVBQVM7QUFDUEosa0JBQVFJLEdBQVI7QUFDRCxTQUZELE1BRU87QUFDTDtBQUNBZCxtQkFBU2UsSUFBSWQsR0FBYjtBQUNEO0FBQ0YsT0FQRDtBQVFELEtBVEQ7O0FBV0EsUUFBSVMsS0FBSixFQUFXO0FBQ1QsWUFBTUEsS0FBTjtBQUNEOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsUUFBSSxDQUFDVixNQUFELElBQVcsT0FBT0EsTUFBUCxLQUFrQixRQUFqQyxFQUEyQztBQUN6Q0EsZUFBUyxHQUFUO0FBQ0Q7O0FBRUQsV0FBTztBQUNMRSxZQUFNRixNQUREO0FBRUxHLGdCQUFVO0FBRkwsS0FBUDtBQUlEOztBQUVEaEIsWUFBVTtBQUNSLFFBQUk2QixHQUFKO0FBQ0EsNkJBQVUsTUFBTUEsTUFBTUMsUUFBUSxNQUFSLENBQXRCO0FBQ0EsV0FBT0QsR0FBUDtBQUNEOztBQUVERSx1QkFBcUI7QUFDbkIsV0FBT0QsUUFBUSxtQkFBUixFQUE2QkUsT0FBcEM7QUFDRDtBQWxJb0Q7a0JBQWxDL0MsWSIsImZpbGUiOiJsZXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZGV0ZWN0aXZlIGZyb20gJ2RldGVjdGl2ZS1sZXNzJztcbmltcG9ydCB7Q29tcGlsZXJCYXNlfSBmcm9tICcuLi9jb21waWxlci1iYXNlJztcbmltcG9ydCB0b3V0U3VpdGUgZnJvbSAndG91dHN1aXRlJztcblxuY29uc3QgbWltZVR5cGVzID0gWyd0ZXh0L2xlc3MnXTtcbmxldCBsZXNzanMgPSBudWxsO1xuXG4vKipcbiAqIEBhY2Nlc3MgcHJpdmF0ZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMZXNzQ29tcGlsZXIgZXh0ZW5kcyBDb21waWxlckJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb21waWxlck9wdGlvbnMgPSB7XG4gICAgICBzb3VyY2VNYXA6IHsgc291cmNlTWFwRmlsZUlubGluZTogdHJ1ZSB9XG4gICAgfTtcblxuICAgIHRoaXMuc2VlbkZpbGVQYXRocyA9IHt9O1xuICB9XG5cbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHJldHVybiBtaW1lVHlwZXM7XG4gIH1cblxuICBhc3luYyBzaG91bGRDb21waWxlRmlsZShmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlcyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZShzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgbGVzc2pzID0gbGVzc2pzIHx8IHRoaXMuZ2V0TGVzcygpO1xuXG4gICAgbGV0IHRoaXNQYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgICB0aGlzLnNlZW5GaWxlUGF0aHNbdGhpc1BhdGhdID0gdHJ1ZTtcblxuICAgIGxldCBwYXRocyA9IE9iamVjdC5rZXlzKHRoaXMuc2VlbkZpbGVQYXRocyk7XG5cbiAgICBpZiAodGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpIHtcbiAgICAgIHBhdGhzLnB1c2goLi4udGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpO1xuICAgIH1cblxuICAgIGxldCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jb21waWxlck9wdGlvbnMsIHtcbiAgICAgIHBhdGhzOiBwYXRocyxcbiAgICAgIGZpbGVuYW1lOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKVxuICAgIH0pO1xuXG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IGxlc3Nqcy5yZW5kZXIoc291cmNlQ29kZSwgb3B0cyk7XG4gICAgbGV0IHNvdXJjZSA9IHJlc3VsdC5jc3M7XG5cbiAgICAvLyBOQjogSWYgeW91IGNvbXBpbGUgYSBmaWxlIHRoYXQgaXMgc29sZWx5IGltcG9ydHMsIGl0c1xuICAgIC8vIGFjdHVhbCBjb250ZW50IGlzICcnIHlldCBpdCBpcyBhIHZhbGlkIGZpbGUuICcnIGlzIG5vdFxuICAgIC8vIHRydXRoeSwgc28gd2UncmUgZ29pbmcgdG8gcmVwbGFjZSBpdCB3aXRoIGEgc3RyaW5nIHRoYXRcbiAgICAvLyBpcyB0cnV0aHkuXG4gICAgaWYgKCFzb3VyY2UgJiYgdHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNvdXJjZSA9ICcgJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogc291cmNlLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgbGV0IGRlcGVuZGVuY3lGaWxlbmFtZXMgPSBkZXRlY3RpdmUoc291cmNlQ29kZSk7XG4gICAgbGV0IGRlcGVuZGVuY2llcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgZGVwZW5kZW5jeU5hbWUgb2YgZGVwZW5kZW5jeUZpbGVuYW1lcykge1xuICAgICAgZGVwZW5kZW5jaWVzLnB1c2gocGF0aC5qb2luKHBhdGguZGlybmFtZShmaWxlUGF0aCksIGRlcGVuZGVuY3lOYW1lKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgfVxuXG4gIGNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBsZXNzanMgPSBsZXNzanMgfHwgdGhpcy5nZXRMZXNzKCk7XG5cbiAgICBsZXQgc291cmNlO1xuICAgIGxldCBlcnJvciA9IG51bGw7XG5cbiAgICBsZXQgdGhpc1BhdGggPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIHRoaXMuc2VlbkZpbGVQYXRoc1t0aGlzUGF0aF0gPSB0cnVlO1xuXG4gICAgbGV0IHBhdGhzID0gT2JqZWN0LmtleXModGhpcy5zZWVuRmlsZVBhdGhzKTtcblxuICAgIGlmICh0aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuICAgICAgcGF0aHMucHVzaCguLi50aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocyk7XG4gICAgfVxuXG4gICAgbGV0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbXBpbGVyT3B0aW9ucywge1xuICAgICAgcGF0aHM6IHBhdGhzLFxuICAgICAgZmlsZW5hbWU6IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLFxuICAgICAgZmlsZUFzeW5jOiBmYWxzZSwgYXN5bmM6IGZhbHNlLCBzeW5jSW1wb3J0OiB0cnVlXG4gICAgfSk7XG5cbiAgICB0b3V0U3VpdGUoKCkgPT4ge1xuICAgICAgbGVzc2pzLnJlbmRlcihzb3VyY2VDb2RlLCBvcHRzLCAoZXJyLCBvdXQpID0+IHtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIE5COiBCZWNhdXNlIHdlJ3ZlIGZvcmNlZCBsZXNzIHRvIHdvcmsgaW4gc3luYyBtb2RlLCB3ZSBjYW4gZG8gdGhpc1xuICAgICAgICAgIHNvdXJjZSA9IG91dC5jc3M7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKGVycm9yKSB7XG4gICAgICB0aHJvdyBlcnJvcjtcbiAgICB9XG5cbiAgICAvLyBOQjogSWYgeW91IGNvbXBpbGUgYSBmaWxlIHRoYXQgaXMgc29sZWx5IGltcG9ydHMsIGl0c1xuICAgIC8vIGFjdHVhbCBjb250ZW50IGlzICcnIHlldCBpdCBpcyBhIHZhbGlkIGZpbGUuICcnIGlzIG5vdFxuICAgIC8vIHRydXRoeSwgc28gd2UncmUgZ29pbmcgdG8gcmVwbGFjZSBpdCB3aXRoIGEgc3RyaW5nIHRoYXRcbiAgICAvLyBpcyB0cnV0aHkuXG4gICAgaWYgKCFzb3VyY2UgJiYgdHlwZW9mIHNvdXJjZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHNvdXJjZSA9ICcgJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogc291cmNlLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgZ2V0TGVzcygpIHtcbiAgICBsZXQgcmV0O1xuICAgIHRvdXRTdWl0ZSgoKSA9PiByZXQgPSByZXF1aXJlKCdsZXNzJykpO1xuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBnZXRDb21waWxlclZlcnNpb24oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ2xlc3MvcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgfVxufVxuIl19