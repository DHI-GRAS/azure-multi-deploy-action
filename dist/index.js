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
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const child_process_promise_1 = require("child-process-promise");
const deploy_pr_staging_1 = __importDefault(require("./deploy-pr-staging"));
const deploy_main_1 = __importDefault(require("./deploy-main"));
const pr_close_cleanup_1 = __importDefault(require("./pr-close-cleanup"));
const create_services_1 = __importDefault(require("./create-services"));
const az_login_1 = __importDefault(require("./functions/az-login"));
const post_comment_1 = __importDefault(require("./functions/post-comment"));
const { context } = github;
const { payload } = context;
const defaultBranch = (_a = payload.repository) === null || _a === void 0 ? void 0 : _a.default_branch;
const splitRef = context.ref.split('/');
// may not be correct in PRs
const currentBranch = splitRef[splitRef.length - 1];
const isPR = context.eventName === 'pull_request';
const prNumber = (_c = (_b = payload.pull_request) === null || _b === void 0 ? void 0 : _b.number) !== null && _c !== void 0 ? _c : 0;
const run = async () => {
    var _a, _b;
    const startTime = new Date();
    console.log('Installing azure CLI...');
    await (0, child_process_promise_1.exec)('curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash');
    // Use the below version in case specific version has to be installed
    // await exec(`
    // 	sudo apt-get update ;
    // 	sudo apt-get install ca-certificates curl apt-transport-https lsb-release gnupg ;
    // 	curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/microsoft.gpg > /dev/null ;
    // 	AZ_REPO=$(lsb_release -cs) ;
    // 	echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" | sudo tee /etc/apt/sources.list.d/azure-cli.list ;
    // 	sudo apt-get update ;
    // 	sudo apt-get install azure-cli=2.28.0-1~focal --allow-downgrades
    // `)
    await (0, az_login_1.default)();
    await (0, create_services_1.default)();
    // Deploy to stag
    if (isPR && ((_a = payload.pull_request) === null || _a === void 0 ? void 0 : _a.state) === 'open') {
        console.log('Deploying to staging...');
        await (0, deploy_pr_staging_1.default)(prNumber);
    }
    // Deploy to prod
    const preventProdDeploy = core.getInput('preventProdDeploy');
    if (preventProdDeploy && currentBranch === defaultBranch) {
        const errorMsg = 'Production deployment skipped! Code quality checks have failed';
        console.error(errorMsg);
        core.setFailed(errorMsg);
    }
    if (!payload.pull_request &&
        currentBranch === defaultBranch &&
        !preventProdDeploy) {
        console.log('Deploying to production...');
        await (0, deploy_main_1.default)();
    }
    if (isPR && ((_b = payload.pull_request) === null || _b === void 0 ? void 0 : _b.state) === 'closed') {
        console.log('PR closed. Cleaning up deployments...');
        (0, pr_close_cleanup_1.default)(prNumber);
    }
    if (isPR)
        await (0, post_comment_1.default)(startTime);
};
void run();
