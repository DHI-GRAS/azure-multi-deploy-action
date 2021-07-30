"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
const { context } = github;
const { payload } = context;
exports.default = async () => {
    var _a, _b, _c;
    const token = core.getInput('githubToken', { required: true });
    const octokit = github.getOctokit(token);
    const prNumber = (_a = payload.pull_request) === null || _a === void 0 ? void 0 : _a.number;
    const repo = (_b = payload.repository) === null || _b === void 0 ? void 0 : _b.full_name;
    const owner = (_c = payload.repository) === null || _c === void 0 ? void 0 : _c.owner.name;
    if (!prNumber || !repo || !owner)
        return;
    // Writing to text file was a workaround, could now be done better (eventually)
    const body = String(fs_1.default.readFileSync(path_1.default.join('github_message.txt')));
    await octokit.rest.issues.createComment({
        issue_number: prNumber,
        repo,
        owner,
        body,
    });
};
