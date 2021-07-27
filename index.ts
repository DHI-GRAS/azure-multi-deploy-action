import * as core from '@actions/core'
import * as github from '@actions/github'
import { PushEvent } from '@octokit/webhooks-definitions/schema'

const context = github?.context
console.log(context)
