"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
const { context: { issue: { number }, repo: { repo, owner }, }, } = github;
const messageFile = 'github_message.txt';
exports.default = async (startTime) => {
    try {
        const token = core.getInput('githubToken', { required: true });
        const octokit = github.getOctokit(token);
        // Append run stats to comment file
        fs_1.default.appendFileSync(path_1.default.join(messageFile), '\n#### Stats');
        const endTime = new Date();
        const { minutes, seconds } = (0, date_fns_1.intervalToDuration)({
            start: startTime,
            end: endTime,
        });
        const durationMessage = `\n🕐 Took ${String(minutes)}m${String(seconds)}s`;
        console.log(durationMessage);
        const preventProdDeploy = core.getInput('preventProdDeploy');
        if (preventProdDeploy)
            fs_1.default.appendFileSync(messageFile, '\n⚠️ Code quality checks have failed - see CI for details. Production deployment may be skipped');
        fs_1.default.appendFileSync(path_1.default.join(messageFile), durationMessage);
        // Writing to text file was a workaround, could now be done better (eventually)
        const body = String(fs_1.default.readFileSync(path_1.default.join(messageFile)));
        await octokit.rest.issues.createComment({
            issue_number: number,
            repo,
            owner,
            body,
        });
    }
    catch (err) {
        throw Error(err);
    }
};
