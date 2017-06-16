'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _mimeTypes = require('@paulcbetts/mime-types');

var _mimeTypes2 = _interopRequireDefault(_mimeTypes);

var _compilerBase = require('../compiler-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const inputMimeTypes = ['text/html'];
let cheerio = null;

const d = require('debug')('electron-compile:inline-html');

const compiledCSS = {
  'text/less': true,
  'text/scss': true,
  'text/sass': true,
  'text/stylus': true
};

/**
 * @access private
 */
class InlineHtmlCompiler extends _compilerBase.CompilerBase {
  constructor(compileBlock, compileBlockSync) {
    super();

    this.compileBlock = compileBlock;
    this.compileBlockSync = compileBlockSync;
  }

  static createFromCompilers(compilersByMimeType) {
    d(`Setting up inline HTML compilers: ${JSON.stringify(Object.keys(compilersByMimeType))}`);

    let compileBlock = (() => {
      var _ref = _asyncToGenerator(function* (sourceCode, filePath, mimeType, ctx) {
        let realType = mimeType;
        if (!mimeType && ctx.tag === 'script') realType = 'application/javascript';

        if (!realType) return sourceCode;

        let compiler = compilersByMimeType[realType] || compilersByMimeType['text/plain'];
        let ext = _mimeTypes2.default.extension(realType);
        let fakeFile = `${filePath}:inline_${ctx.count}.${ext}`;

        d(`Compiling inline block for ${filePath} with mimeType ${mimeType}`);
        if (!(yield compiler.shouldCompileFile(fakeFile, ctx))) return sourceCode;
        return (yield compiler.compileSync(sourceCode, fakeFile, ctx)).code;
      });

      return function compileBlock(_x, _x2, _x3, _x4) {
        return _ref.apply(this, arguments);
      };
    })();

    let compileBlockSync = (sourceCode, filePath, mimeType, ctx) => {
      let realType = mimeType;
      if (!mimeType && ctx.tag === 'script') realType = 'application/javascript';

      if (!realType) return sourceCode;

      let compiler = compilersByMimeType[realType] || compilersByMimeType['text/plain'];
      let ext = _mimeTypes2.default.extension(realType);
      let fakeFile = `${filePath}:inline_${ctx.count}.${ext}`;

      d(`Compiling inline block for ${filePath} with mimeType ${mimeType}`);
      if (!compiler.shouldCompileFileSync(fakeFile, ctx)) return sourceCode;
      return compiler.compileSync(sourceCode, fakeFile, ctx).code;
    };

    return new InlineHtmlCompiler(compileBlock, compileBlockSync);
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

  each(nodes, selector) {
    return _asyncToGenerator(function* () {
      let acc = [];
      nodes.each(function (i, el) {
        let promise = selector(i, el);
        if (!promise) return false;

        acc.push(promise);
        return true;
      });

      yield Promise.all(acc);
    })();
  }

  eachSync(nodes, selector) {
    // NB: This method is here just so it's easier to mechanically
    // translate the async compile to compileSync
    return nodes.each((i, el) => {
      selector(i, el);
      return true;
    });
  }

  compile(sourceCode, filePath, compilerContext) {
    var _this = this;

    return _asyncToGenerator(function* () {
      cheerio = cheerio || require('cheerio');

      //Leave the attributes casing as it is, because of Angular 2 and maybe other case-sensitive frameworks
      let $ = cheerio.load(sourceCode, { lowerCaseAttributeNames: false });
      let toWait = [];

      let that = _this;
      let styleCount = 0;
      toWait.push(_this.each($('style'), (() => {
        var _ref2 = _asyncToGenerator(function* (i, el) {
          let mimeType = $(el).attr('type') || 'text/plain';

          let thisCtx = Object.assign({
            count: styleCount++,
            tag: 'style'
          }, compilerContext);

          let origText = $(el).text();
          let newText = yield that.compileBlock(origText, filePath, mimeType, thisCtx);

          if (origText !== newText) {
            $(el).text(newText);
            $(el).attr('type', 'text/css');
          }
        });

        return function (_x5, _x6) {
          return _ref2.apply(this, arguments);
        };
      })()));

      let scriptCount = 0;
      toWait.push(_this.each($('script'), (() => {
        var _ref3 = _asyncToGenerator(function* (i, el) {
          let src = $(el).attr('src');
          if (src && src.length > 2) {
            $(el).attr('src', InlineHtmlCompiler.fixupRelativeUrl(src));
            return;
          }

          let thisCtx = Object.assign({
            count: scriptCount++,
            tag: 'script'
          }, compilerContext);

          let mimeType = $(el).attr('type') || 'application/javascript';
          let origText = $(el).text();
          let newText = yield that.compileBlock(origText, filePath, mimeType, thisCtx);

          if (origText !== newText) {
            $(el).text(newText);
            $(el).attr('type', 'application/javascript');
          }
        });

        return function (_x7, _x8) {
          return _ref3.apply(this, arguments);
        };
      })()));

      $('link').map(function (i, el) {
        let href = $(el).attr('href');
        if (href && href.length > 2) {
          $(el).attr('href', InlineHtmlCompiler.fixupRelativeUrl(href));
        }

        // NB: In recent versions of Chromium, the link type MUST be text/css or
        // it will be flat-out ignored. Also I hate myself for hardcoding these.
        let type = $(el).attr('type');
        if (compiledCSS[type]) $(el).attr('type', 'text/css');
      });

      $('x-require').map(function (i, el) {
        let src = $(el).attr('src');

        // File URL? Bail
        if (src.match(/^file:/i)) return;

        // Absolute path? Bail.
        if (src.match(/^([\/]|[A-Za-z]:)/i)) return;

        try {
          $(el).attr('src', _path2.default.resolve(_path2.default.dirname(filePath), src));
        } catch (e) {
          $(el).text(`${e.message}\n${e.stack}`);
        }
      });

      yield Promise.all(toWait);

      return {
        code: $.html(),
        mimeType: 'text/html'
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
    cheerio = cheerio || require('cheerio');

    //Leave the attributes casing as it is, because of Angular 2 and maybe other case-sensitive frameworks
    let $ = cheerio.load(sourceCode, { lowerCaseAttributeNames: false });

    let that = this;
    let styleCount = 0;
    this.eachSync($('style'), (() => {
      var _ref4 = _asyncToGenerator(function* (i, el) {
        let mimeType = $(el).attr('type');

        let thisCtx = Object.assign({
          count: styleCount++,
          tag: 'style'
        }, compilerContext);

        let origText = $(el).text();
        let newText = that.compileBlockSync(origText, filePath, mimeType, thisCtx);

        if (origText !== newText) {
          $(el).text(newText);
          $(el).attr('type', 'text/css');
        }
      });

      return function (_x9, _x10) {
        return _ref4.apply(this, arguments);
      };
    })());

    let scriptCount = 0;
    this.eachSync($('script'), (() => {
      var _ref5 = _asyncToGenerator(function* (i, el) {
        let src = $(el).attr('src');
        if (src && src.length > 2) {
          $(el).attr('src', InlineHtmlCompiler.fixupRelativeUrl(src));
          return;
        }

        let thisCtx = Object.assign({
          count: scriptCount++,
          tag: 'script'
        }, compilerContext);

        let mimeType = $(el).attr('type');

        let oldText = $(el).text();
        let newText = that.compileBlockSync(oldText, filePath, mimeType, thisCtx);

        if (oldText !== newText) {
          $(el).text(newText);
          $(el).attr('type', 'application/javascript');
        }
      });

      return function (_x11, _x12) {
        return _ref5.apply(this, arguments);
      };
    })());

    $('link').map((i, el) => {
      let href = $(el).attr('href');
      if (href && href.length > 2) {
        $(el).attr('href', InlineHtmlCompiler.fixupRelativeUrl(href));
      }

      // NB: In recent versions of Chromium, the link type MUST be text/css or
      // it will be flat-out ignored. Also I hate myself for hardcoding these.
      let type = $(el).attr('type');
      if (compiledCSS[type]) $(el).attr('type', 'text/css');
    });

    $('x-require').map((i, el) => {
      let src = $(el).attr('src');

      // File URL? Bail
      if (src.match(/^file:/i)) return;

      // Absolute path? Bail.
      if (src.match(/^([\/]|[A-Za-z]:)/i)) return;

      try {
        $(el).attr('src', _path2.default.resolve(_path2.default.dirname(filePath), src));
      } catch (e) {
        $(el).text(`${e.message}\n${e.stack}`);
      }
    });

    return {
      code: $.html(),
      mimeType: 'text/html'
    };
  }

  getCompilerVersion() {
    let thisVersion = require('../../package.json').version;
    let compilers = this.allCompilers || [];
    let otherVersions = compilers.map(x => x.getCompilerVersion).join();

    return `${thisVersion},${otherVersions}`;
  }

  static fixupRelativeUrl(url) {
    if (!url.match(/^\/\//)) return url;
    return `https:${url}`;
  }
}
exports.default = InlineHtmlCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9odG1sL2lubGluZS1odG1sLmpzIl0sIm5hbWVzIjpbImlucHV0TWltZVR5cGVzIiwiY2hlZXJpbyIsImQiLCJyZXF1aXJlIiwiY29tcGlsZWRDU1MiLCJJbmxpbmVIdG1sQ29tcGlsZXIiLCJjb25zdHJ1Y3RvciIsImNvbXBpbGVCbG9jayIsImNvbXBpbGVCbG9ja1N5bmMiLCJjcmVhdGVGcm9tQ29tcGlsZXJzIiwiY29tcGlsZXJzQnlNaW1lVHlwZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJPYmplY3QiLCJrZXlzIiwic291cmNlQ29kZSIsImZpbGVQYXRoIiwibWltZVR5cGUiLCJjdHgiLCJyZWFsVHlwZSIsInRhZyIsImNvbXBpbGVyIiwiZXh0IiwiZXh0ZW5zaW9uIiwiZmFrZUZpbGUiLCJjb3VudCIsInNob3VsZENvbXBpbGVGaWxlIiwiY29tcGlsZVN5bmMiLCJjb2RlIiwic2hvdWxkQ29tcGlsZUZpbGVTeW5jIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJmaWxlTmFtZSIsImNvbXBpbGVyQ29udGV4dCIsImRldGVybWluZURlcGVuZGVudEZpbGVzIiwiZWFjaCIsIm5vZGVzIiwic2VsZWN0b3IiLCJhY2MiLCJpIiwiZWwiLCJwcm9taXNlIiwicHVzaCIsIlByb21pc2UiLCJhbGwiLCJlYWNoU3luYyIsImNvbXBpbGUiLCIkIiwibG9hZCIsImxvd2VyQ2FzZUF0dHJpYnV0ZU5hbWVzIiwidG9XYWl0IiwidGhhdCIsInN0eWxlQ291bnQiLCJhdHRyIiwidGhpc0N0eCIsImFzc2lnbiIsIm9yaWdUZXh0IiwidGV4dCIsIm5ld1RleHQiLCJzY3JpcHRDb3VudCIsInNyYyIsImxlbmd0aCIsImZpeHVwUmVsYXRpdmVVcmwiLCJtYXAiLCJocmVmIiwidHlwZSIsIm1hdGNoIiwicmVzb2x2ZSIsImRpcm5hbWUiLCJlIiwibWVzc2FnZSIsInN0YWNrIiwiaHRtbCIsImRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyIsIm9sZFRleHQiLCJnZXRDb21waWxlclZlcnNpb24iLCJ0aGlzVmVyc2lvbiIsInZlcnNpb24iLCJjb21waWxlcnMiLCJhbGxDb21waWxlcnMiLCJvdGhlclZlcnNpb25zIiwieCIsImpvaW4iLCJ1cmwiXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsTUFBTUEsaUJBQWlCLENBQUMsV0FBRCxDQUF2QjtBQUNBLElBQUlDLFVBQVUsSUFBZDs7QUFFQSxNQUFNQyxJQUFJQyxRQUFRLE9BQVIsRUFBaUIsOEJBQWpCLENBQVY7O0FBRUEsTUFBTUMsY0FBYztBQUNsQixlQUFhLElBREs7QUFFbEIsZUFBYSxJQUZLO0FBR2xCLGVBQWEsSUFISztBQUlsQixpQkFBZTtBQUpHLENBQXBCOztBQU9BOzs7QUFHZSxNQUFNQyxrQkFBTixvQ0FBOEM7QUFDM0RDLGNBQVlDLFlBQVosRUFBMEJDLGdCQUExQixFQUE0QztBQUMxQzs7QUFFQSxTQUFLRCxZQUFMLEdBQW9CQSxZQUFwQjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCQSxnQkFBeEI7QUFDRDs7QUFFRCxTQUFPQyxtQkFBUCxDQUEyQkMsbUJBQTNCLEVBQWdEO0FBQzlDUixNQUFHLHFDQUFvQ1MsS0FBS0MsU0FBTCxDQUFlQyxPQUFPQyxJQUFQLENBQVlKLG1CQUFaLENBQWYsQ0FBaUQsRUFBeEY7O0FBRUEsUUFBSUg7QUFBQSxtQ0FBZSxXQUFPUSxVQUFQLEVBQW1CQyxRQUFuQixFQUE2QkMsUUFBN0IsRUFBdUNDLEdBQXZDLEVBQStDO0FBQ2hFLFlBQUlDLFdBQVdGLFFBQWY7QUFDQSxZQUFJLENBQUNBLFFBQUQsSUFBYUMsSUFBSUUsR0FBSixLQUFZLFFBQTdCLEVBQXVDRCxXQUFXLHdCQUFYOztBQUV2QyxZQUFJLENBQUNBLFFBQUwsRUFBZSxPQUFPSixVQUFQOztBQUVmLFlBQUlNLFdBQVdYLG9CQUFvQlMsUUFBcEIsS0FBaUNULG9CQUFvQixZQUFwQixDQUFoRDtBQUNBLFlBQUlZLE1BQU0sb0JBQVVDLFNBQVYsQ0FBb0JKLFFBQXBCLENB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c291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgbWltZVR5cGVzIGZyb20gJ0BwYXVsY2JldHRzL21pbWUtdHlwZXMnO1xuaW1wb3J0IHtDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuXG5jb25zdCBpbnB1dE1pbWVUeXBlcyA9IFsndGV4dC9odG1sJ107XG5sZXQgY2hlZXJpbyA9IG51bGw7XG5cbmNvbnN0IGQgPSByZXF1aXJlKCdkZWJ1ZycpKCdlbGVjdHJvbi1jb21waWxlOmlubGluZS1odG1sJyk7XG5cbmNvbnN0IGNvbXBpbGVkQ1NTID0ge1xuICAndGV4dC9sZXNzJzogdHJ1ZSxcbiAgJ3RleHQvc2Nzcyc6IHRydWUsXG4gICd0ZXh0L3Nhc3MnOiB0cnVlLFxuICAndGV4dC9zdHlsdXMnOiB0cnVlLFxufTtcblxuLyoqXG4gKiBAYWNjZXNzIHByaXZhdGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSW5saW5lSHRtbENvbXBpbGVyIGV4dGVuZHMgQ29tcGlsZXJCYXNlIHtcbiAgY29uc3RydWN0b3IoY29tcGlsZUJsb2NrLCBjb21waWxlQmxvY2tTeW5jKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuY29tcGlsZUJsb2NrID0gY29tcGlsZUJsb2NrO1xuICAgIHRoaXMuY29tcGlsZUJsb2NrU3luYyA9IGNvbXBpbGVCbG9ja1N5bmM7XG4gIH1cblxuICBzdGF0aWMgY3JlYXRlRnJvbUNvbXBpbGVycyhjb21waWxlcnNCeU1pbWVUeXBlKSB7XG4gICAgZChgU2V0dGluZyB1cCBpbmxpbmUgSFRNTCBjb21waWxlcnM6ICR7SlNPTi5zdHJpbmdpZnkoT2JqZWN0LmtleXMoY29tcGlsZXJzQnlNaW1lVHlwZSkpfWApO1xuXG4gICAgbGV0IGNvbXBpbGVCbG9jayA9IGFzeW5jIChzb3VyY2VDb2RlLCBmaWxlUGF0aCwgbWltZVR5cGUsIGN0eCkgPT4ge1xuICAgICAgbGV0IHJlYWxUeXBlID0gbWltZVR5cGU7XG4gICAgICBpZiAoIW1pbWVUeXBlICYmIGN0eC50YWcgPT09ICdzY3JpcHQnKSByZWFsVHlwZSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JztcblxuICAgICAgaWYgKCFyZWFsVHlwZSkgcmV0dXJuIHNvdXJjZUNvZGU7XG5cbiAgICAgIGxldCBjb21waWxlciA9IGNvbXBpbGVyc0J5TWltZVR5cGVbcmVhbFR5cGVdIHx8IGNvbXBpbGVyc0J5TWltZVR5cGVbJ3RleHQvcGxhaW4nXTtcbiAgICAgIGxldCBleHQgPSBtaW1lVHlwZXMuZXh0ZW5zaW9uKHJlYWxUeXBlKTtcbiAgICAgIGxldCBmYWtlRmlsZSA9IGAke2ZpbGVQYXRofTppbmxpbmVfJHtjdHguY291bnR9LiR7ZXh0fWA7XG5cbiAgICAgIGQoYENvbXBpbGluZyBpbmxpbmUgYmxvY2sgZm9yICR7ZmlsZVBhdGh9IHdpdGggbWltZVR5cGUgJHttaW1lVHlwZX1gKTtcbiAgICAgIGlmICghKGF3YWl0IGNvbXBpbGVyLnNob3VsZENvbXBpbGVGaWxlKGZha2VGaWxlLCBjdHgpKSkgcmV0dXJuIHNvdXJjZUNvZGU7XG4gICAgICByZXR1cm4gKGF3YWl0IGNvbXBpbGVyLmNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZha2VGaWxlLCBjdHgpKS5jb2RlO1xuICAgIH07XG5cbiAgICBsZXQgY29tcGlsZUJsb2NrU3luYyA9IChzb3VyY2VDb2RlLCBmaWxlUGF0aCwgbWltZVR5cGUsIGN0eCkgPT4ge1xuICAgICAgbGV0IHJlYWxUeXBlID0gbWltZVR5cGU7XG4gICAgICBpZiAoIW1pbWVUeXBlICYmIGN0eC50YWcgPT09ICdzY3JpcHQnKSByZWFsVHlwZSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JztcblxuICAgICAgaWYgKCFyZWFsVHlwZSkgcmV0dXJuIHNvdXJjZUNvZGU7XG5cbiAgICAgIGxldCBjb21waWxlciA9IGNvbXBpbGVyc0J5TWltZVR5cGVbcmVhbFR5cGVdIHx8IGNvbXBpbGVyc0J5TWltZVR5cGVbJ3RleHQvcGxhaW4nXTtcbiAgICAgIGxldCBleHQgPSBtaW1lVHlwZXMuZXh0ZW5zaW9uKHJlYWxUeXBlKTtcbiAgICAgIGxldCBmYWtlRmlsZSA9IGAke2ZpbGVQYXRofTppbmxpbmVfJHtjdHguY291bnR9LiR7ZXh0fWA7XG5cbiAgICAgIGQoYENvbXBpbGluZyBpbmxpbmUgYmxvY2sgZm9yICR7ZmlsZVBhdGh9IHdpdGggbWltZVR5cGUgJHttaW1lVHlwZX1gKTtcbiAgICAgIGlmICghY29tcGlsZXIuc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZha2VGaWxlLCBjdHgpKSByZXR1cm4gc291cmNlQ29kZTtcbiAgICAgIHJldHVybiBjb21waWxlci5jb21waWxlU3luYyhzb3VyY2VDb2RlLCBmYWtlRmlsZSwgY3R4KS5jb2RlO1xuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IElubGluZUh0bWxDb21waWxlcihjb21waWxlQmxvY2ssIGNvbXBpbGVCbG9ja1N5bmMpO1xuICB9XG5cbiAgc3RhdGljIGdldElucHV0TWltZVR5cGVzKCkge1xuICAgIHJldHVybiBpbnB1dE1pbWVUeXBlcztcbiAgfVxuXG4gIGFzeW5jIHNob3VsZENvbXBpbGVGaWxlKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGFzeW5jIGRldGVybWluZURlcGVuZGVudEZpbGVzKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gW107XG4gIH1cblxuICBhc3luYyBlYWNoKG5vZGVzLCBzZWxlY3Rvcikge1xuICAgIGxldCBhY2MgPSBbXTtcbiAgICBub2Rlcy5lYWNoKChpLCBlbCkgPT4ge1xuICAgICAgbGV0IHByb21pc2UgPSBzZWxlY3RvcihpLGVsKTtcbiAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBhY2MucHVzaChwcm9taXNlKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0pO1xuXG4gICAgYXdhaXQgUHJvbWlzZS5hbGwoYWNjKTtcbiAgfVxuXG4gIGVhY2hTeW5jKG5vZGVzLCBzZWxlY3Rvcikge1xuICAgIC8vIE5COiBUaGlzIG1ldGhvZCBpcyBoZXJlIGp1c3Qgc28gaXQncyBlYXNpZXIgdG8gbWVjaGFuaWNhbGx5XG4gICAgLy8gdHJhbnNsYXRlIHRoZSBhc3luYyBjb21waWxlIHRvIGNvbXBpbGVTeW5jXG4gICAgcmV0dXJuIG5vZGVzLmVhY2goKGksZWwpID0+IHtcbiAgICAgIHNlbGVjdG9yKGksZWwpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjb21waWxlKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBjaGVlcmlvID0gY2hlZXJpbyB8fCByZXF1aXJlKCdjaGVlcmlvJyk7XG4gICAgXG4gICAgLy9MZWF2ZSB0aGUgYXR0cmlidXRlcyBjYXNpbmcgYXMgaXQgaXMsIGJlY2F1c2Ugb2YgQW5ndWxhciAyIGFuZCBtYXliZSBvdGhlciBjYXNlLXNlbnNpdGl2ZSBmcmFtZXdvcmtzXG4gICAgbGV0ICQgPSBjaGVlcmlvLmxvYWQoc291cmNlQ29kZSwge2xvd2VyQ2FzZUF0dHJpYnV0ZU5hbWVzOiBmYWxzZX0pO1xuICAgIGxldCB0b1dhaXQgPSBbXTtcblxuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBsZXQgc3R5bGVDb3VudCA9IDA7XG4gICAgdG9XYWl0LnB1c2godGhpcy5lYWNoKCQoJ3N0eWxlJyksIGFzeW5jIChpLCBlbCkgPT4ge1xuICAgICAgbGV0IG1pbWVUeXBlID0gJChlbCkuYXR0cigndHlwZScpIHx8ICd0ZXh0L3BsYWluJztcblxuICAgICAgbGV0IHRoaXNDdHggPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgY291bnQ6IHN0eWxlQ291bnQrKyxcbiAgICAgICAgdGFnOiAnc3R5bGUnXG4gICAgICB9LCBjb21waWxlckNvbnRleHQpO1xuXG4gICAgICBsZXQgb3JpZ1RleHQgPSAkKGVsKS50ZXh0KCk7XG4gICAgICBsZXQgbmV3VGV4dCA9IGF3YWl0IHRoYXQuY29tcGlsZUJsb2NrKG9yaWdUZXh0LCBmaWxlUGF0aCwgbWltZVR5cGUsIHRoaXNDdHgpO1xuXG4gICAgICBpZiAob3JpZ1RleHQgIT09IG5ld1RleHQpIHtcbiAgICAgICAgJChlbCkudGV4dChuZXdUZXh0KTtcbiAgICAgICAgJChlbCkuYXR0cigndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIGxldCBzY3JpcHRDb3VudCA9IDA7XG4gICAgdG9XYWl0LnB1c2godGhpcy5lYWNoKCQoJ3NjcmlwdCcpLCBhc3luYyAoaSwgZWwpID0+IHtcbiAgICAgIGxldCBzcmMgPSAkKGVsKS5hdHRyKCdzcmMnKTtcbiAgICAgIGlmIChzcmMgJiYgc3JjLmxlbmd0aCA+IDIpIHtcbiAgICAgICAgJChlbCkuYXR0cignc3JjJywgSW5saW5lSHRtbENvbXBpbGVyLmZpeHVwUmVsYXRpdmVVcmwoc3JjKSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbGV0IHRoaXNDdHggPSBPYmplY3QuYXNzaWduKHtcbiAgICAgICAgY291bnQ6IHNjcmlwdENvdW50KyssXG4gICAgICAgIHRhZzogJ3NjcmlwdCdcbiAgICAgIH0sIGNvbXBpbGVyQ29udGV4dCk7XG5cbiAgICAgIGxldCBtaW1lVHlwZSA9ICQoZWwpLmF0dHIoJ3R5cGUnKSB8fCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCc7XG4gICAgICBsZXQgb3JpZ1RleHQgPSAkKGVsKS50ZXh0KCk7XG4gICAgICBsZXQgbmV3VGV4dCA9IGF3YWl0IHRoYXQuY29tcGlsZUJsb2NrKG9yaWdUZXh0LCBmaWxlUGF0aCwgbWltZVR5cGUsIHRoaXNDdHgpO1xuXG4gICAgICBpZiAob3JpZ1RleHQgIT09IG5ld1RleHQpIHtcbiAgICAgICAgJChlbCkudGV4dChuZXdUZXh0KTtcbiAgICAgICAgJChlbCkuYXR0cigndHlwZScsICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0Jyk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgJCgnbGluaycpLm1hcCgoaSwgZWwpID0+IHtcbiAgICAgIGxldCBocmVmID0gJChlbCkuYXR0cignaHJlZicpO1xuICAgICAgaWYgKGhyZWYgJiYgaHJlZi5sZW5ndGggPiAyKSB7ICQoZWwpLmF0dHIoJ2hyZWYnLCBJbmxpbmVIdG1sQ29tcGlsZXIuZml4dXBSZWxhdGl2ZVVybChocmVmKSk7IH1cblxuICAgICAgLy8gTkI6IEluIHJlY2VudCB2ZXJzaW9ucyBvZiBDaHJvbWl1bSwgdGhlIGxpbmsgdHlwZSBNVVNUIGJlIHRleHQvY3NzIG9yXG4gICAgICAvLyBpdCB3aWxsIGJlIGZsYXQtb3V0IGlnbm9yZWQuIEFsc28gSSBoYXRlIG15c2VsZiBmb3IgaGFyZGNvZGluZyB0aGVzZS5cbiAgICAgIGxldCB0eXBlID0gJChlbCkuYXR0cigndHlwZScpO1xuICAgICAgaWYgKGNvbXBpbGVkQ1NTW3R5cGVdKSAkKGVsKS5hdHRyKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgfSk7XG5cbiAgICAkKCd4LXJlcXVpcmUnKS5tYXAoKGksIGVsKSA9PiB7XG4gICAgICBsZXQgc3JjID0gJChlbCkuYXR0cignc3JjJyk7XG5cbiAgICAgIC8vIEZpbGUgVVJMPyBCYWlsXG4gICAgICBpZiAoc3JjLm1hdGNoKC9eZmlsZTovaSkpIHJldHVybjtcblxuICAgICAgLy8gQWJzb2x1dGUgcGF0aD8gQmFpbC5cbiAgICAgIGlmIChzcmMubWF0Y2goL14oW1xcL118W0EtWmEtel06KS9pKSkgcmV0dXJuO1xuXG4gICAgICB0cnkge1xuICAgICAgICAkKGVsKS5hdHRyKCdzcmMnLCBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSwgc3JjKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICQoZWwpLnRleHQoYCR7ZS5tZXNzYWdlfVxcbiR7ZS5zdGFja31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGF3YWl0IFByb21pc2UuYWxsKHRvV2FpdCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgY29kZTogJC5odG1sKCksXG4gICAgICBtaW1lVHlwZTogJ3RleHQvaHRtbCdcbiAgICB9O1xuICB9XG5cbiAgc2hvdWxkQ29tcGlsZUZpbGVTeW5jKGZpbGVOYW1lLCBjb21waWxlckNvbnRleHQpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIGRldGVybWluZURlcGVuZGVudEZpbGVzU3luYyhzb3VyY2VDb2RlLCBmaWxlUGF0aCwgY29tcGlsZXJDb250ZXh0KSB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29tcGlsZVN5bmMoc291cmNlQ29kZSwgZmlsZVBhdGgsIGNvbXBpbGVyQ29udGV4dCkge1xuICAgIGNoZWVyaW8gPSBjaGVlcmlvIHx8IHJlcXVpcmUoJ2NoZWVyaW8nKTtcbiAgICBcbiAgICAvL0xlYXZlIHRoZSBhdHRyaWJ1dGVzIGNhc2luZyBhcyBpdCBpcywgYmVjYXVzZSBvZiBBbmd1bGFyIDIgYW5kIG1heWJlIG90aGVyIGNhc2Utc2Vuc2l0aXZlIGZyYW1ld29ya3NcbiAgICBsZXQgJCA9IGNoZWVyaW8ubG9hZChzb3VyY2VDb2RlLCB7bG93ZXJDYXNlQXR0cmlidXRlTmFtZXM6IGZhbHNlfSk7XG5cbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgbGV0IHN0eWxlQ291bnQgPSAwO1xuICAgIHRoaXMuZWFjaFN5bmMoJCgnc3R5bGUnKSwgYXN5bmMgKGksIGVsKSA9PiB7XG4gICAgICBsZXQgbWltZVR5cGUgPSAkKGVsKS5hdHRyKCd0eXBlJyk7XG5cbiAgICAgIGxldCB0aGlzQ3R4ID0gT2JqZWN0LmFzc2lnbih7XG4gICAgICAgIGNvdW50OiBzdHlsZUNvdW50KyssXG4gICAgICAgIHRhZzogJ3N0eWxlJ1xuICAgICAgfSwgY29tcGlsZXJDb250ZXh0KTtcblxuICAgICAgbGV0IG9yaWdUZXh0ID0gJChlbCkudGV4dCgpO1xuICAgICAgbGV0IG5ld1RleHQgPSB0aGF0LmNvbXBpbGVCbG9ja1N5bmMob3JpZ1RleHQsIGZpbGVQYXRoLCBtaW1lVHlwZSwgdGhpc0N0eCk7XG5cbiAgICAgIGlmIChvcmlnVGV4dCAhPT0gbmV3VGV4dCkge1xuICAgICAgICAkKGVsKS50ZXh0KG5ld1RleHQpO1xuICAgICAgICAkKGVsKS5hdHRyKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBsZXQgc2NyaXB0Q291bnQgPSAwO1xuICAgIHRoaXMuZWFjaFN5bmMoJCgnc2NyaXB0JyksIGFzeW5jIChpLCBlbCkgPT4ge1xuICAgICAgbGV0IHNyYyA9ICQoZWwpLmF0dHIoJ3NyYycpO1xuICAgICAgaWYgKHNyYyAmJiBzcmMubGVuZ3RoID4gMikge1xuICAgICAgICAkKGVsKS5hdHRyKCdzcmMnLCBJbmxpbmVIdG1sQ29tcGlsZXIuZml4dXBSZWxhdGl2ZVVybChzcmMpKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBsZXQgdGhpc0N0eCA9IE9iamVjdC5hc3NpZ24oe1xuICAgICAgICBjb3VudDogc2NyaXB0Q291bnQrKyxcbiAgICAgICAgdGFnOiAnc2NyaXB0J1xuICAgICAgfSwgY29tcGlsZXJDb250ZXh0KTtcblxuICAgICAgbGV0IG1pbWVUeXBlID0gJChlbCkuYXR0cigndHlwZScpO1xuXG4gICAgICBsZXQgb2xkVGV4dCA9ICQoZWwpLnRleHQoKTtcbiAgICAgIGxldCBuZXdUZXh0ID0gdGhhdC5jb21waWxlQmxvY2tTeW5jKG9sZFRleHQsIGZpbGVQYXRoLCBtaW1lVHlwZSwgdGhpc0N0eCk7XG5cbiAgICAgIGlmIChvbGRUZXh0ICE9PSBuZXdUZXh0KSB7XG4gICAgICAgICQoZWwpLnRleHQobmV3VGV4dCk7XG4gICAgICAgICQoZWwpLmF0dHIoJ3R5cGUnLCAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgJCgnbGluaycpLm1hcCgoaSwgZWwpID0+IHtcbiAgICAgIGxldCBocmVmID0gJChlbCkuYXR0cignaHJlZicpO1xuICAgICAgaWYgKGhyZWYgJiYgaHJlZi5sZW5ndGggPiAyKSB7ICQoZWwpLmF0dHIoJ2hyZWYnLCBJbmxpbmVIdG1sQ29tcGlsZXIuZml4dXBSZWxhdGl2ZVVybChocmVmKSk7IH1cblxuICAgICAgLy8gTkI6IEluIHJlY2VudCB2ZXJzaW9ucyBvZiBDaHJvbWl1bSwgdGhlIGxpbmsgdHlwZSBNVVNUIGJlIHRleHQvY3NzIG9yXG4gICAgICAvLyBpdCB3aWxsIGJlIGZsYXQtb3V0IGlnbm9yZWQuIEFsc28gSSBoYXRlIG15c2VsZiBmb3IgaGFyZGNvZGluZyB0aGVzZS5cbiAgICAgIGxldCB0eXBlID0gJChlbCkuYXR0cigndHlwZScpO1xuICAgICAgaWYgKGNvbXBpbGVkQ1NTW3R5cGVdKSAkKGVsKS5hdHRyKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgfSk7XG5cbiAgICAkKCd4LXJlcXVpcmUnKS5tYXAoKGksIGVsKSA9PiB7XG4gICAgICBsZXQgc3JjID0gJChlbCkuYXR0cignc3JjJyk7XG5cbiAgICAgIC8vIEZpbGUgVVJMPyBCYWlsXG4gICAgICBpZiAoc3JjLm1hdGNoKC9eZmlsZTovaSkpIHJldHVybjtcblxuICAgICAgLy8gQWJzb2x1dGUgcGF0aD8gQmFpbC5cbiAgICAgIGlmIChzcmMubWF0Y2goL14oW1xcL118W0EtWmEtel06KS9pKSkgcmV0dXJuO1xuXG4gICAgICB0cnkge1xuICAgICAgICAkKGVsKS5hdHRyKCdzcmMnLCBwYXRoLnJlc29sdmUocGF0aC5kaXJuYW1lKGZpbGVQYXRoKSwgc3JjKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICQoZWwpLnRleHQoYCR7ZS5tZXNzYWdlfVxcbiR7ZS5zdGFja31gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB7XG4gICAgICBjb2RlOiAkLmh0bWwoKSxcbiAgICAgIG1pbWVUeXBlOiAndGV4dC9odG1sJ1xuICAgIH07XG4gIH1cblxuICBnZXRDb21waWxlclZlcnNpb24oKSB7XG4gICAgbGV0IHRoaXNWZXJzaW9uID0gcmVxdWlyZSgnLi4vLi4vcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgICBsZXQgY29tcGlsZXJzID0gdGhpcy5hbGxDb21waWxlcnMgfHwgW107XG4gICAgbGV0IG90aGVyVmVyc2lvbnMgPSBjb21waWxlcnMubWFwKCh4KSA9PiB4LmdldENvbXBpbGVyVmVyc2lvbikuam9pbigpO1xuXG4gICAgcmV0dXJuIGAke3RoaXNWZXJzaW9ufSwke290aGVyVmVyc2lvbnN9YDtcbiAgfVxuXG4gIHN0YXRpYyBmaXh1cFJlbGF0aXZlVXJsKHVybCkge1xuICAgIGlmICghdXJsLm1hdGNoKC9eXFwvXFwvLykpIHJldHVybiB1cmw7XG4gICAgcmV0dXJuIGBodHRwczoke3VybH1gO1xuICB9XG59XG4iXX0=