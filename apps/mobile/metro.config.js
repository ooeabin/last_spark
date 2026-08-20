const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * pnpm 모노레포 대응 (기획서 9.1 스택과 무관한 순수 빌드 설정).
 *
 * pnpm은 node_modules를 심볼릭 링크로 구성해서(.pnpm 스토어를 가리킴)
 * 디스크/설치 속도 면에서 유리하지만, Metro(RN 번들러)는 기본적으로
 * 심볼릭 링크를 따라가지 않는다. 아래 3줄이 없으면 pnpm으로 설치했을 때
 * "Unable to resolve module" 에러가 난다. Expo SDK 50+ 부터 지원되는 옵션.
 */
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
