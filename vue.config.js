const { defineConfig } = require('@vue/cli-service');
module.exports = defineConfig({
  transpileDependencies: true,
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        // This build is a preview of the table item, and is meant to be
        // installed side by side with the official Section Editor.
        appId: 'com.thinreports.section-editor.table-preview',
        productName: 'Thinreports Editor table preview',
        publish: null,
        mac: {
          artifactName: '${productName}-${version}-darwin.${ext}',
          category: 'public.app-category.developer-tools',
          darkModeSupport: false,
          icon: 'build/icon.icns'
        },
        linux: {
          artifactName: '${productName}-${version}-linux.${ext}',
          category: 'Development',
          target: 'AppImage'
        },
        win: {
          artifactName: 'thinreports-section-editor-table-preview-${version}-win32.${ext}',
          icon: 'build/icon.ico'
        }
      },
      // This setting is for a workaround for the problem that assets like font file are not being loaded.
      // https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/1647
      customFileProtocol: './',
      preload: 'src/preload.ts'
    },
    i18n: {
      locale: 'en',
      fallbackLocale: 'ja',
      localeDir: 'locales',
      enableInSFC: false
    }
  }
});
