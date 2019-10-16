module.exports = [
  {
    name: 'electronGo.overwrite',
    type: 'confirm',
    message: 'Overwrite vue.config.js file if found?',
    when: () => {
      return true
    }
  }
]
