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
const child_process_promise_1 = require("child-process-promise");
const github = __importStar(require("@actions/github"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const msgFile = path_1.default.join('github_message.txt');
const commitSha = github.context.sha.substr(0, 7);
exports.default = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error('PR number is undefined');
        const slotName = pullNumber;
        const stagName = `${pkg.id}stag`;
        console.log(`Building webapp: ${pkg.name}`);
        const { stdout, stderr } = await (0, child_process_promise_1.exec)(`cd ${pkg.path} && STAG_SLOT=${slotName} COMMIT_SHA=${commitSha} yarn ${pkg.name}:build`);
        if (stderr)
            console.log(stderr, stdout);
        console.log(`Build finished, uploading webapp: ${pkg.name}`);
        await (0, child_process_promise_1.exec)('az extension add --name storage-preview').catch();
        const { stdout: uploadOut, stderr: uploadErr } = await (0, child_process_promise_1.exec)(`cd ${pkg.path}/dist/ && az storage azcopy blob upload 'https://${stagName}.blob.core.windows.net/$web/${slotName}' --recursive --container \\$web --account-name ${stagName} --source ./\\* --destination ${slotName} --auth-mode key`).catch((err) => {
            throw Error(err);
        });
        if (stdout)
            console.log(uploadOut, uploadErr);
        // Don't think the deployment url gets returned from upload - hopefully this stays static?
        const deployMsg = `\n✅ Deployed web app **${pkg.name}** on: https://${stagName}.z16.web.core.windows.net/${slotName}  `;
        fs_1.default.appendFileSync(msgFile, deployMsg);
        console.log(deployMsg);
    }
    catch (err) {
        const deployMsg = `\n❌ Deployment of web app **${pkg.id}** failed. See CI output for details  `;
        fs_1.default.appendFileSync(msgFile, deployMsg);
        console.log(deployMsg, err);
    }
};
