"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const path_1 = __importDefault(require("path"));
const mdLinebreak = '<br/>';
const msgFile = path_1.default.join('github_message.txt');
exports.default = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error('PR number is undefined');
        const slotName = pullNumber;
        const stagName = `${pkg.id}stag`;
        console.log(`Building webapp: ${pkg.name}`);
        const { stdout, stderr } = await child_process_promise_1.exec(`cd ${pkg.path} && STAG_SLOT=${slotName} yarn ${pkg.name}:build`);
        if (stderr)
            console.log(stderr);
        console.log(stdout);
        console.log(`Build finished, uploading webapp: ${pkg.name}`);
        await child_process_promise_1.exec('az extension add --name storage-preview').catch();
        const { stdout: uploadOut } = await child_process_promise_1.exec(`cd ${pkg.path}/dist/ && az storage azcopy blob upload --container \\$web --account-name ${stagName} --source ./\\* --destination ${slotName} --auth-mode key`).catch((err) => {
            throw Error(err);
        });
        console.log(uploadOut);
        // Don't think the deployment url gets returned from upload - hopefully this stays static?
        const deployMsg = `✅ Deployed web app **${pkg.name}** on: https://${stagName}.z16.web.core.windows.net/${slotName} ${mdLinebreak}`;
        await child_process_promise_1.exec(`echo "${deployMsg}" >> ${msgFile}`);
        console.log(deployMsg);
    }
    catch (err) {
        const deployMsg = `❌ Deployment of web app **${pkg.id}** failed. See CI output for details ${mdLinebreak}`;
        await child_process_promise_1.exec(`echo "${deployMsg}" >> ${msgFile}`);
        console.log(err);
    }
};
