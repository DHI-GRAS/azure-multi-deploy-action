"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
chalk_1.default.level = 1;
const removeWebStagingDeployment = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error('No PR number');
        const stagName = `${pkg.id}stag${pullNumber}`;
        await (0, child_process_promise_1.exec)('az extension add --name storage-preview').catch();
        await (0, child_process_promise_1.exec)(`az storage account delete -n ${pkg.id}stag${pullNumber} -g ${pkg.resourceGroup}`);
        console.log(`${chalk_1.default.bold.green('Success')}: Deleted web app: ${chalk_1.default.bold(`${stagName}`)}`);
    }
    catch (err) {
        throw Error(err);
    }
};
const removeFuncAppStagingDeployment = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error(`${chalk_1.default.bold.red('Error')}: No PR number`);
        const slotName = `stag-${pullNumber}`;
        const { stdout: deleteOut, stderr: deleteErr } = await (0, child_process_promise_1.exec)(`az functionapp deployment slot delete -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`);
        if (deleteErr)
            console.log(deleteOut, deleteErr);
        console.log(`${chalk_1.default.bold.green('Success')}: Deleted function app: ${chalk_1.default.bold(`${pkg.id}-${slotName}`)}`);
    }
    catch (err) {
        throw Error(err);
    }
};
const removeResources = async (localConfig, subsId, prNumber) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for creating services...`);
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subsId}`);
    console.log(`${chalk_1.default.bold.green('Success')}: Subscription set to ${chalk_1.default.bold(subsId)}`);
    const webPackages = localConfig.filter((pkg) => pkg.type === 'app');
    const funcPackages = localConfig.filter((pkg) => pkg.type === 'func-api');
    for (const pkg of webPackages) {
        await removeWebStagingDeployment(pkg, prNumber);
    }
    for (const pkg of funcPackages) {
        await removeFuncAppStagingDeployment(pkg, prNumber);
    }
};
const cleanDeployments = async (prNumber) => {
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(get_packages_1.default);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        await removeResources(azureResourcesBySubId[subsId], subsId, prNumber);
    }
};
exports.default = cleanDeployments;
