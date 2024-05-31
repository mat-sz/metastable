/* eslint-disable */

const globalIgnore = [
  '!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}',
  '!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}',
  '!**/node_modules/.bin',
  '!**/node_modules/**/*.map',
  '!**/node_modules/@metastable/metastable/python_kohya',
  '!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}',
  '!.editorconfig',
  '!**/._*',
  '!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}',
  '!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}',
  '!**/{appveyor.yml,.travis.yml,circle.yml}',
  '!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}',
  '!**/node_modules/@metastable/cppzst/bin/**/*.node',
];

const globalFiles = ['dist', 'dist-electron', ...globalIgnore];

const config = {
  appId: 'studio.metastable.main',
  asar: true,
  electronLanguages: ['en', 'en-US', 'en_US'],
  electronVersion: '30.0.1',
  nativeRebuilder: 'parallel',
  productName: 'Metastable',
  directories: {
    output: '../../release/${version}',
  },
  extraFiles: [
    {
      from: '../metastable/python',
      to: 'python',
      filter: ['**/*', '!**/__pycache__'],
    },
  ],
  publish: {
    provider: 'generic',
    url: 'https://api.metastable.studio/electron/update',
  },

  // Windows
  win: {
    target: {
      target: 'nsis',
      arch: ['x64'],
    },
    artifactName: '${productName}-win32-${arch}-${version}.${ext}',
    asarUnpack: [
      '**/node_modules/sharp/**/*',
      '**/node_modules/@img/*-win32-*/**/*',
    ],
    files: [
      ...globalFiles,
      '!**/node_modules/@img/*-{darwin,linux}-*/**/*',
      '!**/node_modules/@img/*-arm64/**/*',
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },

  // macOS
  mac: {
    target: {
      target: 'dmg',
      arch: ['universal'],
    },
    artifactName: '${productName}-darwin-${arch}-${version}.${ext}',
    category: 'public.app-category.graphics-design',
    asarUnpack: [
      '**/node_modules/sharp/**/*',
      '**/node_modules/@img/*-darwin-*/**/*',
    ],
    files: [...globalFiles, '!**/node_modules/@img/*-{win32,linux}-*/**/*'],
  },

  // Linux
  linux: {
    target: {
      target: 'AppImage',
      arch: ['x64'],
    },
    artifactName: '${productName}-linux-${arch}-${version}.${ext}',
    category: 'Graphics',
    asarUnpack: [
      '**/node_modules/sharp/**/*',
      '**/node_modules/@img/*-linux-*/**/*',
    ],
    files: [
      ...globalFiles,
      '!**/node_modules/@img/*-{win32,darwin}-*/**/*',
      '!**/node_modules/@img/*-arm64/**/*',
    ],
  },
};

module.exports = config;
