const app = require('./build')
module.exports = (api, options) => {
  api.registerCommand(
    'go:watch',
    {
      description: 'watch go code',
      usage: 'vue-cli-service go:watch'
    },
    async (args, rawArgs) => {
      await app.watch(api, options, args['w'])
    }
  )
  api.registerCommand(
    'go:build',
    {
      description: 'build go code',
      usage: 'vue-cli-service go:build'
    },
    (args, rawArgs) => {
      app.build(api, options)
    }
  )
}
