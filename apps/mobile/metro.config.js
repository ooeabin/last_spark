const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

/**
 * pnpm 모노레포 대응 (기획서 9.1 스택과 무관한 순수 빌드 설정).
 *
 * pnpm은 워크스페이스 패키지(@last-spark/shared)와 의존성을 루트 node_modules에
 * 심볼릭 링크로 구성한다. Metro가 프로젝트 폴더 밖의 이 경로들을 찾을 수 있도록
 * 워크스페이스 루트를 감시 대상과 모듈 탐색 경로에 추가한다 — 이게 없으면
 * pnpm으로 설치했을 때 "Unable to resolve module" 에러가 난다.
 * (심볼릭 링크 추적 자체는 현재 Metro 기본값이라 별도 플래그가 필요 없다.)
 */
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

module.exports = config;
