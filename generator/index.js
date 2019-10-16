const { execSync } = require('child_process'),
  fs = require('fs'),
  _ = require('lodash'),
  { warn, log } = require('@vue/cli-shared-utils')
util = require('util')


module.exports = (api, option, rootOption) => {
  // Create Golang boilerplate
  api.render('./template')
  // Go project directory
  const goPath = api.resolve('./golang'),
    vueConfigPath = api.resolve('./vue.config.js'),
    projectName = _.snakeCase(rootOption.projectName),
    devBinPath = `./bin/${projectName}` + (process.platform === 'win32' ? '.exe' : '')

  api.onCreateComplete(() => {
    // initiate Go module and install all packages
    if (fs.existsSync(api.resolve('./golang/main.go')) && !fs.existsSync(api.resolve('./golang/go.mod'))) {
      execSync(`cd ${goPath} && go mod init ${rootOption.projectName}/golang && go get -u ./...`)
    }
    // Update .gitignore if exists
    if (fs.existsSync(api.resolve('./.gitignore'))) {
      let gitignore = fs.readFileSync(api.resolve('./.gitignore'), 'utf8')
      if (!gitignore.match(/(#Electron-Go bin|\/bin)/)) {
        //   Add /bin to gitignore if it doesn't exist already
        gitignore = gitignore + '\n#Electron-Go output\n/bin'
        fs.writeFileSync(api.resolve('./.gitignore'), gitignore)
      }
    }

    //
    const objPath = 'pluginOptions.electronBuilder.mainProcessWatch'
    //
    const writeConfig = (config, tem = false) => {
      if (!config) {
        config = {}
        config = _.set(config, objPath, [devBinPath])
      }
      // Register binaries as extra resources so that electron builder will bundle it as well
      const bins = {
        'pluginOptions.electronBuilder.builderOptions.mac.extraResources': `bin/darwin/${projectName}_\${arch}`,
        'pluginOptions.electronBuilder.builderOptions.linux.extraResources': `bin/linux/${projectName}_\${arch}`,
        'pluginOptions.electronBuilder.builderOptions.win.extraResources': `bin/windows/${projectName}_\${arch}.exe`
      }
      for (const key in bins) {
        if (_.hasIn(config, key)) {
          let val = _.get(config, key)
          if (!val.includes(bins[key])) {
            config = _.set(config, key, [...val, bins[key]])
          }
        } else {
          config = _.set(config, key, [bins[key]])
        }
      }
      let code = util.inspect(config, { depth: Infinity })
      code = code.replace(/Function:\s/gi, '')
      // Write the new config
      fs.writeFileSync(tem ? api.resolve('./vue.config.tem.js') : vueConfigPath, 'module.exports = ' + code, {
        encoding: 'utf-8'
      })
    }
    // Add config to vue-cli-electron-builder plugin array
    if (fs.existsSync(vueConfigPath)) {
      if (option.electronGo.overwrite) {
        let config = require(vueConfigPath)
        if (_.has(config, objPath)) {
          let paths = _.get(config, objPath) || []
          paths = typeof paths === 'string' ? [paths] : paths.includes(devBinPath) ? paths : [...paths, devBinPath]
          config = _.set(config, objPath, paths)
          writeConfig(config)
        } else {
          config = _.set(config, objPath, [devBinPath])
          writeConfig(config)
        }
      } else {
        writeConfig(null, true)
        log('\n')
        warn(
          `For electron-go to work please copy the generate config ${api.resolve(
            './vue.config.tem.js'
          )} and update your vue.config.js file accordingly.`
        )
      }
    } else {
      writeConfig()
    }
  })

  const dependencies = { 'ipc-node-go': '^0.2.0' }
  const devDependencies = { concurrently: '^5.0.0' }
  const scripts = {
    'go:build': 'vue-cli-service go:build',
    'electron:serve':
      'vue-cli-service go:build && concurrently -k -r "vue-cli-service go:build -w" "vue-cli-service electron:serve"',
    'electron:build': 'vue-cli-service go:build && vue-cli-service electron:build'
  }
  api.extendPackage({ scripts, dependencies, devDependencies })
}
let b = {
  'builderOptions.mac.extraResources': ['bin/darwin/fexdrive_${arch}'],
  'builderOptions.linux.extraResources': ['bin/linux/fexdrive_${arch}'],
  'builderOptions.win.extraResources': ['bin/windows/fexdrive_${arch}.exe']
}
