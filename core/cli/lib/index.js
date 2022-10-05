'use strict'

module.exports = core

let args
const colors = require('colors/safe')
const constants = require('./constants')
const commander = require('commander')
const log = require('@rev-cli/log')
const os = require('os')
const path = require('path')
const pathExists = require('path-exists').sync
const pkg = require('../package.json')
const semver = require('semver')
const userHome = require('user-home')

const program = new commander.Command()

async function core() {
  try {
    checkNodeVersion()
    checkPkgVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs()
    checkEnv()
    await checkGlobalUpdate()
    registerCommand()
  } catch (err) {
    console.log(err.message)
  }
}

/* 检查cli版本 */
function checkPkgVersion() {
  log.info('cli', pkg.version)
}

/* 检查node版本 */
function checkNodeVersion() {
  // 第一步：获取当前node版本号
  const currentVersion = process.version
  // 第二步：对比最低版本号
  const lowestVersion = constants.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(
      colors.red(`rev-cli 需要安装 v${lowestVersion} 以上版本的 node.js`)
    )
  }
}

/* 检查root账号 */
function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()
  /*   console.log(os.userInfo()) */
}

/* 检查用户主目录 */
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前登录的用户主目录不存在!'))
  }
}

/* 检查入参 */
function checkInputArgs() {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}

/* 日志等级赋值 */
function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

/* 检查环境变量 */
function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath
    })
  }
  cerateDefaultConfig()
  log.verbose('环境变量', process.env.CLI_HOME_PATH)
}

/* 创建config配置 */
function cerateDefaultConfig() {
  const cliConfig = {
    Home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['Home'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['Home'] = path.join(userHome, constants.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.Home
}

/* 检查版本更新 */
async function checkGlobalUpdate() {
  // 1.获取当前版本号和模块名
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 2.调用npm API,获取所有版本号
  const { getNpmSemverVersions } = require('@rev-cli/get-npm-info')
  const lastVersions = await getNpmSemverVersions(currentVersion, npmName)
  // 3.提取所有版本号，对比大于当前版本号
  if (lastVersions && semver.gt(lastVersions, currentVersion)) {
    // 4.获取最新的版本号，提示用户更新到该版本
    log.warn(
      colors.yellow(`请手动更新${npmName},当前版本：${currentVersion},最新版本：${lastVersions}
    更新命令：npm install -g ${npmName}`)
    )
  }
  console.log('最新版本号', lastVersions)
}

/* 注册命令 */
function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d,--debug', '是否开启调试模式', false)

  program.on('option:debug', function () {
    if (program.debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('test')
  })

  program.parse(process.argv)
}
