'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _compilerBase = require('../compiler-base');

var _toutsuite = require('toutsuite');

var _toutsuite2 = _interopRequireDefault(_toutsuite);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const inputMimeTypes = ['text/vue'];
let vueify = null;

const d = require('debug')('electron-compile:vue');

const mimeTypeToSimpleType = {
  'text/coffeescript': 'coffee',
  'text/typescript': 'ts',
  'application/javascript': 'js',
  'text/jade': 'jade',
  'text/less': 'less',
  'text/sass': 'sass',
  'text/scss': 'scss',
  'text/stylus': 'stylus'
};

/**
 * @access private
 */
class VueCompiler extends _compilerBase.CompilerBase {
  constructor(asyncCompilers, syncCompilers) {
    super();
    Object.assign(this, { asyncCompilers, syncCompilers });

    this.compilerOptions = {};
  }

  static createFromCompilers(compilersByMimeType) {
    let makeAsyncCompilers = () => Object.keys(compilersByMimeType).reduce((acc, mimeType) => {
      let compiler = compilersByMimeType[mimeType];

      acc[mimeType] = (() => {
        var _ref = _asyncToGenerator(function* (content, cb, vueCompiler, filePath) {
          let ctx = {};
          try {
            if (!(yield compiler.shouldCompileFile(filePath, ctx))) {
              cb(null, content);
              return;
            }

            let result = yield compiler.compile(content, filePath, ctx);
            cb(null, result.code);
            return;
          } catch (e) {
            cb(e);
          }
        });

        return function (_x, _x2, _x3, _x4) {
          return _ref.apply(this, arguments);
        };
      })();

      let st = mimeTypeToSimpleType[mimeType];
      if (st) acc[st] = acc[mimeType];

      return acc;
    }, {});

    let makeSyncCompilers = () => Object.keys(compilersByMimeType).reduce((acc, mimeType) => {
      let compiler = compilersByMimeType[mimeType];

      acc[mimeType] = (content, cb, vueCompiler, filePath) => {
        let ctx = {};
        try {
          if (!compiler.shouldCompileFileSync(filePath, ctx)) {
            cb(null, content);
            return;
          }

          let result = compiler.compileSync(content, filePath, ctx);
          cb(null, result.code);
          return;
        } catch (e) {
          cb(e);
        }
      };

      let st = mimeTypeToSimpleType[mimeType];
      if (st) acc[st] = acc[mimeType];

      return acc;
    }, {});

    // NB: This is super hacky but we have to defer building asyncCompilers
    // and syncCompilers until compilersByMimeType is filled out
    let ret = new VueCompiler(null, null);

    let asyncCompilers, syncCompilers;
    Object.defineProperty(ret, 'asyncCompilers', {
      get: () => {
        asyncCompilers = asyncCompilers || makeAsyncCompilers();
        return asyncCompilers;
      }
    });

    Object.defineProperty(ret, 'syncCompilers', {
      get: () => {
        syncCompilers = syncCompilers || makeSyncCompilers();
        return syncCompilers;
      }
    });

    return ret;
  }

  static getInputMimeTypes() {
    return inputMimeTypes;
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
      vueify = vueify || require('@paulcbetts/vueify');

      let opts = Object.assign({}, _this.compilerOptions);

      let code = yield new Promise(function (res, rej) {
        vueify.compiler.compileNoGlobals(sourceCode, filePath, _this.asyncCompilers, opts, function (e, r) {
          if (e) {
            rej(e);
          } else {
            res(r);
          }
        });
      });

      return {
        code,
        mimeType: 'application/javascript'
      };
    })();
  }

  shouldCompileFileSync(fileName, compilerContext) {
    return true;
  }

  determineDependentFilesSync(sourceCode, filePath, compilerContext) {
    return [];
  }

  compileSync(sourceCode, filePath, compilerContext) {
    vueify = vueify || require('@paulcbetts/vueify');

    let opts = Object.assign({}, this.compilerOptions);

    let err, code;
    (0, _toutsuite2.default)(() => {
      vueify.compiler.compileNoGlobals(sourceCode, filePath, this.syncCompilers, opts, (e, r) => {
        if (e) {
          err = e;
        } else {
          code = r;
        }
      });
    });

    if (err) throw err;

    return {
      code,
      mimeType: 'application/javascript'
    };
  }

  getCompilerVersion() {
    // NB: See same issue with SASS and user-scoped modules as to why we hard-code this
    let thisVersion = '9.4.0';
    let compilers = this.allCompilers || [];
    let otherVersions = compilers.map(x => x.getCompilerVersion).join();

    return `${thisVersion},${otherVersions}`;
  }
}
exports.default = VueCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9odG1sL3Z1ZS5qcyJdLCJuYW1lcyI6WyJpbnB1dE1pbWVUeXBlcyIsInZ1ZWlmeSIsImQiLCJyZXF1aXJlIiwibWltZVR5cGVUb1NpbXBsZVR5cGUiLCJWdWVDb21waWxlciIsImNvbnN0cnVjdG9yIiwiYXN5bmNDb21waWxlcnMiLCJzeW5jQ29tcGlsZXJzIiwiT2JqZWN0IiwiYXNzaWduIiwiY29tcGlsZXJPcHRpb25zIiwiY3JlYXRlRnJvbUNvbXBpbGVycyIsImNvbXBpbGVyc0J5TWltZVR5cGUiLCJtYWtlQXN5bmNDb21waWxlcnMiLCJrZXlzIiwicmVkdWNlIiwiYWNjIiwibWltZVR5cGUiLCJjb21waWxlciIsImNvbnRlbnQiLCJjYiIsInZ1ZUNvbXBpbGVyIiwiZmlsZVBhdGgiLCJjdHgiLCJzaG91bGRDb21waWxlRmlsZSIsInJlc3VsdCIsImNvbXBpbGUiLCJjb2RlIiwiZSIsInN0IiwibWFrZVN5bmNDb21waWxlcnMiLCJzaG91bGRDb21waWxlRmlsZVN5bmMiLCJjb21waWxlU3luYyIsInJldCIsImRlZmluZVByb3BlcnR5IiwiZ2V0IiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJmaWxlTmFtZSIsImNvbXBpbGVyQ29udGV4dCIsImRldGVybWluZURlcGVuZGVudEZpbGVzIiwic291cmNlQ29kZSIsIm9wdHMiLCJQcm9taXNlIiwicmVzIiwicmVqIiwiY29tcGlsZU5vR2xvYmFscyIsInIiLCJkZXRlcm1pbmVEZXBlbmRlbnRGaWxlc1N5bmMiLCJlcnIiLCJnZXRDb21waWxlclZlcnNpb24iLCJ0aGlzVmVyc2lvbiIsImNvbXBpbGVycyIsImFsbENvbXBpbGVycyIsIm90aGVyVmVyc2lvbnMiLCJtYXAiLCJ4Iiwiam9pbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7O0FBQ0E7Ozs7Ozs7O0FBRUEsTUFBTUEsaUJBQWlCLENBQUMsVUFBRCxDQUF2QjtBQUNBLElBQUlDLFNBQVMsSUFBYjs7QUFFQSxNQUFNQyxJQUFJQyxRQUFR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QSxRQUFJQyxZQUFZLEtBQUtDLFlBQUwsSUFBcUIsRUFBckM7QUFDQSxRQUFJQyxnQkFBZ0JGLFVBQVVHLEdBQVYsQ0FBZUMsQ0FBRCxJQUFPQSxFQUFFTixrQkFBdkIsRUFBMkNPLElBQTNDLEVBQXBCOztBQUVBLFdBQVEsR0FBRU4sV0FBWSxJQUFHRyxhQUFjLEVBQXZDO0FBQ0Q7QUFqSm1EO2tCQUFqQ2pELFciLCJmaWxlIjoidnVlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuaW1wb3J0IHRvdXRTdWl0ZSBmcm9tICd0b3V0c3VpdGUnO1xuXG5jb25zdCBpbnB1dE1pbWVUeXBlcyA9IFsndGV4dC92dWUnXTtcbmxldCB2dWVpZnkgPSBudWxsO1xuXG5jb25zdCBkID0gcmVxdWlyZSgnZGVidWcnKSgnZWxlY3Ryb24tY29tcGlsZTp2dWUnKTtcblxuY29uc3QgbWltZVR5cGVUb1NpbXBsZVR5cGUgPSB7XG4gICd0ZXh0L2NvZmZlZXNjcmlwdCc6ICdjb2ZmZWUnLFxuICAndGV4dC90eXBlc2NyaXB0JzogJ3RzJyxcbiAgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnOiAnanMnLFxuICAndGV4dC9qYWRlJzogJ2phZGUnLFxuICAndGV4dC9sZXNzJzogJ2xlc3MnLFxuICAndGV4dC9zYXNzJzogJ3Nhc3MnLFxuICAndGV4dC9zY3NzJzogJ3Njc3MnLFxuICAndGV4dC9zdHlsdXMnOiAnc3R5bHVzJyxcbn07XG5cbi8qKlxuICogQGFjY2VzcyBwcml2YXRlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFZ1ZUNvbXBpbGVyIGV4dGVuZHMgQ29tcGlsZXJCYXNlIHtcbiAgY29uc3RydWN0b3IoYXN5bmNDb21waWxlcnMsIHN5bmNDb21waWxlcnMpIHtcbiAgICBzdXBlcigpO1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgeyBhc3luY0NvbXBpbGVycywgc3luY0NvbXBpbGVycyB9KTtcblxuICAgIHRoaXMuY29tcGlsZXJPcHRpb25zID0ge307XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRnJvbUNvbXBpbGVycyhjb21waWxlcnNCeU1pbWVUeXBlKSB7XG4gICAgbGV0IG1ha2VBc3luY0NvbXBpbGVycyA9ICgpID0+IE9iamVjdC5rZXlzKGNvbXBpbGVyc0J5TWltZVR5cGUpLnJlZHVjZSgoYWNjLCBtaW1lVHlwZSkgPT4ge1xuICAgICAgbGV0IGNvbXBpbGVyID0gY29tcGlsZXJzQnlNaW1lVHlwZVttaW1lVHlwZV07XG5cbiAgICAgIGFjY1ttaW1lVHlwZV0gPSBhc3luYyAoY29udGVudCwgY2IsIHZ1ZUNvbXBpbGVyLCBmaWxlUGF0aCkgPT4ge1xuICAgICAgICBsZXQgY3R4ID0ge307XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKCFhd2FpdCBjb21waWxlci5zaG91bGRDb21waWxlRmlsZShmaWxlUGF0aCwgY3R4KSkge1xuICAgICAgICAgICAgY2IobnVsbCwgY29udGVudCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGV0IHJlc3VsdCA9IGF3YWl0IGNvbXBpbGVyLmNvbXBpbGUoY29udGVudCwgZmlsZVBhdGgsIGN0eCk7XG4gICAgICAgICAgY2IobnVsbCwgcmVzdWx0LmNvZGUpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGNiKGUpO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBsZXQgc3QgPSBtaW1lVHlwZVRvU2ltcGxlVHlwZVttaW1lVHlwZV07XG4gICAgICBpZiAoc3QpIGFjY1tzdF0gPSBhY2NbbWltZVR5cGVdO1xuXG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcblxuICAgIGxldCBtYWtlU3luY0NvbXBpbGVycyA9ICgpID0+IE9iamVjdC5rZXlzKGNvbXBpbGVyc0J5TWltZVR5cGUpLnJlZHVjZSgoYWNjLCBtaW1lVHlwZSkgPT4ge1xuICAgICAgbGV0IGNvbXBpbGVyID0gY29tcGlsZXJzQnlNaW1lVHlwZVttaW1lVHlwZV07XG5cbiAgICAgIGFjY1ttaW1lVHlwZV0gPSAoY29udGVudCwgY2IsIHZ1ZUNvbXBpbGVyLCBmaWxlUGF0aCkgPT4ge1xuICAgICAgICBsZXQgY3R4ID0ge307XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgaWYgKCFjb21waWxlci5zaG91bGRDb21waWxlRmlsZVN5bmMoZmlsZVBhdGgsIGN0eCkpIHtcbiAgICAgICAgICAgIGNiKG51bGwsIGNvbnRlbnQpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGxldCByZXN1bHQgPSBjb21waWxlci5jb21waWxlU3luYyhjb250ZW50LCBmaWxlUGF0aCwgY3R4KTtcbiAgICAgICAgICBjYihudWxsLCByZXN1bHQuY29kZSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgY2IoZSk7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGxldCBzdCA9IG1pbWVUeXBlVG9TaW1wbGVUeXBlW21pbWVUeXBlXTtcbiAgICAgIGlmIChzdCkgYWNjW3N0XSA9IGFjY1ttaW1lVHlwZV07XG5cbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuXG4gICAgLy8gTkI6IFRoaXMgaXMgc3VwZXIgaGFja3kgYnV0IHdlIGhhdmUgdG8gZGVmZXIgYnVpbGRpbmcgYXN5bmNDb21waWxlcnNcbiAgICAvLyBhbmQgc3luY0NvbXBpbGVycyB1bnRpbCBjb21waWxlcnNCeU1pbWVUeXBlIGlzIGZpbGxlZCBvdXRcbiAgICBsZXQgcmV0ID0gbmV3IFZ1ZUNvbXBpbGVyKG51bGwsIG51bGwpO1xuXG4gICAgbGV0IGFzeW5jQ29tcGlsZXJzLCBzeW5jQ29tcGlsZXJzO1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShyZXQsICdhc3luY0NvbXBpbGVycycsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBhc3luY0NvbXBpbGVycyA9IGFzeW5jQ29tcGlsZXJzIHx8IG1ha2VBc3luY0NvbXBpbGVycygpO1xuICAgICAgICByZXR1cm4gYXN5bmNDb21waWxlcnM7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkocmV0LCAnc3luY0NvbXBpbGVycycsIHtcbiAgICAgIGdldDogKCkgPT4ge1xuICAgICAgICBzeW5jQ29tcGlsZXJzID0gc3luY0NvbXBpbGVycyB8fCBtYWtlU3luY0NvbXBpbGVycygpO1xuICAgICAgICByZXR1cm4gc3luY0NvbXBpbGVycztcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiByZXQ7XG4gIH1cblxuICBzdGF0aWMgZ2V0SW5wdXRNaW1lVHlwZXMoKSB7XG4gICAgcmV0dXJuIGlucHV0TWltZVR5cGVzO1xuICB9XG5cbiAgYXN5bmMgc2hvdWxkQ29tcGlsZUZpbGUoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgYXN5bmMgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGFzeW5jIGNvbXBpbGUoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHZ1ZWlmeSA9IHZ1ZWlmeSB8fCByZXF1aXJlKCdAcGF1bGNiZXR0cy92dWVpZnknKTtcblxuICAgIGxldCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jb21waWxlck9wdGlvbnMpO1xuXG4gICAgbGV0IGNvZGUgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzLCByZWopID0+IHtcbiAgICAgIHZ1ZWlmeS5jb21waWxlci5jb21waWxlTm9HbG9iYWxzKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCB0aGlzLmFzeW5jQ29tcGlsZXJzLCBvcHRzLCAoZSxyKSA9PiB7XG4gICAgICAgIGlmIChlKSB7IHJlaihlKTsgfSBlbHNlIHsgcmVzKHIpOyB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlLFxuICAgICAgbWltZVR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0J1xuICAgIH07XG4gIH1cblxuICBzaG91bGRDb21waWxlRmlsZVN5bmMoZmlsZU5hbWUsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZGV0ZXJtaW5lRGVwZW5kZW50RmlsZXNTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBjb21waWxlU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgdnVlaWZ5ID0gdnVlaWZ5IHx8IHJlcXVpcmUoJ0BwYXVsY2JldHRzL3Z1ZWlmeScpO1xuXG4gICAgbGV0IG9wdHMgPSBPYmplY3QuYXNzaWduKHt9LCB0aGlzLmNvbXBpbGVyT3B0aW9ucyk7XG5cbiAgICBsZXQgZXJyLGNvZGU7XG4gICAgdG91dFN1aXRlKCgpID0+IHtcbiAgICAgIHZ1ZWlmeS5jb21waWxlci5jb21waWxlTm9HbG9iYWxzKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCB0aGlzLnN5bmNDb21waWxlcnMsIG9wdHMsIChlLHIpID0+IHtcbiAgICAgICAgaWYgKGUpIHsgZXJyID0gZTsgfSBlbHNlIHsgY29kZSA9IHI7IH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgaWYgKGVycikgdGhyb3cgZXJyO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGNvZGUsXG4gICAgICBtaW1lVHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXG4gICAgfTtcbiAgfVxuXG4gIGdldENvbXBpbGVyVmVyc2lvbigpIHtcbiAgICAvLyBOQjogU2VlIHNhbWUgaXNzdWUgd2l0aCBTQVNTIGFuZCB1c2VyLXNjb3BlZCBtb2R1bGVzIGFzIHRvIHdoeSB3ZSBoYXJkLWNvZGUgdGhpc1xuICAgIGxldCB0aGlzVmVyc2lvbiA9ICc5LjQuMCc7XG4gICAgbGV0IGNvbXBpbGVycyA9IHRoaXMuYWxsQ29tcGlsZXJzIHx8IFtdO1xuICAgIGxldCBvdGhlclZlcnNpb25zID0gY29tcGlsZXJzLm1hcCgoeCkgPT4geC5nZXRDb21waWxlclZlcnNpb24pLmpvaW4oKTtcblxuICAgIHJldHVybiBgJHt0aGlzVmVyc2lvbn0sJHtvdGhlclZlcnNpb25zfWA7XG4gIH1cbn1cbiJdfQ==