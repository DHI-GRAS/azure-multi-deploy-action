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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
// import * as core from '@actions/core'
const github = __importStar(require("@actions/github"));
const child_process_1 = require("child_process");
const deploy_pr_staging_1 = __importDefault(require("./deploy-pr-staging"));
const deploy_main_1 = __importDefault(require("./deploy-main"));
const pr_close_cleanup_1 = __importDefault(require("./pr-close-cleanup"));
const create_services_1 = __importDefault(require("./create-services"));
const { context } = github;
const { payload } = context;
const branch = (_a = payload.pull_request) === null || _a === void 0 ? void 0 : _a.head.ref;
const defaultBranch = (_b = payload.repository) === null || _b === void 0 ? void 0 : _b.default_branch;
const isPR = context.eventName === 'pull_request';
const prNumber = (_d = (_c = payload.pull_request) === null || _c === void 0 ? void 0 : _c.number) !== null && _d !== void 0 ? _d : 0;
console.log(branch, defaultBranch, context.eventName, payload.action);
const run = async () => {
    var _a;
    child_process_1.exec('ls', (err, out) => {
        console.log(err, out);
    });
    await create_services_1.default();
    if (isPR &&
        payload.action === 'synchronize' &&
        ((_a = payload.pull_request) === null || _a === void 0 ? void 0 : _a.state) === 'open') {
        console.log('Deploying to staging');
        void deploy_pr_staging_1.default(prNumber);
    }
    if (branch === defaultBranch) {
        console.log('Deploying to production');
        void deploy_main_1.default();
    }
    if (payload.action === 'close' && isPR) {
        console.log('PR closed. Cleaning up deployments');
        pr_close_cleanup_1.default(prNumber);
    }
};
void run();
