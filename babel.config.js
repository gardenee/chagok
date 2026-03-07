module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.BABEL_ENV === 'test' || process.env.NODE_ENV === 'test';
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['module-resolver', { alias: { '@': './' } }],
      ...(isTest ? [] : ['react-native-reanimated/plugin']),
    ],
  };
};
