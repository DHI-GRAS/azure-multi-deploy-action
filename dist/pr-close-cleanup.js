"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
const removeWebStagingDeployment = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error('No PR number');
        const slotName = pullNumber;
        const stagName = `${pkg.id}stag`;
        await (0, child_process_promise_1.exec)('az extension add --name storage-preview').catch();
        await (0, child_process_promise_1.exec)(`az storage blob directory delete --account-name ${pkg.id}stag --container-name \\$web --directory-path ${slotName} --auth-mode key --recursive`);
        console.log(`Deleted web app: ${stagName}-${slotName}`);
    }
    catch (err) {
        throw Error(err);
    }
};
const removeFuncAppStagingDeployment = async (pkg, pullNumber) => {
    try {
        if (!pullNumber)
            throw Error('No PR number');
        const slotName = `stag-${pullNumber}`;
        const { stdout: deleteOut, stderr: deleteErr } = await (0, child_process_promise_1.exec)(`az functionapp deployment slot delete -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`);
        if (deleteErr)
            console.log(deleteOut, deleteErr);
        console.log(`Deleted function app: ${pkg.id}-${slotName}`);
    }
    catch (err) {
        throw Error(err);
    }
};
const removeResources = async (localConfig, subsId, prNumber) => {
    console.log('\nSetting the subscription for creating services...');
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subsId}`);
    console.log(`subscription set to ${subsId}`);
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
