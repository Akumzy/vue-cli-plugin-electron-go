const buildApp = require('./build')
module.exports = (api, options) => {
  api.registerCommand(
    'go:build',
    {
      description: 'build go code',
      usage: 'vue-cli-service go:build'
    },
    async (args, rawArgs) => {
      await buildApp(api, options, args['w'])
    }
  )
}
