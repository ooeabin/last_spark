module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // react-native-reanimated 플러그인은 반드시 plugins 배열의 마지막에 위치해야 함
      "react-native-reanimated/plugin",
    ],
  };
};
