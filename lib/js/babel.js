'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _compilerBase = require('../compiler-base');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const mimeTypes = ['text/jsx', 'application/javascript'];
let babel = null;
let istanbul = null;

class BabelCompiler extends _compilerBase.SimpleCompilerBase {
  constructor() {
    super();
  }

  static getInputMimeTypes() {
    return mimeTypes;
  }

  // NB: This method exists to stop Babel from trying to load plugins from the
  // app's node_modules directory, which in a production app doesn't have Babel
  // installed in it. Instead, we try to load from our entry point's node_modules
  // directory (i.e. Grunt perhaps), and if it doesn't work, just keep going.
  attemptToPreload(names, prefix) {
    if (!names.length) return null;

    const fixupModule = exp => {
      // NB: Some plugins like transform-decorators-legacy, use import/export
      // semantics, and others don't
      if ('default' in exp) return exp['default'];
      return exp;
    };

    const nodeModulesAboveUs = _path2.default.resolve(__dirname, '..', '..', '..');

    const preloadStrategies = [x => fixupModule(require.main.require(x)), x => fixupModule(require(_path2.default.join(nodeModulesAboveUs, x))), x => fixupModule(require(x))];

    const possibleNames = name => {
      let names = [`babel-${prefix}-${name}`];

      if (prefix === 'plugin') {
        // Look for module names that do not start with "babel-plugin-"
        names.push(name);
      }

      return names;
    };

    // Apply one preloading strategy to the possible names of a module, and return the preloaded
    // module if found, null otherwise
    const preloadPossibleNames = (name, strategy) => {
      if (typeof strategy !== 'function') return null;

      return possibleNames(name).reduce((mod, possibleName) => {
        if (mod !== null) return mod;

        try {
          return strategy(possibleName);
        } catch (e) {}

        return null;
      }, null);
    };

    // Pick a loading strategy that finds the first plugin, the same strategy will be
    // used to preload all plugins
    const selectedStrategy = preloadStrategies.reduce((winner, strategy) => {
      if (winner !== null) return winner;
      return preloadPossibleNames(names[0], strategy) === null ? null : strategy;
    }, null);

    return names.map(name => preloadPossibleNames(name, selectedStrategy)).filter(mod => mod !== null);
  }

  compileSync(sourceCode, filePath, compilerContext) {
    babel = babel || require('babel-core');

    let opts = Object.assign({}, this.compilerOptions, {
      filename: filePath,
      ast: false,
      babelrc: false
    });

    let useCoverage = false;
    if ('coverage' in opts) {
      useCoverage = !!opts.coverage;
      delete opts.coverage;
    }

    if ('plugins' in opts) {
      let plugins = this.attemptToPreload(opts.plugins, 'plugin');
      if (plugins && plugins.length === opts.plugins.length) opts.plugins = plugins;
    }

    if ('presets' in opts) {
      let presets = this.attemptToPreload(opts.presets, 'preset');
      if (presets && presets.length === opts.presets.length) opts.presets = presets;
    }

    const output = babel.transform(sourceCode, opts);
    let sourceMaps = output.map ? JSON.stringify(output.map) : null;

    let code = output.code;
    if (useCoverage) {
      istanbul = istanbul || require('istanbul');

      sourceMaps = null;
      code = new istanbul.Instrumenter().instrumentSync(output.code, filePath);
    }

    return { code, sourceMaps, mimeType: 'application/javascript' };
  }

  getCompilerVersion() {
    return require('babel-core/package.json').version;
  }
}
exports.default = BabelCompiler;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qcy9iYWJlbC5qcyJdLCJuYW1lcyI6WyJtaW1lVHlwZXMiLCJiYWJlbCIsImlzdGFuYnVsIiwiQmFiZWxDb21waWxlciIsImNvbnN0cnVjdG9yIiwiZ2V0SW5wdXRNaW1lVHlwZXMiLCJhdHRlbXB0VG9QcmVsb2FkIiwibmFtZXMiLCJwcmVmaXgiLCJsZW5ndGgiLCJmaXh1cE1vZHVsZSIsImV4cCIsIm5vZGVNb2R1bGVzQWJvdmVVcyIsInJlc29sdmUiLCJfX2Rpcm5hbWUiLCJwcmVsb2FkU3RyYXRlZ2llcyIsIngiLCJyZXF1aXJlIiwibWFpbiIsImpvaW4iLCJwb3NzaWJsZU5hbWVzIiwibmFtZSIsInB1c2giLCJwcmVsb2FkUG9zc2libGVOYW1lcyIsInN0cmF0ZWd5IiwicmVkdWNlIiwibW9kIiwicG9zc2libGVOYW1lIiwiZSIsInNlbGVjdGVkU3RyYXRlZ3kiLCJ3aW5uZXIiLCJtYXAiLCJmaWx0ZXIiLCJjb21waWxlU3luYyIsInNvdXJjZUNvZGUiLCJmaWxlUGF0aCIsImNvbXBpbGVyQ29udGV4dCIsIm9wdHMiLCJPYmplY3QiLCJhc3NpZ24iLCJjb21waWxlck9wdGlvbnMiLCJmaWxlbmFtZSIsImFzdCIsImJhYmVscmMiLCJ1c2VDb3ZlcmFnZSIsImNvdmVyYWdlIiwicGx1Z2lucyIsInByZXNldHMiLCJvdXRwdXQiLCJ0cmFuc2Zvcm0iLCJzb3VyY2VNYXBzIiwiSlNPTiIsInN0cmluZ2lmeSIsImNvZGUiLCJJbnN0cnVtZW50ZXIiLCJpbnN0cnVtZW50U3luYyIsIm1pbWVUeXBlIiwiZ2V0Q29tcGlsZXJWZXJzaW9uIiwidmVyc2lvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBQUE7Ozs7QUFDQTs7OztBQUVBLE1BQU1BLFlBQVksQ0FBQyxVQUFELEVBQWEsd0JBQWIsQ0FBbEI7QUFDQSxJQUFJQyxRQUFRLElBQVo7QUFDQSxJQUFJQyxXQUFXLElBQWY7O0FBRWUsTUFBTUMsYUFBTiwwQ0FBK0M7QUFDNURDLGdCQUFjO0FB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J3BhdGgnO1xuaW1wb3J0IHtTaW1wbGVDb21waWxlckJhc2V9IGZyb20gJy4uL2NvbXBpbGVyLWJhc2UnO1xuXG5jb25zdCBtaW1lVHlwZXMgPSBbJ3RleHQvanN4JywgJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnXTtcbmxldCBiYWJlbCA9IG51bGw7XG5sZXQgaXN0YW5idWwgPSBudWxsO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCYWJlbENvbXBpbGVyIGV4dGVuZHMgU2ltcGxlQ29tcGlsZXJCYXNlIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRJbnB1dE1pbWVUeXBlcygpIHtcbiAgICByZXR1cm4gbWltZVR5cGVzO1xuICB9XG5cbiAgLy8gTkI6IFRoaXMgbWV0aG9kIGV4aXN0cyB0byBzdG9wIEJhYmVsIGZyb20gdHJ5aW5nIHRvIGxvYWQgcGx1Z2lucyBmcm9tIHRoZVxuICAvLyBhcHAncyBub2RlX21vZHVsZXMgZGlyZWN0b3J5LCB3aGljaCBpbiBhIHByb2R1Y3Rpb24gYXBwIGRvZXNuJ3QgaGF2ZSBCYWJlbFxuICAvLyBpbnN0YWxsZWQgaW4gaXQuIEluc3RlYWQsIHdlIHRyeSB0byBsb2FkIGZyb20gb3VyIGVudHJ5IHBvaW50J3Mgbm9kZV9tb2R1bGVzXG4gIC8vIGRpcmVjdG9yeSAoaS5lLiBHcnVudCBwZXJoYXBzKSwgYW5kIGlmIGl0IGRvZXNuJ3Qgd29yaywganVzdCBrZWVwIGdvaW5nLlxuICBhdHRlbXB0VG9QcmVsb2FkKG5hbWVzLCBwcmVmaXgpIHtcbiAgICBpZiAoIW5hbWVzLmxlbmd0aCkgcmV0dXJuIG51bGxcblxuICAgIGNvbnN0IGZpeHVwTW9kdWxlID0gKGV4cCkgPT4ge1xuICAgICAgLy8gTkI6IFNvbWUgcGx1Z2lucyBsaWtlIHRyYW5zZm9ybS1kZWNvcmF0b3JzLWxlZ2FjeSwgdXNlIGltcG9ydC9leHBvcnRcbiAgICAgIC8vIHNlbWFudGljcywgYW5kIG90aGVycyBkb24ndFxuICAgICAgaWYgKCdkZWZhdWx0JyBpbiBleHApIHJldHVybiBleHBbJ2RlZmF1bHQnXTtcbiAgICAgIHJldHVybiBleHA7XG4gICAgfTtcblxuICAgIGNvbnN0IG5vZGVNb2R1bGVzQWJvdmVVcyA9IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLicsICcuLicsICcuLicpO1xuXG4gICAgY29uc3QgcHJlbG9hZFN0cmF0ZWdpZXMgPSBbXG4gICAgICB4ID0+IGZpeHVwTW9kdWxlKHJlcXVpcmUubWFpbi5yZXF1aXJlKHgpKSxcbiAgICAgIHggPT4gZml4dXBNb2R1bGUocmVxdWlyZShwYXRoLmpvaW4obm9kZU1vZHVsZXNBYm92ZVVzLCB4KSkpLFxuICAgICAgeCA9PiBmaXh1cE1vZHVsZShyZXF1aXJlKHgpKVxuICAgIF1cblxuICAgIGNvbnN0IHBvc3NpYmxlTmFtZXMgPSAobmFtZSkgPT4ge1xuICAgICAgbGV0IG5hbWVzID0gW2BiYWJlbC0ke3ByZWZpeH0tJHtuYW1lfWBdO1xuXG4gICAgICBpZiAocHJlZml4ID09PSAncGx1Z2luJykge1xuICAgICAgICAvLyBMb29rIGZvciBtb2R1bGUgbmFtZXMgdGhhdCBkbyBub3Qgc3RhcnQgd2l0aCBcImJhYmVsLXBsdWdpbi1cIlxuICAgICAgICBuYW1lcy5wdXNoKG5hbWUpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmFtZXM7XG4gICAgfTtcblxuICAgIC8vIEFwcGx5IG9uZSBwcmVsb2FkaW5nIHN0cmF0ZWd5IHRvIHRoZSBwb3NzaWJsZSBuYW1lcyBvZiBhIG1vZHVsZSwgYW5kIHJldHVybiB0aGUgcHJlbG9hZGVkXG4gICAgLy8gbW9kdWxlIGlmIGZvdW5kLCBudWxsIG90aGVyd2lzZVxuICAgIGNvbnN0IHByZWxvYWRQb3NzaWJsZU5hbWVzID0gKG5hbWUsIHN0cmF0ZWd5KSA9PiB7XG4gICAgICBpZiAodHlwZW9mIHN0cmF0ZWd5ICE9PSAnZnVuY3Rpb24nKSByZXR1cm4gbnVsbDtcblxuICAgICAgcmV0dXJuIHBvc3NpYmxlTmFtZXMobmFtZSkucmVkdWNlKChtb2QsIHBvc3NpYmxlTmFtZSk9PntcbiAgICAgICAgaWYgKG1vZCAhPT0gbnVsbCkgcmV0dXJuIG1vZDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiBzdHJhdGVneShwb3NzaWJsZU5hbWUpO1xuICAgICAgICB9IGNhdGNoKGUpIHt9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9LCBudWxsKVxuICAgIH1cblxuICAgIC8vIFBpY2sgYSBsb2FkaW5nIHN0cmF0ZWd5IHRoYXQgZmluZHMgdGhlIGZpcnN0IHBsdWdpbiwgdGhlIHNhbWUgc3RyYXRlZ3kgd2lsbCBiZVxuICAgIC8vIHVzZWQgdG8gcHJlbG9hZCBhbGwgcGx1Z2luc1xuICAgIGNvbnN0IHNlbGVjdGVkU3RyYXRlZ3kgPSBwcmVsb2FkU3RyYXRlZ2llcy5yZWR1Y2UoKHdpbm5lciwgc3RyYXRlZ3kpPT57XG4gICAgICBpZiAod2lubmVyICE9PSBudWxsKSByZXR1cm4gd2lubmVyO1xuICAgICAgcmV0dXJuIHByZWxvYWRQb3NzaWJsZU5hbWVzKG5hbWVzWzBdLCBzdHJhdGVneSkgPT09IG51bGwgPyBudWxsIDogc3RyYXRlZ3k7XG4gICAgfSwgbnVsbClcblxuICAgIHJldHVybiBuYW1lcy5tYXAobmFtZSA9PiBwcmVsb2FkUG9zc2libGVOYW1lcyhuYW1lLCBzZWxlY3RlZFN0cmF0ZWd5KSkuZmlsdGVyKChtb2QpID0+IG1vZCAhPT0gbnVsbClcbiAgfVxuXG4gIGNvbXBpbGVTeW5jKHNvdXJjZUNvZGUsIGZpbGVQYXRoLCBjb21waWxlckNvbnRleHQpIHtcbiAgICBiYWJlbCA9IGJhYmVsIHx8IHJlcXVpcmUoJ2JhYmVsLWNvcmUnKTtcblxuICAgIGxldCBvcHRzID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5jb21waWxlck9wdGlvbnMsIHtcbiAgICAgIGZpbGVuYW1lOiBmaWxlUGF0aCxcbiAgICAgIGFzdDogZmFsc2UsXG4gICAgICBiYWJlbHJjOiBmYWxzZVxuICAgIH0pO1xuXG4gICAgbGV0IHVzZUNvdmVyYWdlID0gZmFsc2U7XG4gICAgaWYgKCdjb3ZlcmFnZScgaW4gb3B0cykge1xuICAgICAgdXNlQ292ZXJhZ2UgPSAhIW9wdHMuY292ZXJhZ2U7XG4gICAgICBkZWxldGUgb3B0cy5jb3ZlcmFnZTtcbiAgICB9XG5cbiAgICBpZiAoJ3BsdWdpbnMnIGluIG9wdHMpIHtcbiAgICAgIGxldCBwbHVnaW5zID0gdGhpcy5hdHRlbXB0VG9QcmVsb2FkKG9wdHMucGx1Z2lucywgJ3BsdWdpbicpO1xuICAgICAgaWYgKHBsdWdpbnMgJiYgcGx1Z2lucy5sZW5ndGggPT09IG9wdHMucGx1Z2lucy5sZW5ndGgpIG9wdHMucGx1Z2lucyA9IHBsdWdpbnM7XG4gICAgfVxuXG4gICAgaWYgKCdwcmVzZXRzJyBpbiBvcHRzKSB7XG4gICAgICBsZXQgcHJlc2V0cyA9IHRoaXMuYXR0ZW1wdFRvUHJlbG9hZChvcHRzLnByZXNldHMsICdwcmVzZXQnKTtcbiAgICAgIGlmIChwcmVzZXRzICYmIHByZXNldHMubGVuZ3RoID09PSBvcHRzLnByZXNldHMubGVuZ3RoKSBvcHRzLnByZXNldHMgPSBwcmVzZXRzO1xuICAgIH1cblxuICAgIGNvbnN0IG91dHB1dCA9IGJhYmVsLnRyYW5zZm9ybShzb3VyY2VDb2RlLCBvcHRzKTtcbiAgICBsZXQgc291cmNlTWFwcyA9IG91dHB1dC5tYXAgPyBKU09OLnN0cmluZ2lmeShvdXRwdXQubWFwKSA6IG51bGw7XG5cbiAgICBsZXQgY29kZSA9IG91dHB1dC5jb2RlO1xuICAgIGlmICh1c2VDb3ZlcmFnZSkge1xuICAgICAgaXN0YW5idWwgPSBpc3RhbmJ1bCB8fCByZXF1aXJlKCdpc3RhbmJ1bCcpO1xuXG4gICAgICBzb3VyY2VNYXBzID0gbnVsbDtcbiAgICAgIGNvZGUgPSAobmV3IGlzdGFuYnVsLkluc3RydW1lbnRlcigpKS5pbnN0cnVtZW50U3luYyhvdXRwdXQuY29kZSwgZmlsZVBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiB7IGNvZGUsIHNvdXJjZU1hcHMsIG1pbWVUeXBlOiAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsIH07XG4gIH1cblxuICBnZXRDb21waWxlclZlcnNpb24oKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJ2JhYmVsLWNvcmUvcGFja2FnZS5qc29uJykudmVyc2lvbjtcbiAgfVxufVxuIl19