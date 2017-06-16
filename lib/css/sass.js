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
        // sass.js works in the '/sass/' directory
        let cleanedRequestPath = request.resolved.replace(/^\/sass\//, '');

        // if we are importing from the entry file (stdin) the path is
        // resolved with a leading '/'' -> remove it
        if (request.previous === 'stdin' && cleanedRequestPath.charAt(0) === '/') {
          cleanedRequestPath = cleanedRequestPath.substring(1);
        }

        for (let includePath of includePaths) {
          const filePath = _path2.default.resolve(includePath, cleanedRequestPath);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3Mvc2Fzcy5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJzYXNzIiwiU2Fzc0NvbXBpbGVyIiwiY29uc3RydWN0b3IiLCJjb21waWxlck9wdGlvbnMiLCJjb21tZW50cyIsInNvdXJjZU1hcEVtYmVkIiwic291cmNlTWFwQ29udGVudHMiLCJzZWVuRmlsZVBhdGhzIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJzaG91bGRDb21waWxlRmlsZSIsImZpbGVOYW1lIiwiY29tcGlsZXJDb250ZXh0IiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJjb21waWxlIiwiZ2V0U2FzcyIsInRoaXNQYXRoIiwiZGlybmFtZSIsInBhdGhzIiwiT2JqZWN0Iiwia2V5cyIsInB1c2giLCJ1bnNoaWZ0IiwiaW1wb3J0ZXIiLCJidWlsZEltcG9ydGVyQ2FsbGJhY2siLCJvcHRzIiwiYXNzaWduIiwiaW5kZW50ZWRTeW50YXgiLCJtYXRjaCIsInNvdXJjZU1hcFJvb3QiLCJyZXN1bHQiLCJQcm9taXNlIiwicmVzIiwicmVqIiwiciIsInN0YXR1cyIsIkVycm9yIiwiZm9ybWF0dGVkIiwibWVzc2FnZSIsInNvdXJjZSIsInRleHQiLCJjb2RlIiwibWltZVR5cGUiLCJzaG91bGRDb21waWxlRmlsZVN5bmMiLCJkZXBlbmRlbmN5RmlsZW5hbWVzIiwiZXh0bmFtZSIsImRlcGVuZGVuY2llcyIsImRlcGVuZGVuY3lOYW1lIiwiYmFzZW5hbWUiLCJjb21waWxlU3luYyIsInJldCIsInJlcXVpcmUiLCJTYXNzIiwiaW5jbHVkZVBhdGhzIiwic2VsZiIsInJlcXVlc3QiLCJkb25lIiwiZmlsZSIsImNsZWFuZWRSZXF1ZXN0UGF0aCIsInJlc29sdmVkIiwicmVwbGFjZSIsInByZXZpb3VzIiwiY2hhckF0Iiwic3Vic3RyaW5nIiwiaW5jbHVkZVBhdGgiLCJyZXNvbHZlIiwidmFyaWF0aW9ucyIsImdldFBhdGhWYXJpYXRpb25zIiwibWFwIiwiZml4V2luZG93c1BhdGgiLCJiaW5kIiwicmVkdWNlIiwiaW1wb3J0ZWRGaWxlUmVkdWNlciIsImNvbnRlbnQiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsIndyaXRlRmlsZSIsInBhdGgiLCJmb3VuZCIsInN0YXQiLCJzdGF0U3luYyIsImlzRmlsZSIsImUiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJzbGljZSIsInBhcnRzIiwic3BsaXQiLCJzZXAiLCJkaXIiLCJqb2luIiwicmV2ZXJzZSIsImdldENvbXBpbGVyVmVyc2lvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLE1BQU1BLFlBQVksQ0FBQyxXQUFELEVBQWMsV0FBZCxDQUFsQjtBQUNBLElBQUlDLE9BQU8sSUFBWDs7QUFFQTs7O0FBR2UsTUFBTUMsWUFBTixvQ0FBd0M7QUFDckRDLGdCQUFjO0FBQ1o7O0FBRUEsU0FBS0MsZUFBTCxHQUF1QjtBQUNyQkMsZ0JBQVUsSUFEVztBQUVyQkMsc0JBQWdCLElBRks7QUFHckJDLHlCQUFtQjtBQUhFLEtBQXZCOztBQU1BLFNBQUtDLGFBQUwsR0FBcUIsRUFBckI7QUFDRDs7QUFFRCxTQUFPQyxpQkFBUCxHQUEyQjtBQUN6QixXQUFPVCxTQUFQO0FBQ0Q7O0FBRUtVLG1CQUFOLENBQXdCQyxRQUF4QixFQUFrQ0MsZUFBbEMsRUFBbUQ7QUFBQTtBQUNqRCxhQUFPLElBQVA7QUFEaUQ7QUFFbEQ7O0FBRUtDLHlCQUFOLENBQThCQyxVQUE5QixFQUEwQ0MsUUFBMUMsRUFBb0RILGVBQXBELEVBQXFFO0FBQUE7O0FBQUE7QUFDbkUsYUFBTyxNQUFLSSwyQkFBTCxDQUFpQ0YsVUFBakMsRUFBNkNDLFFBQTdDLEVBQXVESCxlQUF2RCxDQUFQO0FBRG1FO0FBRXBFOztBQUVLSyxTQUFOLENBQWNILFVBQWQsRUFBMEJDLFFBQTFCLEVB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LE1BQUwsRUFBTCxFQUFvQixPQUFPLElBQVA7QUFDcEIsYUFBT0osSUFBUDtBQUNELEtBSkQsQ0FJRSxPQUFNSyxDQUFOLEVBQVM7QUFDVCxhQUFPLElBQVA7QUFDRDtBQUNGOztBQUVEYixpQkFBZVosSUFBZixFQUFxQjtBQUNuQjtBQUNBOztBQUVBO0FBQ0EsUUFBSTBCLFFBQVFDLFFBQVIsS0FBcUIsT0FBckIsSUFBZ0MzQixLQUFLLENBQUwsTUFBWSxHQUFoRCxFQUFxRDtBQUNuREEsYUFBT0EsS0FBSzRCLEtBQUwsQ0FBVyxDQUFYLENBQVA7QUFDRDs7QUFFRDtBQUNBLFFBQUk1QixLQUFLLENBQUwsTUFBWSxHQUFoQixFQUFxQjtBQUNuQixZQUFNNkIsUUFBUTdCLEtBQUs0QixLQUFMLENBQVcsQ0FBWCxFQUFjRSxLQUFkLENBQW9CLGVBQUtDLEdBQXpCLENBQWQ7QUFDQSxZQUFNQyxNQUFNSCxNQUFNRCxLQUFOLENBQVksQ0FBWixFQUFlLENBQUMsQ0FBaEIsRUFBbUJLLElBQW5CLENBQXdCLGVBQUtGLEdBQTdCLENBQVo7QUFDQSxZQUFNaEYsV0FBVzhFLE1BQU1LLE9BQU4sR0FBZ0IsQ0FBaEIsQ0FBakI7QUFDQWxDLGFBQU8sZUFBS1EsT0FBTCxDQUFhd0IsR0FBYixFQUFrQixNQUFNakYsUUFBeEIsQ0FBUDtBQUNEO0FBQ0QsV0FBT2lELElBQVA7QUFDRDs7QUFFRG1DLHVCQUFxQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQSxXQUFPLE9BQVA7QUFDRDtBQS9Ob0Q7a0JBQWxDN0YsWSIsImZpbGUiOiJzYXNzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHRvdXRTdWl0ZSBmcm9tICd0b3V0c3VpdGUnO1xuaW1wb3J0IGRldGVjdGl2ZVNBU1MgZnJvbSAnZGV0ZWN0aXZlLXNhc3MnO1xuaW1wb3J0IGRldGVjdGl2ZVNDU1MgZnJvbSAnZGV0ZWN0aXZlLXNjc3MnO1xuaW1wb3J0IHNhc3NMb29rdXAgZnJvbSAnc2Fzcy1sb29rdXAnO1xuaW1wb3J0IHtDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuXG5jb25zdCBtaW1lVHlwZXMgPSBbJ3RleHQvc2FzcycsICd0ZXh0L3Njc3MnXTtcbmxldCBzYXNzID0gbnVsbDtcblxuLyoqXG4gKiBAYWNjZXNzIHByaXZhdGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2Fzc0NvbXBpbGVyIGV4dGVuZHMgQ29tcGlsZXJCYXNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY29tcGlsZXJPcHRpb25zID0ge1xuICAgICAgY29tbWVudHM6IHRydWUsXG4gICAgICBzb3VyY2VNYXBFbWJlZDogdHJ1ZSxcbiAgICAgIHNvdXJjZU1hcENvbnRlbnRzOiB0cnVlXG4gICAgfTtcblxuICAgIHRoaXMuc2VlbkZpbGVQYXRocyA9IHt9O1xuICB9XG5cbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHJldHVybiBtaW1lVHlwZXM7XG4gIH1cblxuICBhc3luYyBzaG91bGRDb21waWxlRmlsZShmaWxlTmFtZSwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBhc3luYyBkZXRlcm1pbmVEZXBlbmRlbnRGaWxlcyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpO1xuICB9XG5cbiAgYXN5bmMgY29tcGlsZShzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgc2FzcyA9IHNhc3MgfHwgdGhpcy5nZXRTYXNzKCk7XG5cbiAgICBsZXQgdGhpc1BhdGggPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIHRoaXMuc2VlbkZpbGVQYXRoc1t0aGlzUGF0aF0gPSB0cnVlO1xuXG4gICAgbGV0IHBhdGhzID0gT2JqZWN0LmtleXModGhpcy5zZWVuRmlsZVBhdGhzKTtcblxuICAgIGlmICh0aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuICAgICAgcGF0aHMucHVzaCguLi50aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocyk7XG4gICAgfVxuXG4gICAgcGF0aHMudW5zaGlmdCgnLicpO1xuXG4gICAgc2Fzcy5pbXBvcnRlcih0aGlzLmJ1aWxkSW1wb3J0ZXJDYWxsYmFjayhwYXRocykpO1xuXG4gICAgbGV0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbXBpbGVyT3B0aW9ucywge1xuICAgICAgaW5kZW50ZWRTeW50YXg6IGZpbGVQYXRoLm1hdGNoKC9cXC5zYXNzJC9pKSxcbiAgICAgIHNvdXJjZU1hcFJvb3Q6IGZpbGVQYXRoLFxuICAgIH0pO1xuXG4gICAgLy8gbm90IGEgdmFsaWQgb3B0aW9uXG4gICAgZGVsZXRlIG9wdHMucGF0aHM7XG5cbiAgICBsZXQgcmVzdWx0ID0gYXdhaXQgbmV3IFByb21pc2UoKHJlcyxyZWopID0+IHtcbiAgICAgIHNhc3MuY29tcGlsZShzb3VyY2VDb2RlLCBvcHRzLCAocikgPT4ge1xuICAgICAgICBpZiAoci5zdGF0dXMgIT09IDApIHtcbiAgICAgICAgICByZWoobmV3IEVycm9yKHIuZm9ybWF0dGVkIHx8IHIubWVzc2FnZSkpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJlcyhyKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsZXQgc291cmNlID0gcmVzdWx0LnRleHQ7XG5cbiAgICAvLyBOQjogSWYgeW91IGNvbXBpbGUgYSBmaWxlIHRoYXQgaXMgc29sZWx5IGltcG9ydHMsIGl0c1xuICAgIC8vIGFjdHVhbCBjb250ZW50IGlzICcnIHlldCBpdCBpcyBhIHZhbGlkIGZpbGUuICcnIGlzIG5vdFxuICAgIC8vIHRydXRoeSwgc28gd2UncmUgZ29pbmcgdG8gcmVwbGFjZSBpdCB3aXRoIGEgc3RyaW5nIHRoYXRcbiAgICAvLyBpcyB0cnV0aHkuXG4gICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgIHNvdXJjZSA9ICcgJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogc291cmNlLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgbGV0IGRlcGVuZGVuY3lGaWxlbmFtZXMgPSBwYXRoLmV4dG5hbWUoZmlsZVBhdGgpID09PSAnLnNhc3MnID8gZGV0ZWN0aXZlU0FTUyhzb3VyY2VDb2RlKSA6IGRldGVjdGl2ZVNDU1Moc291cmNlQ29kZSk7XG4gICAgbGV0IGRlcGVuZGVuY2llcyA9IFtdO1xuXG4gICAgZm9yIChsZXQgZGVwZW5kZW5jeU5hbWUgb2YgZGVwZW5kZW5jeUZpbGVuYW1lcykge1xuICAgICAgZGVwZW5kZW5jaWVzLnB1c2goc2Fzc0xvb2t1cChkZXBlbmRlbmN5TmFtZSwgcGF0aC5iYXNlbmFtZShmaWxlUGF0aCksIHBhdGguZGlybmFtZShmaWxlUGF0aCkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZGVwZW5kZW5jaWVzO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHNhc3MgPSBzYXNzIHx8IHRoaXMuZ2V0U2FzcygpO1xuXG4gICAgbGV0IHRoaXNQYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVQYXRoKTtcbiAgICB0aGlzLnNlZW5GaWxlUGF0aHNbdGhpc1BhdGhdID0gdHJ1ZTtcblxuICAgIGxldCBwYXRocyA9IE9iamVjdC5rZXlzKHRoaXMuc2VlbkZpbGVQYXRocyk7XG5cbiAgICBpZiAodGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpIHtcbiAgICAgIHBhdGhzLnB1c2goLi4udGhpcy5jb21waWxlck9wdGlvbnMucGF0aHMpO1xuICAgIH1cblxuICAgIHBhdGhzLnVuc2hpZnQoJy4nKTtcbiAgICBzYXNzLmltcG9ydGVyKHRoaXMuYnVpbGRJbXBvcnRlckNhbGxiYWNrKHBhdGhzKSk7XG5cbiAgICBsZXQgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29tcGlsZXJPcHRpb25zLCB7XG4gICAgICBpbmRlbnRlZFN5bnRheDogZmlsZVBhdGgubWF0Y2goL1xcLnNhc3MkL2kpLFxuICAgICAgc291cmNlTWFwUm9vdDogZmlsZVBhdGgsXG4gICAgfSk7XG5cbiAgICBsZXQgcmVzdWx0O1xuICAgIHRvdXRTdWl0ZSgoKSA9PiB7XG4gICAgICBzYXNzLmNvbXBpbGUoc291cmNlQ29kZSwgb3B0cywgKHIpID0+IHtcbiAgICAgICAgaWYgKHIuc3RhdHVzICE9PSAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKHIuZm9ybWF0dGVkKTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQgPSByO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBsZXQgc291cmNlID0gcmVzdWx0LnRleHQ7XG5cbiAgICAvLyBOQjogSWYgeW91IGNvbXBpbGUgYSBmaWxlIHRoYXQgaXMgc29sZWx5IGltcG9ydHMsIGl0c1xuICAgIC8vIGFjdHVhbCBjb250ZW50IGlzICcnIHlldCBpdCBpcyBhIHZhbGlkIGZpbGUuICcnIGlzIG5vdFxuICAgIC8vIHRydXRoeSwgc28gd2UncmUgZ29pbmcgdG8gcmVwbGFjZSBpdCB3aXRoIGEgc3RyaW5nIHRoYXRcbiAgICAvLyBpcyB0cnV0aHkuXG4gICAgaWYgKCFzb3VyY2UpIHtcbiAgICAgIHNvdXJjZSA9ICcgJztcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogc291cmNlLFxuICAgICAgbWltZVR5cGU6ICd0ZXh0L2NzcydcbiAgICB9O1xuICB9XG5cbiAgZ2V0U2FzcygpIHtcbiAgICBsZXQgcmV0O1xuICAgIHRvdXRTdWl0ZSgoKSA9PiByZXQgPSByZXF1aXJlKCdzYXNzLmpzL2Rpc3Qvc2Fzcy5ub2RlJykuU2Fzcyk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGJ1aWxkSW1wb3J0ZXJDYWxsYmFjayAoaW5jbHVkZVBhdGhzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIChmdW5jdGlvbiAocmVxdWVzdCwgZG9uZSkge1xuICAgICAgbGV0IGZpbGU7XG4gICAgICBpZiAocmVxdWVzdC5maWxlKSB7XG4gICAgICAgIGRvbmUoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gc2Fzcy5qcyB3b3JrcyBpbiB0aGUgJy9zYXNzLycgZGlyZWN0b3J5XG4gICAgICAgIGxldCBjbGVhbmVkUmVxdWVzdFBhdGggPSByZXF1ZXN0LnJlc29sdmVkLnJlcGxhY2UoL15cXC9zYXNzXFwvLywgJycpO1xuXG4gICAgICAgIC8vIGlmIHdlIGFyZSBpbXBvcnRpbmcgZnJvbSB0aGUgZW50cnkgZmlsZSAoc3RkaW4pIHRoZSBwYXRoIGlzXG4gICAgICAgIC8vIHJlc29sdmVkIHdpdGggYSBsZWFkaW5nICcvJycgLT4gcmVtb3ZlIGl0XG4gICAgICAgIGlmIChyZXF1ZXN0LnByZXZpb3VzID09PSAnc3RkaW4nICYmIGNsZWFuZWRSZXF1ZXN0UGF0aC5jaGFyQXQoMCkgPT09ICcvJykge1xuICAgICAgICAgIGNsZWFuZWRSZXF1ZXN0UGF0aCA9IGNsZWFuZWRSZXF1ZXN0UGF0aC5zdWJzdHJpbmcoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGxldCBpbmNsdWRlUGF0aCBvZiBpbmNsdWRlUGF0aHMpIHtcbiAgICAgICAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShpbmNsdWRlUGF0aCwgY2xlYW5lZFJlcXVlc3RQYXRoKTtcbiAgICAgICAgICBsZXQgdmFyaWF0aW9ucyA9IHNhc3MuZ2V0UGF0aFZhcmlhdGlvbnMoZmlsZVBhdGgpO1xuXG4gICAgICAgICAgZmlsZSA9IHZhcmlhdGlvbnNcbiAgICAgICAgICAgIC5tYXAoc2VsZi5maXhXaW5kb3dzUGF0aC5iaW5kKHNlbGYpKVxuICAgICAgICAgICAgLnJlZHVjZShzZWxmLmltcG9ydGVkRmlsZVJlZHVjZXIuYmluZChzZWxmKSwgbnVsbCk7XG5cbiAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICAgICAgICByZXR1cm4gc2Fzcy53cml0ZUZpbGUoZmlsZSwgY29udGVudCwgKCkgPT4ge1xuICAgICAgICAgICAgICBkb25lKHsgcGF0aDogZmlsZSB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaW1wb3J0ZWRGaWxlUmVkdWNlcihmb3VuZCwgcGF0aCkge1xuICAgIC8vIEZpbmQgdGhlIGZpcnN0IHZhcmlhdGlvbiB0aGF0IGFjdHVhbGx5IGV4aXN0c1xuICAgIGlmIChmb3VuZCkgcmV0dXJuIGZvdW5kO1xuXG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXQgPSBmcy5zdGF0U3luYyhwYXRoKTtcbiAgICAgIGlmICghc3RhdC5pc0ZpbGUoKSkgcmV0dXJuIG51bGw7XG4gICAgICByZXR1cm4gcGF0aDtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGZpeFdpbmRvd3NQYXRoKGZpbGUpIHtcbiAgICAvLyBVbmZvcnR1bmF0ZWx5LCB0aGVyZSdzIGEgYnVnIGluIHNhc3MuanMgdGhhdCBzZWVtcyB0byBpZ25vcmUgdGhlIGRpZmZlcmVudFxuICAgIC8vIHBhdGggc2VwYXJhdG9ycyBhY3Jvc3MgcGxhdGZvcm1zXG5cbiAgICAvLyBGb3Igc29tZSByZWFzb24sIHNvbWUgZmlsZXMgaGF2ZSBhIGxlYWRpbmcgc2xhc2ggdGhhdCB3ZSBuZWVkIHRvIGdldCByaWQgb2ZcbiAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJyAmJiBmaWxlWzBdID09PSAnLycpIHtcbiAgICAgIGZpbGUgPSBmaWxlLnNsaWNlKDEpO1xuICAgIH1cblxuICAgIC8vIFNhc3MuanMgZ2VuZXJhdGVzIHBhdGhzIHN1Y2ggYXMgYF9DOlxcbXlQYXRoXFxmaWxlLnNhc3NgIGluc3RlYWQgb2YgYEM6XFxteVBhdGhcXF9maWxlLnNhc3NgXG4gICAgaWYgKGZpbGVbMF0gPT09ICdfJykge1xuICAgICAgY29uc3QgcGFydHMgPSBmaWxlLnNsaWNlKDEpLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IGRpciA9IHBhcnRzLnNsaWNlKDAsIC0xKS5qb2luKHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gcGFydHMucmV2ZXJzZSgpWzBdO1xuICAgICAgZmlsZSA9IHBhdGgucmVzb2x2ZShkaXIsICdfJyArIGZpbGVOYW1lKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbGU7XG4gIH1cblxuICBnZXRDb21waWxlclZlcnNpb24oKSB7XG4gICAgLy8gTkI6IFRoZXJlIGlzIGEgYml6YXJyZSBidWcgaW4gdGhlIG5vZGUgbW9kdWxlIHN5c3RlbSB3aGVyZSB0aGlzIGRvZXNuJ3RcbiAgICAvLyB3b3JrIGJ1dCBvbmx5IGluIHNhdmVDb25maWd1cmF0aW9uIHRlc3RzXG4gICAgLy9yZXR1cm4gcmVxdWlyZSgnQHBhdWxjYmV0dHMvbm9kZS1zYXNzL3BhY2thZ2UuanNvbicpLnZlcnNpb247XG4gICAgcmV0dXJuIFwiNC4xLjFcIjtcbiAgfVxufVxuIl19