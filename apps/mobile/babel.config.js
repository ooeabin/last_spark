module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo(SDK 54)가 reanimated/worklets 플러그인을 자동으로 넣는다.
    // 여기에 직접 또 등록하면 같은 플러그인이 두 번 적용된다.
    presets: ["babel-preset-expo"],
  };
};
