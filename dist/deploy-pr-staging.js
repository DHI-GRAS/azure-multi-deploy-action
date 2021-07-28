"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const child_process_promise_1 = require("child-process-promise");
const getChangedPackages_1 = __importDefault(require("./functions/getChangedPackages"));
const deployWebToStaging_1 = __importDefault(require("./functions/deployWebToStaging"));
const deployFuncToStaging_1 = __importDefault(require("./functions/deployFuncToStaging"));
const msgFile = path_1.join(__dirname, 'github_message.txt');
const deployToStag = async (prNumber) => {
    const changedPackages = await getChangedPackages_1.default();
    const webPackages = changedPackages.filter((pkg) => pkg.type === 'app');
    const funcPackages = changedPackages.filter((pkg) => pkg.type === 'func-api');
    if (webPackages.length + funcPackages.length === 0) {
        const deployMsg = `ℹ️ No changed packages were detected`;
        console.log(deployMsg);
        await child_process_promise_1.exec(`echo "${deployMsg} <br />" >> ${msgFile}`);
    }
    for (const webApp of webPackages)
        await deployWebToStaging_1.default(webApp, prNumber);
    for (const funcApp of funcPackages)
        await deployFuncToStaging_1.default(funcApp, prNumber);
};
exports.default = deployToStag;
