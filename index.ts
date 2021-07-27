import core from '@actions/core'
import github from '@actions/github'
import { PushEvent } from '@octokit/webhooks-definitions/schema'

const { context } = github
console.log(context)
