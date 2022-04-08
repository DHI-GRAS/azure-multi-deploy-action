"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const deploy_web_to_staging_1 = __importDefault(require("./functions/deploy-web-to-staging"));
const deploy_func_to_staging_1 = __importDefault(require("./functions/deploy-func-to-staging"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
chalk_1.default.level = 1;
const createMissingResources = async (localConfig, subsId, prNumber) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for PR deployment...`);
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subsId}`);
    console.log(`${chalk_1.default.bold.green('Success')}: subscription set to ${chalk_1.default.bold(subsId)}`);
    const webPackages = localConfig.filter((pkg) => pkg.type === 'app');
    const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api');
    if (webPackages.length + funcPackages.length === 0) {
        const deployMsg = `${chalk_1.default.bold.yellow('Warning')}: No changed packages were detected`;
        console.log(deployMsg);
        const msgFile = path_1.default.join('github_message.txt');
        fs_1.default.appendFileSync(msgFile, `\n${deployMsg}  `);
    }
    for (const webApp of webPackages)
        await (0, deploy_web_to_staging_1.default)(webApp, prNumber);
    for (const funcApp of funcPackages)
        await (0, deploy_func_to_staging_1.default)(funcApp, prNumber);
    console.log(`${chalk_1.default.bold.green('Success')}: Completed for subscriptionID ${chalk_1.default.bold(subsId)}`);
};
const deployToStag = async (prNumber) => {
    const changedPackages = await (0, get_changed_packages_1.default)();
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(changedPackages);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        await createMissingResources(azureResourcesBySubId[subsId], subsId, prNumber);
    }
};
exports.default = deployToStag;
