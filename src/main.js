import _ from 'lodash';

const filenames = [
  'css/less',
  'css/sass',
  'css/scss',
  'js/babel',
  'js/coffeescript',
  'js/typescript',
  'html/inline-html',
  'html/jade',
  'passthrough'
];

module.exports = _.map(filenames, (x) => require('./' + x).default);
