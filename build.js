const { default: Watcher, Op } = require('@akumzy/fs-watcher'),
  path = require('path'),
  snakeCae = require('lodash/snakeCase'),
  { execSync } = require('child_process'),
  { done, logWithSpinner, error, stopSpinner } = require('@vue/cli-shared-utils'),
  fs = require('fs')

async function main(api, options, watchMode = false) {
  const rootDir = api.resolve('.')
  const goPath = api.resolve('./golang')
  const { name } = require(api.resolve('./package.json'))
  // Initial build
  build()
  if (watchMode) {
    const w = new Watcher({
      path: goPath,
      filters: [Op.Create, Op.Move, Op.Remove, Op.Rename, Op.Write],
      recursive: true
    })
    await w.start()
    // watch directory
    w.onAll((_, f) => {
      build(f)
    })
    w.onError(err => {
      error(err)
      process.exit(1)
    })
  }
  function build() {
    logWithSpinner('Building go...')
    let binPath = path.join(rootDir, 'bin')
    if (!fs.existsSync(path.join(rootDir, 'bin'))) {
      fs.mkdirSync(binPath)
    }
    execSync(`cd ${goPath} && go build -o "${path.join(binPath, snakeCae(name))}" ${goPath}`)
    done('Build complete!')
    stopSpinner(false)
    if (!watchMode) {
      process.exit(0)
    }
  }
}

module.exports = main
