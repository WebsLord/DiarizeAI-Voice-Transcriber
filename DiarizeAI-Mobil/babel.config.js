module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Eğer bu satır yoksa ekle:
      'react-native-reanimated/plugin',
    ],
  };
};