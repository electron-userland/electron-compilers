'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _toutsuite = require('toutsuite');

var _toutsuite2 = _interopRequireDefault(_toutsuite);

var _detectiveSass = require('detective-sass');

var _detectiveSass2 = _interopRequireDefault(_detectiveSass);

var _detectiveScss = require('detective-scss');

var _detectiveScss2 = _interopRequireDefault(_detectiveScss);

var _sassLookup = require('sass-lookup');

var _sassLookup2 = _interopRequireDefault(_sassLookup);

var _compilerBase = require('../compiler-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const mimeTypes = ['text/sass', 'text/scss'];
let sass = null;

/**
 * @access private
 */
class SassCompiler extends _compilerBase.CompilerBase {
  constructor() {
    super();

    this.compilerOptions = {
      comments: true,
      sourceMapEmbed: true,
      sourceMapContents: true
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
      sass = sass || _this2.getSass();

      let thisPath = _path2.default.dirname(filePath);
      _this2.seenFilePaths[thisPath] = true;

      let paths = Object.keys(_this2.seenFilePaths);

      if (_this2.compilerOptions.paths) {
        paths.push(..._this2.compilerOptions.paths);
      }

      paths.unshift('.');

      sass.importer(_this2.buildImporterCallback(paths));

      let opts = Object.assign({}, _this2.compilerOptions, {
        indentedSyntax: filePath.match(/\.sass$/i),
        sourceMapRoot: filePath
      });

      // not a valid option
      delete opts.paths;

      let result = yield new Promise(function (res, rej) {
        sass.compile(sourceCode, opts, function (r) {
          if (r.status !== 0) {
            rej(new Error(r.formatted || r.message));
            return;
          }

          res(r);
          return;
        });
      });

      let source = result.text;

      // NB: If you compile a file that is solely imports, its
      // actual content is '' yet it is a valid file. '' is not
      // truthy, so we're going to replace it with a string that
      // is truthy.
      if (!source) {
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
    let dependencyFilenames = _path2.default.extname(filePath) === '.sass' ? (0, _detectiveSass2.default)(sourceCode) : (0, _detectiveScss2.default)(sourceCode);
    let dependencies = [];

    for (let dependencyName of dependencyFilenames) {
      dependencies.push((0, _sassLookup2.default)(dependencyName, _path2.default.basename(filePath), _path2.default.dirname(filePath)));
    }

    return dependencies;
  }

  compileSync(sourceCode, filePath, compilerContext) {
    sass = sass || this.getSass();

    let thisPath = _path2.default.dirname(filePath);
    this.seenFilePaths[thisPath] = true;

    let paths = Object.keys(this.seenFilePaths);

    if (this.compilerOptions.paths) {
      paths.push(...this.compilerOptions.paths);
    }

    paths.unshift('.');
    sass.importer(this.buildImporterCallback(paths));

    let opts = Object.assign({}, this.compilerOptions, {
      indentedSyntax: filePath.match(/\.sass$/i),
      sourceMapRoot: filePath
    });

    let result;
    (0, _toutsuite2.default)(() => {
      sass.compile(sourceCode, opts, r => {
        if (r.status !== 0) {
          throw new Error(r.formatted);
        }
        result = r;
      });
    });

    let source = result.text;

    // NB: If you compile a file that is solely imports, its
    // actual content is '' yet it is a valid file. '' is not
    // truthy, so we're going to replace it with a string that
    // is truthy.
    if (!source) {
      source = ' ';
    }

    return {
      code: source,
      mimeType: 'text/css'
    };
  }

  getSass() {
    let ret;
    (0, _toutsuite2.default)(() => ret = require('sass.js/dist/sass.node').Sass);
    return ret;
  }

  buildImporterCallback(includePaths) {
    const self = this;
    return function (request, done) {
      let file;
      if (request.file) {
        done();
        return;
      } else {
        // treat as it
        const importRequest = request.current;

        for (let includePath of includePaths) {
          const filePath = _path2.default.resolve(includePath, importRequest);
          let variations = sass.getPathVariations(filePath);

          file = variations.map(self.fixWindowsPath.bind(self)).reduce(self.importedFileReducer.bind(self), null);

          if (file) {
            const content = _fs2.default.readFileSync(file, { encoding: 'utf8' });
            return sass.writeFile(file, content, () => {
              done({ path: file });
              return;
            });
          }
        }

        if (!file) {
          done();
          return;
        }
      }
    };
  }

  importedFileReducer(found, path) {
    // Find the first variation that actually exists
    if (found) return found;

    try {
      const stat = _fs2.default.statSync(path);
      if (!stat.isFile()) return null;
      return path;
    } catch (e) {
      return null;
    }
  }

  fixWindowsPath(file) {
    // Unfortunately, there's a bug in sass.js that seems to ignore the different
    // path separators across platforms

    // For some reason, some files have a leading slash that we need to get rid of
    if (process.platform === 'win32' && file[0] === '/') {
      file = file.slice(1);
    }

    // Sass.js generates paths such as `_C:\myPath\file.sass` instead of `C:\myPath\_file.sass`
    if (file[0] === '_') {
      const parts = file.slice(1).split(_path2.default.sep);
      const dir = parts.slice(0, -1).join(_path2.default.sep);
      const fileName = parts.reverse()[0];
      file = _path2.default.resolve(dir, '_' + fileName);
    }
    return file;
  }

  getCompilerVersion() {
    // NB: There is a bizarre bug in the node module system where this doesn't
    // work but only in saveConfiguration tests
    //return require('@paulcbetts/node-sass/package.json').version;
    return "4.1.1";
  }
}
exports.default = SassCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3Mvc2Fzcy5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJzYXNzIiwiU2Fzc0NvbXBpbGVyIiwiY29uc3RydWN0b3IiLCJjb21waWxlck9wdGlvbnMiLCJjb21tZW50cyIsInNvdXJjZU1hcEVtYmVkIiwic291cmNlTWFwQ29udGVudHMiLCJzZWVuRmlsZVBhdGhzIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJzaG91bGRDb21waWxlRmlsZSIsImZpbGVOYW1lIiwiY29tcGlsZXJDb250ZXh0IiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJjb21waWxlIiwiZ2V0U2FzcyIsInRoaXNQYXRoIiwiZGlybmFtZSIsInBhdGhzIiwiT2JqZWN0Iiwia2V5cyIsInB1c2giLCJ1bnNoaWZ0IiwiaW1wb3J0ZXIiLCJidWlsZEltcG9ydGVyQ2FsbGJhY2siLCJvcHRzIiwiYXNzaWduIiwiaW5kZW50ZWRTeW50YXgiLCJtYXRjaCIsInNvdXJjZU1hcFJvb3QiLCJyZXN1bHQiLCJQcm9taXNlIiwicmVzIiwicmVqIiwiciIsInN0YXR1cyIsIkVycm9yIiwiZm9ybWF0dGVkIiwibWVzc2FnZSIsInNvdXJjZSIsInRleHQiLCJjb2RlIiwibWltZVR5cGUiLCJzaG91bGRDb21waWxlRmlsZVN5bmMiLCJkZXBlbmRlbmN5RmlsZW5hbWVzIiwiZXh0bmFtZSIsImRlcGVuZGVuY2llcyIsImRlcGVuZGVuY3lOYW1lIiwiYmFzZW5hbWUiLCJjb21waWxlU3luYyIsInJldCIsInJlcXVpcmUiLCJTYXNzIiwiaW5jbHVkZVBhdGhzIiwic2VsZiIsInJlcXVlc3QiLCJkb25lIiwiZmlsZSIsImltcG9ydFJlcXVlc3QiLCJjdXJyZW50IiwiaW5jbHVkZVBhdGgiLCJyZXNvbHZlIiwidmFyaWF0aW9ucyIsImdldFBhdGhWYXJpYXRpb25zIiwibWFwIiwiZml4V2luZG93c1BhdGgiLCJiaW5kIiwicmVkdWNlIiwiaW1wb3J0ZWRGaWxlUmVkdWNlciIsImNvbnRlbnQiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsIndyaXRlRmlsZSIsInBhdGgiLCJmb3VuZCIsInN0YXQiLCJzdGF0U3luYyIsImlzRmlsZSIsImUiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJzbGljZSIsInBhcnRzIiwic3BsaXQiLCJzZXAiLCJkaXIiLCJqb2luIiwicmV2ZXJzZSIsImdldENvbXBpbGVyVmVyc2lvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLFlBQVksQ0FBQyxXQUFELEVBQWMsV0FBZCxDQUFsQjtBQUNBLElBQUlDLE9BQU8sSUFBWDs7QUFFQTs7O0FBR2UsTUFBTUMsWUFBTixvQ0FBd0M7QUFDckRDLGdCQUFjO0FBQ1o7O0FBRUEsU0FBS0MsZUFBTCxHQUF1QjtBQUNyQkMsZ0JBQVUsSUFEVztBQUVyQkMsc0JBQWdCLElBRks7QUFHckJDLHlCQUFtQjtBQUhFLEtBQXZCOztBQU1BLFNBQUtDLGFBQUwsR0FBcUIsRUFBckI7QUFDRDs7QUFFRCxTQUFPQyxpQkFBUCxHQUEyQjtBQUN6QixXQUFPVCxTQUFQO0FBQ0Q7O0FBRUtVLG1CQUFOLENBQXdCQyxRQUF4QixFQUFrQ0MsZUFBbEMsRUFBbUQ7QUFBQTtBQUNqRCxhQUFPLElBQVA7QUFEaUQ7QUFFbEQ7O0FBRUtDLHlCQUFOLENBQThCQyxVQUE5QixFQUEwQ0MsUUFBMUMsRUFBb0RILGVBQXBELEVBQXFFO0FBQUE7O0FBQUE7QUFDbkUsYUFBTyxNQUFLSSwyQkFBTCxDQUFpQ0YsVUFBakMsRUFBNkNDLFFBQTdDLEVBQXVESCxlQUF2RCxDQUFQO0FBRG1FO0FBRXBFOztBQUVLSyxTQUFOLENBQWNILFVBQWQsRUFBMEJDLFFBQTFCLEVBQW9DSCxlQUFwQyxFQUFxRDtBQUFBOztBQUFBO0FBQ25EWCxhQUFPQSxRQUFRLE9B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O0FBQ0Q7O0FBRUQ7QUFDQSxRQUFJeEIsS0FBSyxDQUFMLE1BQVksR0FBaEIsRUFBcUI7QUFDbkIsWUFBTXlCLFFBQVF6QixLQUFLd0IsS0FBTCxDQUFXLENBQVgsRUFBY0UsS0FBZCxDQUFvQixlQUFLQyxHQUF6QixDQUFkO0FBQ0EsWUFBTUMsTUFBTUgsTUFBTUQsS0FBTixDQUFZLENBQVosRUFBZSxDQUFDLENBQWhCLEVBQW1CSyxJQUFuQixDQUF3QixlQUFLRixHQUE3QixDQUFaO0FBQ0EsWUFBTTVFLFdBQVcwRSxNQUFNSyxPQUFOLEdBQWdCLENBQWhCLENBQWpCO0FBQ0E5QixhQUFPLGVBQUtJLE9BQUwsQ0FBYXdCLEdBQWIsRUFBa0IsTUFBTTdFLFFBQXhCLENBQVA7QUFDRDtBQUNELFdBQU9pRCxJQUFQO0FBQ0Q7O0FBRUQrQix1QkFBcUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0EsV0FBTyxPQUFQO0FBQ0Q7QUF6Tm9EO2tCQUFsQ3pGLFkiLCJmaWxlIjoic2Fzcy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IGZzIGZyb20gJ2ZzJztcbmltcG9ydCB0b3V0U3VpdGUgZnJvbSAndG91dHN1aXRlJztcbmltcG9ydCBkZXRlY3RpdmVTQVNTIGZyb20gJ2RldGVjdGl2ZS1zYXNzJztcbmltcG9ydCBkZXRlY3RpdmVTQ1NTIGZyb20gJ2RldGVjdGl2ZS1zY3NzJztcbmltcG9ydCBzYXNzTG9va3VwIGZyb20gJ3Nhc3MtbG9va3VwJztcbmltcG9ydCB7Q29tcGlsZXJCYXNlfSBmcm9tICcuLi9jb21waWxlci1iYXNlJztcblxuY29uc3QgbWltZVR5cGVzID0gWyd0ZXh0L3Nhc3MnLCAndGV4dC9zY3NzJ107XG5sZXQgc2FzcyA9IG51bGw7XG5cbi8qKlxuICogQGFjY2VzcyBwcml2YXRlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNhc3NDb21waWxlciBleHRlbmRzIENvbXBpbGVyQmFzZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmNvbXBpbGVyT3B0aW9ucyA9IHtcbiAgICAgIGNvbW1lbnRzOiB0cnVlLFxuICAgICAgc291cmNlTWFwRW1iZWQ6IHRydWUsXG4gICAgICBzb3VyY2VNYXBDb250ZW50czogdHJ1ZVxuICAgIH07XG5cbiAgICB0aGlzLnNlZW5GaWxlUGF0aHMgPSB7fTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRJbnB1dE1pbWVUeXBlcygpIHtcbiAgICByZXR1cm4gbWltZVR5cGVzO1xuICB9XG5cbiAgYXN5bmMgc2hvdWxkQ29tcGlsZUZpbGUoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0aGlzLmRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGUoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHNhc3MgPSBzYXNzIHx8IHRoaXMuZ2V0U2FzcygpO1xuXG4gICAgbGV0IHRoaXNQYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgICB0aGlzLnNlZW5GaWxlUGF0aHNbdGhpc1BhdGhdID0gdHJ1ZTtcblxuICAgIGxldCBwYXRocyA9IE9iamVjdC5rZXlzKHRoaXMuc2VlbkZpbGVQYXRocyk7XG5cbiAgICBpZiAodGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpIHtcbiAgICAgIHBhdGhzLnB1c2goLi4udGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpO1xuICAgIH1cblxuICAgIHBhdGhzLnVuc2hpZnQoJy4nKTtcblxuICAgIHNhc3MuaW1wb3J0ZXIodGhpcy5idWlsZEltcG9ydGVyQ2FsbGJhY2socGF0aHMpKTtcblxuICAgIGxldCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jb21waWxlck9wdGlvbnMsIHtcbiAgICAgIGluZGVudGVkU3ludGF4OiBmaWxlUGF0aC5tYXRjaCgvXFwuc2FzcyQvaSksXG4gICAgICBzb3VyY2VNYXBSb290OiBmaWxlUGF0aCxcbiAgICB9KTtcblxuICAgIC8vIG5vdCBhIHZhbGlkIG9wdGlvblxuICAgIGRlbGV0ZSBvcHRzLnBhdGhzO1xuXG4gICAgbGV0IHJlc3VsdCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXMscmVqKSA9PiB7XG4gICAgICBzYXNzLmNvbXBpbGUoc291cmNlQ29kZSwgb3B0cywgKHIpID0+IHtcbiAgICAgICAgaWYgKHIuc3RhdHVzICE9PSAwKSB7XG4gICAgICAgICAgcmVqKG5ldyBFcnJvcihyLmZvcm1hdHRlZCB8fCByLm1lc3NhZ2UpKTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICByZXMocik7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbGV0IHNvdXJjZSA9IHJlc3VsdC50ZXh0O1xuXG4gICAgLy8gTkI6IElmIHlvdSBjb21waWxlIGEgZmlsZSB0aGF0IGlzIHNvbGVseSBpbXBvcnRzLCBpdHNcbiAgICAvLyBhY3R1YWwgY29udGVudCBpcyAnJyB5ZXQgaXQgaXMgYSB2YWxpZCBmaWxlLiAnJyBpcyBub3RcbiAgICAvLyB0cnV0aHksIHNvIHdlJ3JlIGdvaW5nIHRvIHJlcGxhY2UgaXQgd2l0aCBhIHN0cmluZyB0aGF0XG4gICAgLy8gaXMgdHJ1dGh5LlxuICAgIGlmICghc291cmNlKSB7XG4gICAgICBzb3VyY2UgPSAnICc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IHNvdXJjZSxcbiAgICAgIG1pbWVUeXBlOiAndGV4dC9jc3MnXG4gICAgfTtcbiAgfVxuXG4gIHNob3VsZENvbXBpbGVGaWxlU3luYyhmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIGxldCBkZXBlbmRlbmN5RmlsZW5hbWVzID0gcGF0aC5leHRuYW1lKGZpbGVQYXRoKSA9PT0gJy5zYXNzJyA/IGRldGVjdGl2ZVNBU1Moc291cmNlQ29kZSkgOiBkZXRlY3RpdmVTQ1NTKHNvdXJjZUNvZGUpO1xuICAgIGxldCBkZXBlbmRlbmNpZXMgPSBbXTtcblxuICAgIGZvciAobGV0IGRlcGVuZGVuY3lOYW1lIG9mIGRlcGVuZGVuY3lGaWxlbmFtZXMpIHtcbiAgICAgIGRlcGVuZGVuY2llcy5wdXNoKHNhc3NMb29rdXAoZGVwZW5kZW5jeU5hbWUsIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLCBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlcGVuZGVuY2llcztcbiAgfVxuXG4gIGNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBzYXNzID0gc2FzcyB8fCB0aGlzLmdldFNhc3MoKTtcblxuICAgIGxldCB0aGlzUGF0aCA9IHBhdGguZGlybmFtZShmaWxlUGF0aCk7XG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzW3RoaXNQYXRoXSA9IHRydWU7XG5cbiAgICBsZXQgcGF0aHMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZW5GaWxlUGF0aHMpO1xuXG4gICAgaWYgKHRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG4gICAgICBwYXRocy5wdXNoKC4uLnRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKTtcbiAgICB9XG5cbiAgICBwYXRocy51bnNoaWZ0KCcuJyk7XG4gICAgc2Fzcy5pbXBvcnRlcih0aGlzLmJ1aWxkSW1wb3J0ZXJDYWxsYmFjayhwYXRocykpO1xuXG4gICAgbGV0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbXBpbGVyT3B0aW9ucywge1xuICAgICAgaW5kZW50ZWRTeW50YXg6IGZpbGVQYXRoLm1hdGNoKC9cXC5zYXNzJC9pKSxcbiAgICAgIHNvdXJjZU1hcFJvb3Q6IGZpbGVQYXRoLFxuICAgIH0pO1xuXG4gICAgbGV0IHJlc3VsdDtcbiAgICB0b3V0U3VpdGUoKCkgPT4ge1xuICAgICAgc2Fzcy5jb21waWxlKHNvdXJjZUNvZGUsIG9wdHMsIChyKSA9PiB7XG4gICAgICAgIGlmIChyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyLmZvcm1hdHRlZCk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gcjtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgbGV0IHNvdXJjZSA9IHJlc3VsdC50ZXh0O1xuXG4gICAgLy8gTkI6IElmIHlvdSBjb21waWxlIGEgZmlsZSB0aGF0IGlzIHNvbGVseSBpbXBvcnRzLCBpdHNcbiAgICAvLyBhY3R1YWwgY29udGVudCBpcyAnJyB5ZXQgaXQgaXMgYSB2YWxpZCBmaWxlLiAnJyBpcyBub3RcbiAgICAvLyB0cnV0aHksIHNvIHdlJ3JlIGdvaW5nIHRvIHJlcGxhY2UgaXQgd2l0aCBhIHN0cmluZyB0aGF0XG4gICAgLy8gaXMgdHJ1dGh5LlxuICAgIGlmICghc291cmNlKSB7XG4gICAgICBzb3VyY2UgPSAnICc7XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGU6IHNvdXJjZSxcbiAgICAgIG1pbWVUeXBlOiAndGV4dC9jc3MnXG4gICAgfTtcbiAgfVxuXG4gIGdldFNhc3MoKSB7XG4gICAgbGV0IHJldDtcbiAgICB0b3V0U3VpdGUoKCkgPT4gcmV0ID0gcmVxdWlyZSgnc2Fzcy5qcy9kaXN0L3Nhc3Mubm9kZScpLlNhc3MpO1xuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBidWlsZEltcG9ydGVyQ2FsbGJhY2sgKGluY2x1ZGVQYXRocykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiAoZnVuY3Rpb24gKHJlcXVlc3QsIGRvbmUpIHtcbiAgICAgIGxldCBmaWxlO1xuICAgICAgaWYgKHJlcXVlc3QuZmlsZSkge1xuICAgICAgICBkb25lKCk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIHRyZWF0IGFzIGl0XG4gICAgICAgIGNvbnN0IGltcG9ydFJlcXVlc3QgPSByZXF1ZXN0LmN1cnJlbnQ7XG5cbiAgICAgICAgZm9yIChsZXQgaW5jbHVkZVBhdGggb2YgaW5jbHVkZVBhdGhzKSB7XG4gICAgICAgICAgY29uc3QgZmlsZVBhdGggPSBwYXRoLnJlc29sdmUoaW5jbHVkZVBhdGgsIGltcG9ydFJlcXVlc3QpO1xuICAgICAgICAgIGxldCB2YXJpYXRpb25zID0gc2Fzcy5nZXRQYXRoVmFyaWF0aW9ucyhmaWxlUGF0aCk7XG5cbiAgICAgICAgICBmaWxlID0gdmFyaWF0aW9uc1xuICAgICAgICAgICAgLm1hcChzZWxmLmZpeFdpbmRvd3NQYXRoLmJpbmQoc2VsZikpXG4gICAgICAgICAgICAucmVkdWNlKHNlbGYuaW1wb3J0ZWRGaWxlUmVkdWNlci5iaW5kKHNlbGYpLCBudWxsKTtcblxuICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgICAgICAgIHJldHVybiBzYXNzLndyaXRlRmlsZShmaWxlLCBjb250ZW50LCAoKSA9PiB7XG4gICAgICAgICAgICAgIGRvbmUoeyBwYXRoOiBmaWxlIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpbXBvcnRlZEZpbGVSZWR1Y2VyKGZvdW5kLCBwYXRoKSB7XG4gICAgLy8gRmluZCB0aGUgZmlyc3QgdmFyaWF0aW9uIHRoYXQgYWN0dWFsbHkgZXhpc3RzXG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKHBhdGgpO1xuICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiBwYXRoO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgZml4V2luZG93c1BhdGgoZmlsZSkge1xuICAgIC8vIFVuZm9ydHVuYXRlbHksIHRoZXJlJ3MgYSBidWcgaW4gc2Fzcy5qcyB0aGF0IHNlZW1zIHRvIGlnbm9yZSB0aGUgZGlmZmVyZW50XG4gICAgLy8gcGF0aCBzZXBhcmF0b3JzIGFjcm9zcyBwbGF0Zm9ybXNcblxuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgc29tZSBmaWxlcyBoYXZlIGEgbGVhZGluZyBzbGFzaCB0aGF0IHdlIG5lZWQgdG8gZ2V0IHJpZCBvZlxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInICYmIGZpbGVbMF0gPT09ICcvJykge1xuICAgICAgZmlsZSA9IGZpbGUuc2xpY2UoMSk7XG4gICAgfVxuXG4gICAgLy8gU2Fzcy5qcyBnZW5lcmF0ZXMgcGF0aHMgc3VjaCBhcyBgX0M6XFxteVBhdGhcXGZpbGUuc2Fzc2AgaW5zdGVhZCBvZiBgQzpcXG15UGF0aFxcX2ZpbGUuc2Fzc2BcbiAgICBpZiAoZmlsZVswXSA9PT0gJ18nKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGZpbGUuc2xpY2UoMSkuc3BsaXQocGF0aC5zZXApO1xuICAgICAgY29uc3QgZGlyID0gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXJ0cy5yZXZlcnNlKClbMF07XG4gICAgICBmaWxlID0gcGF0aC5yZXNvbHZlKGRpciwgJ18nICsgZmlsZU5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGdldENvbXBpbGVyVmVyc2lvbigpIHtcbiAgICAvLyBOQjogVGhlcmUgaXMgYSBiaXphcnJlIGJ1ZyBpbiB0aGUgbm9kZSBtb2R1bGUgc3lzdGVtIHdoZXJlIHRoaXMgZG9lc24ndFxuICAgIC8vIHdvcmsgYnV0IG9ubHkgaW4gc2F2ZUNvbmZpZ3VyYXRpb24gdGVzdHNcbiAgICAvL3JldHVybiByZXF1aXJlKCdAcGF1bGNiZXR0cy9ub2RlLXNhc3MvcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgICByZXR1cm4gXCI0LjEuMVwiO1xuICB9XG59XG4iXX0=