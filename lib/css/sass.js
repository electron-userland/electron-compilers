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
        const filePathGenerator = getFilepathsForVariation(includePaths, request);
        for (let filePath of filePathGenerator) {
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
function* getFilepathsForVariation(includePaths, request) {
  const resolved = request.resolved.replace(/^\/sass\//, '');
  yield resolved;
  const current = request.current;
  for (let includePath of includePaths) {
    yield _path2.default.resolve(includePath, current);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jc3Mvc2Fzcy5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJzYXNzIiwiU2Fzc0NvbXBpbGVyIiwiY29uc3RydWN0b3IiLCJjb21waWxlck9wdGlvbnMiLCJjb21tZW50cyIsInNvdXJjZU1hcEVtYmVkIiwic291cmNlTWFwQ29udGVudHMiLCJzZWVuRmlsZVBhdGhzIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJzaG91bGRDb21waWxlRmlsZSIsImZpbGVOYW1lIiwiY29tcGlsZXJDb250ZXh0IiwiZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMiLCJzb3VyY2VDb2RlIiwiZmlsZVBhdGgiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJjb21waWxlIiwiZ2V0U2FzcyIsInRoaXNQYXRoIiwiZGlybmFtZSIsInBhdGhzIiwiT2JqZWN0Iiwia2V5cyIsInB1c2giLCJ1bnNoaWZ0IiwiaW1wb3J0ZXIiLCJidWlsZEltcG9ydGVyQ2FsbGJhY2siLCJvcHRzIiwiYXNzaWduIiwiaW5kZW50ZWRTeW50YXgiLCJtYXRjaCIsInNvdXJjZU1hcFJvb3QiLCJyZXN1bHQiLCJQcm9taXNlIiwicmVzIiwicmVqIiwiciIsInN0YXR1cyIsIkVycm9yIiwiZm9ybWF0dGVkIiwibWVzc2FnZSIsInNvdXJjZSIsInRleHQiLCJjb2RlIiwibWltZVR5cGUiLCJzaG91bGRDb21waWxlRmlsZVN5bmMiLCJkZXBlbmRlbmN5RmlsZW5hbWVzIiwiZXh0bmFtZSIsImRlcGVuZGVuY2llcyIsImRlcGVuZGVuY3lOYW1lIiwiYmFzZW5hbWUiLCJjb21waWxlU3luYyIsInJldCIsInJlcXVpcmUiLCJTYXNzIiwiaW5jbHVkZVBhdGhzIiwic2VsZiIsInJlcXVlc3QiLCJkb25lIiwiZmlsZSIsImZpbGVQYXRoR2VuZXJhdG9yIiwiZ2V0RmlsZXBhdGhzRm9yVmFyaWF0aW9uIiwidmFyaWF0aW9ucyIsImdldFBhdGhWYXJpYXRpb25zIiwibWFwIiwiZml4V2luZG93c1BhdGgiLCJiaW5kIiwicmVkdWNlIiwiaW1wb3J0ZWRGaWxlUmVkdWNlciIsImNvbnRlbnQiLCJyZWFkRmlsZVN5bmMiLCJlbmNvZGluZyIsIndyaXRlRmlsZSIsInBhdGgiLCJmb3VuZCIsInN0YXQiLCJzdGF0U3luYyIsImlzRmlsZSIsImUiLCJwcm9jZXNzIiwicGxhdGZvcm0iLCJzbGljZSIsInBhcnRzIiwic3BsaXQiLCJzZXAiLCJkaXIiLCJqb2luIiwicmV2ZXJzZSIsInJlc29sdmUiLCJnZXRDb21waWxlclZlcnNpb24iLCJyZXNvbHZlZCIsInJlcGxhY2UiLCJjdXJyZW50IiwiaW5jbHVkZVBhdGgiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxNQUFNQSxZQUFZLENBQUMsV0FBRCxFQUFjLFdBQWQsQ0FBbEI7QUFDQSxJQUFJQyxPQUFPLElBQVg7O0FBRUE7OztBQUdlLE1BQU1DLFlBQU4sb0NBQXdDO0FBQ3JEQyxnQkFBYztBQUNaOztBQUVBLFNBQUtDLGVBQUwsR0FBdUI7QUFDckJDLGdCQUFVLElBRFc7QUFFckJDLHNCQUFnQixJQUZLO0FBR3JCQyx5QkFBbUI7QUFIRSxLQUF2Qjs7QUFNQSxTQUFLQyxhQUFMLEdBQXFCLEVBQXJCO0FBQ0Q7O0FBRUQsU0FBT0MsaUJBQVAsR0FBMkI7QUFDekIsV0FBT1QsU0FBUDtBQUNEOztBQUVLVSxtQkFBTixDQUF3QkMsUUFBeEIsRUFBa0NDLGVBQWxDLEVBQW1EO0FBQUE7QUFDakQsYUFBTyxJQUFQO0FBRGlEO0FBRWxEOztBQUVLQyx5QkFBTixDQUE4QkMsVUFBOUIsRUFBMENDLFFBQTFDLEVBQW9ESCxlQUFwRCxFQUFxRTtBQUFBOztBQUFBO0FBQ25FLGFBQU8sTUFBS0ksMkJBQUwsQ0FBaUNGLFVBQWpDLEVBQTZDQyxRQUE3QyxFQUF1REgsZUFBdkQsQ0FBUDtBQURtRTtBQUVwRTs7QUFFS0ssU0FBTixDQUFjSCxVQUFkLEVBQTBCQyxRQUEx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QUFYLENBQVA7QUFDRDs7QUFFRDtBQUNBLFFBQUl0QixLQUFLLENBQUwsTUFBWSxHQUFoQixFQUFxQjtBQUNuQixZQUFNdUIsUUFBUXZCLEtBQUtzQixLQUFMLENBQVcsQ0FBWCxFQUFjRSxLQUFkLENBQW9CLGVBQUtDLEdBQXpCLENBQWQ7QUFDQSxZQUFNQyxNQUFNSCxNQUFNRCxLQUFOLENBQVksQ0FBWixFQUFlLENBQUMsQ0FBaEIsRUFBbUJLLElBQW5CLENBQXdCLGVBQUtGLEdBQTdCLENBQVo7QUFDQSxZQUFNMUUsV0FBV3dFLE1BQU1LLE9BQU4sR0FBZ0IsQ0FBaEIsQ0FBakI7QUFDQTVCLGFBQU8sZUFBSzZCLE9BQUwsQ0FBYUgsR0FBYixFQUFrQixNQUFNM0UsUUFBeEIsQ0FBUDtBQUNEO0FBQ0QsV0FBT2lELElBQVA7QUFDRDs7QUFFRDhCLHVCQUFxQjtBQUNuQjtBQUNBO0FBQ0E7QUFDQSxXQUFPLE9BQVA7QUFDRDtBQXROb0Q7O2tCQUFsQ3hGLFk7QUF5TnJCLFVBQVU0RCx3QkFBVixDQUFtQ04sWUFBbkMsRUFBaURFLE9BQWpELEVBQTBEO0FBQ3hELFFBQU1pQyxXQUFXakMsUUFBUWlDLFFBQVIsQ0FBaUJDLE9BQWpCLENBQXlCLFdBQXpCLEVBQXNDLEVBQXRDLENBQWpCO0FBQ0EsUUFBTUQsUUFBTjtBQUNBLFFBQU1FLFVBQVVuQyxRQUFRbUMsT0FBeEI7QUFDQSxPQUFLLElBQUlDLFdBQVQsSUFBd0J0QyxZQUF4QixFQUFzQztBQUNwQyxVQUFNLGVBQUtpQyxPQUFMLENBQWFLLFdBQWIsRUFBMEJELE9BQTFCLENBQU47QUFDRDtBQUNGIiwiZmlsZSI6InNhc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgdG91dFN1aXRlIGZyb20gJ3RvdXRzdWl0ZSc7XG5pbXBvcnQgZGV0ZWN0aXZlU0FTUyBmcm9tICdkZXRlY3RpdmUtc2Fzcyc7XG5pbXBvcnQgZGV0ZWN0aXZlU0NTUyBmcm9tICdkZXRlY3RpdmUtc2Nzcyc7XG5pbXBvcnQgc2Fzc0xvb2t1cCBmcm9tICdzYXNzLWxvb2t1cCc7XG5pbXBvcnQge0NvbXBpbGVyQmFzZX0gZnJvbSAnLi4vY29tcGlsZXItYmFzZSc7XG5cbmNvbnN0IG1pbWVUeXBlcyA9IFsndGV4dC9zYXNzJywgJ3RleHQvc2NzcyddO1xubGV0IHNhc3MgPSBudWxsO1xuXG4vKipcbiAqIEBhY2Nlc3MgcHJpdmF0ZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTYXNzQ29tcGlsZXIgZXh0ZW5kcyBDb21waWxlckJhc2Uge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5jb21waWxlck9wdGlvbnMgPSB7XG4gICAgICBjb21tZW50czogdHJ1ZSxcbiAgICAgIHNvdXJjZU1hcEVtYmVkOiB0cnVlLFxuICAgICAgc291cmNlTWFwQ29udGVudHM6IHRydWVcbiAgICB9O1xuXG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzID0ge307XG4gIH1cblxuICBzdGF0aWMgZ2V0SW5wdXRNaW1lVHlwZXMoKSB7XG4gICAgcmV0dXJuIG1pbWVUeXBlcztcbiAgfVxuXG4gIGFzeW5jIHNob3VsZENvbXBpbGVGaWxlKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGRldGVybWluZURlcGVuZGVudEZpbGVzKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCk7XG4gIH1cblxuICBhc3luYyBjb21waWxlKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBzYXNzID0gc2FzcyB8fCB0aGlzLmdldFNhc3MoKTtcblxuICAgIGxldCB0aGlzUGF0aCA9IHBhdGguZGlybmFtZShmaWxlUGF0aCk7XG4gICAgdGhpcy5zZWVuRmlsZVBhdGhzW3RoaXNQYXRoXSA9IHRydWU7XG5cbiAgICBsZXQgcGF0aHMgPSBPYmplY3Qua2V5cyh0aGlzLnNlZW5GaWxlUGF0aHMpO1xuXG4gICAgaWYgKHRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKSB7XG4gICAgICBwYXRocy5wdXNoKC4uLnRoaXMuY29tcGlsZXJPcHRpb25zLnBhdGhzKTtcbiAgICB9XG5cbiAgICBwYXRocy51bnNoaWZ0KCcuJyk7XG5cbiAgICBzYXNzLmltcG9ydGVyKHRoaXMuYnVpbGRJbXBvcnRlckNhbGxiYWNrKHBhdGhzKSk7XG5cbiAgICBsZXQgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMuY29tcGlsZXJPcHRpb25zLCB7XG4gICAgICBpbmRlbnRlZFN5bnRheDogZmlsZVBhdGgubWF0Y2goL1xcLnNhc3MkL2kpLFxuICAgICAgc291cmNlTWFwUm9vdDogZmlsZVBhdGgsXG4gICAgfSk7XG5cbiAgICAvLyBub3QgYSB2YWxpZCBvcHRpb25cbiAgICBkZWxldGUgb3B0cy5wYXRocztcblxuICAgIGxldCByZXN1bHQgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzLHJlaikgPT4ge1xuICAgICAgc2Fzcy5jb21waWxlKHNvdXJjZUNvZGUsIG9wdHMsIChyKSA9PiB7XG4gICAgICAgIGlmIChyLnN0YXR1cyAhPT0gMCkge1xuICAgICAgICAgIHJlaihuZXcgRXJyb3Ioci5mb3JtYXR0ZWQgfHwgci5tZXNzYWdlKSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzKHIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGxldCBzb3VyY2UgPSByZXN1bHQudGV4dDtcblxuICAgIC8vIE5COiBJZiB5b3UgY29tcGlsZSBhIGZpbGUgdGhhdCBpcyBzb2xlbHkgaW1wb3J0cywgaXRzXG4gICAgLy8gYWN0dWFsIGNvbnRlbnQgaXMgJycgeWV0IGl0IGlzIGEgdmFsaWQgZmlsZS4gJycgaXMgbm90XG4gICAgLy8gdHJ1dGh5LCBzbyB3ZSdyZSBnb2luZyB0byByZXBsYWNlIGl0IHdpdGggYSBzdHJpbmcgdGhhdFxuICAgIC8vIGlzIHRydXRoeS5cbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgc291cmNlID0gJyAnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBzb3VyY2UsXG4gICAgICBtaW1lVHlwZTogJ3RleHQvY3NzJ1xuICAgIH07XG4gIH1cblxuICBzaG91bGRDb21waWxlRmlsZVN5bmMoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBsZXQgZGVwZW5kZW5jeUZpbGVuYW1lcyA9IHBhdGguZXh0bmFtZShmaWxlUGF0aCkgPT09ICcuc2FzcycgPyBkZXRlY3RpdmVTQVNTKHNvdXJjZUNvZGUpIDogZGV0ZWN0aXZlU0NTUyhzb3VyY2VDb2RlKTtcbiAgICBsZXQgZGVwZW5kZW5jaWVzID0gW107XG5cbiAgICBmb3IgKGxldCBkZXBlbmRlbmN5TmFtZSBvZiBkZXBlbmRlbmN5RmlsZW5hbWVzKSB7XG4gICAgICBkZXBlbmRlbmNpZXMucHVzaChzYXNzTG9va3VwKGRlcGVuZGVuY3lOYW1lLCBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSwgcGF0aC5kaXJuYW1lKGZpbGVQYXRoKSkpO1xuICAgIH1cblxuICAgIHJldHVybiBkZXBlbmRlbmNpZXM7XG4gIH1cblxuICBjb21waWxlU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgc2FzcyA9IHNhc3MgfHwgdGhpcy5nZXRTYXNzKCk7XG5cbiAgICBsZXQgdGhpc1BhdGggPSBwYXRoLmRpcm5hbWUoZmlsZVBhdGgpO1xuICAgIHRoaXMuc2VlbkZpbGVQYXRoc1t0aGlzUGF0aF0gPSB0cnVlO1xuXG4gICAgbGV0IHBhdGhzID0gT2JqZWN0LmtleXModGhpcy5zZWVuRmlsZVBhdGhzKTtcblxuICAgIGlmICh0aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocykge1xuICAgICAgcGF0aHMucHVzaCguLi50aGlzLmNvbXBpbGVyT3B0aW9ucy5wYXRocyk7XG4gICAgfVxuXG4gICAgcGF0aHMudW5zaGlmdCgnLicpO1xuICAgIHNhc3MuaW1wb3J0ZXIodGhpcy5idWlsZEltcG9ydGVyQ2FsbGJhY2socGF0aHMpKTtcblxuICAgIGxldCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jb21waWxlck9wdGlvbnMsIHtcbiAgICAgIGluZGVudGVkU3ludGF4OiBmaWxlUGF0aC5tYXRjaCgvXFwuc2FzcyQvaSksXG4gICAgICBzb3VyY2VNYXBSb290OiBmaWxlUGF0aCxcbiAgICB9KTtcblxuICAgIGxldCByZXN1bHQ7XG4gICAgdG91dFN1aXRlKCgpID0+IHtcbiAgICAgIHNhc3MuY29tcGlsZShzb3VyY2VDb2RlLCBvcHRzLCAocikgPT4ge1xuICAgICAgICBpZiAoci5zdGF0dXMgIT09IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3Ioci5mb3JtYXR0ZWQpO1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHI7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGxldCBzb3VyY2UgPSByZXN1bHQudGV4dDtcblxuICAgIC8vIE5COiBJZiB5b3UgY29tcGlsZSBhIGZpbGUgdGhhdCBpcyBzb2xlbHkgaW1wb3J0cywgaXRzXG4gICAgLy8gYWN0dWFsIGNvbnRlbnQgaXMgJycgeWV0IGl0IGlzIGEgdmFsaWQgZmlsZS4gJycgaXMgbm90XG4gICAgLy8gdHJ1dGh5LCBzbyB3ZSdyZSBnb2luZyB0byByZXBsYWNlIGl0IHdpdGggYSBzdHJpbmcgdGhhdFxuICAgIC8vIGlzIHRydXRoeS5cbiAgICBpZiAoIXNvdXJjZSkge1xuICAgICAgc291cmNlID0gJyAnO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiBzb3VyY2UsXG4gICAgICBtaW1lVHlwZTogJ3RleHQvY3NzJ1xuICAgIH07XG4gIH1cblxuICBnZXRTYXNzKCkge1xuICAgIGxldCByZXQ7XG4gICAgdG91dFN1aXRlKCgpID0+IHJldCA9IHJlcXVpcmUoJ3Nhc3MuanMvZGlzdC9zYXNzLm5vZGUnKS5TYXNzKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgYnVpbGRJbXBvcnRlckNhbGxiYWNrIChpbmNsdWRlUGF0aHMpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChyZXF1ZXN0LCBkb25lKSB7XG4gICAgICBsZXQgZmlsZTtcbiAgICAgIGlmIChyZXF1ZXN0LmZpbGUpIHtcbiAgICAgICAgZG9uZSgpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBmaWxlUGF0aEdlbmVyYXRvciA9IGdldEZpbGVwYXRoc0ZvclZhcmlhdGlvbihpbmNsdWRlUGF0aHMsIHJlcXVlc3QpO1xuICAgICAgICBmb3IgKGxldCBmaWxlUGF0aCBvZiBmaWxlUGF0aEdlbmVyYXRvcikge1xuICAgICAgICAgIGxldCB2YXJpYXRpb25zID0gc2Fzcy5nZXRQYXRoVmFyaWF0aW9ucyhmaWxlUGF0aCk7XG5cbiAgICAgICAgICBmaWxlID0gdmFyaWF0aW9uc1xuICAgICAgICAgICAgLm1hcChzZWxmLmZpeFdpbmRvd3NQYXRoLmJpbmQoc2VsZikpXG4gICAgICAgICAgICAucmVkdWNlKHNlbGYuaW1wb3J0ZWRGaWxlUmVkdWNlci5iaW5kKHNlbGYpLCBudWxsKTtcblxuICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICAgICAgICAgIHJldHVybiBzYXNzLndyaXRlRmlsZShmaWxlLCBjb250ZW50LCAoKSA9PiB7XG4gICAgICAgICAgICAgIGRvbmUoeyBwYXRoOiBmaWxlIH0pO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICBkb25lKCk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBpbXBvcnRlZEZpbGVSZWR1Y2VyKGZvdW5kLCBwYXRoKSB7XG4gICAgLy8gRmluZCB0aGUgZmlyc3QgdmFyaWF0aW9uIHRoYXQgYWN0dWFsbHkgZXhpc3RzXG4gICAgaWYgKGZvdW5kKSByZXR1cm4gZm91bmQ7XG5cbiAgICB0cnkge1xuICAgICAgY29uc3Qgc3RhdCA9IGZzLnN0YXRTeW5jKHBhdGgpO1xuICAgICAgaWYgKCFzdGF0LmlzRmlsZSgpKSByZXR1cm4gbnVsbDtcbiAgICAgIHJldHVybiBwYXRoO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgZml4V2luZG93c1BhdGgoZmlsZSkge1xuICAgIC8vIFVuZm9ydHVuYXRlbHksIHRoZXJlJ3MgYSBidWcgaW4gc2Fzcy5qcyB0aGF0IHNlZW1zIHRvIGlnbm9yZSB0aGUgZGlmZmVyZW50XG4gICAgLy8gcGF0aCBzZXBhcmF0b3JzIGFjcm9zcyBwbGF0Zm9ybXNcblxuICAgIC8vIEZvciBzb21lIHJlYXNvbiwgc29tZSBmaWxlcyBoYXZlIGEgbGVhZGluZyBzbGFzaCB0aGF0IHdlIG5lZWQgdG8gZ2V0IHJpZCBvZlxuICAgIGlmIChwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInICYmIGZpbGVbMF0gPT09ICcvJykge1xuICAgICAgZmlsZSA9IGZpbGUuc2xpY2UoMSk7XG4gICAgfVxuXG4gICAgLy8gU2Fzcy5qcyBnZW5lcmF0ZXMgcGF0aHMgc3VjaCBhcyBgX0M6XFxteVBhdGhcXGZpbGUuc2Fzc2AgaW5zdGVhZCBvZiBgQzpcXG15UGF0aFxcX2ZpbGUuc2Fzc2BcbiAgICBpZiAoZmlsZVswXSA9PT0gJ18nKSB7XG4gICAgICBjb25zdCBwYXJ0cyA9IGZpbGUuc2xpY2UoMSkuc3BsaXQocGF0aC5zZXApO1xuICAgICAgY29uc3QgZGlyID0gcGFydHMuc2xpY2UoMCwgLTEpLmpvaW4ocGF0aC5zZXApO1xuICAgICAgY29uc3QgZmlsZU5hbWUgPSBwYXJ0cy5yZXZlcnNlKClbMF07XG4gICAgICBmaWxlID0gcGF0aC5yZXNvbHZlKGRpciwgJ18nICsgZmlsZU5hbWUpO1xuICAgIH1cbiAgICByZXR1cm4gZmlsZTtcbiAgfVxuXG4gIGdldENvbXBpbGVyVmVyc2lvbigpIHtcbiAgICAvLyBOQjogVGhlcmUgaXMgYSBiaXphcnJlIGJ1ZyBpbiB0aGUgbm9kZSBtb2R1bGUgc3lzdGVtIHdoZXJlIHRoaXMgZG9lc24ndFxuICAgIC8vIHdvcmsgYnV0IG9ubHkgaW4gc2F2ZUNvbmZpZ3VyYXRpb24gdGVzdHNcbiAgICAvL3JldHVybiByZXF1aXJlKCdAcGF1bGNiZXR0cy9ub2RlLXNhc3MvcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgICByZXR1cm4gXCI0LjEuMVwiO1xuICB9XG59XG5cbmZ1bmN0aW9uICpnZXRGaWxlcGF0aHNGb3JWYXJpYXRpb24oaW5jbHVkZVBhdGhzLCByZXF1ZXN0KSB7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVxdWVzdC5yZXNvbHZlZC5yZXBsYWNlKC9eXFwvc2Fzc1xcLy8sICcnKTtcbiAgeWllbGQgcmVzb2x2ZWQ7XG4gIGNvbnN0IGN1cnJlbnQgPSByZXF1ZXN0LmN1cnJlbnQ7XG4gIGZvciAobGV0IGluY2x1ZGVQYXRoIG9mIGluY2x1ZGVQYXRocykge1xuICAgIHlpZWxkIHBhdGgucmVzb2x2ZShpbmNsdWRlUGF0aCwgY3VycmVudCk7XG4gIH1cbn1cbiJdfQ==