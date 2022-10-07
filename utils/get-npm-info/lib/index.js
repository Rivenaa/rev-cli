'use strict'

const axios = require('axios')
const urlJoin = require('url-join')
const semver = require('semver')

module.exports = { getNpmSemverVersions }

function getNpmInfo(npmName, registry) {
  if (!npmName) return null
  const registryUrl = registry || getDefaultRegistry()
  const npmInfoUrl = urlJoin(registryUrl, npmName)
  /*  console.log(npmInfoUrl) */
  return axios
    .get(npmInfoUrl)
    .then(res => {
      if (res.status === 200) {
        return res.data
      } else {
        return null
      }
    })
    .catch(err => {
      return Promise.reject(err)
    })
}

function getDefaultRegistry(isOriginal = false) {
  return isOriginal
    ? 'https://registry.npmjs.org/'
    : 'https://registry.npm.taobao.org/'
}

async function getNpmVersions(npmName, registry) {
  const data = await getNpmInfo(npmName, registry)
  if (data) {
    return Object.keys(data.versions)
  } else {
    return []
  }
}

function getSemverVersions(baseVersion, versions) {
  return versions
    .filter(version => semver.satisfies(version, `${baseVersion}`))
    .sort((a, b) => semver.gt(b, a))
}

async function getNpmSemverVersions(baseVersion, npmName, registry) {
  const versions = await getNpmVersions(npmName, registry)
  const newVersion = getSemverVersions(baseVersion, versions)
  if (newVersion?.length > 0) {
    return newVersion[0]
  }
}
