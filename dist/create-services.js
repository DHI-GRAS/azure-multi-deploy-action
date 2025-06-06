"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const child_process_promise_1 = require("child-process-promise");
const create_function_app_1 = __importDefault(require("./functions/create-function-app"));
const create_storage_account_1 = __importDefault(require("./functions/create-storage-account"));
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
chalk_1.default.level = 1;
const getMissingStorageAccounts = async (localPackages, prNumber) => {
    const webAppPackages = localPackages.filter((item) => item.type === 'app');
    if (webAppPackages.length === 0) {
        console.log(`${chalk_1.default.bold.yellow('Warning')}: No web app packages in project`);
        return [];
    }
    const isPr = prNumber !== 0;
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az storage account list');
    if (stderr) {
        throw new Error(stderr);
    }
    const accounts = JSON.parse(stdout).map((account) => account.name);
    console.log(`${chalk_1.default.bold.blue('Info')}: Retrieved ${chalk_1.default.bold(accounts.length)} storage accounts`);
    const missingStorageAccounts = webAppPackages
        .reduce((acc, pkg) => isPr ? [...acc, pkg.id, `${pkg.id}stag${prNumber}`] : [...acc, pkg.id], [])
        .filter((storageApp) => !accounts.includes(storageApp));
    return webAppPackages
        .filter((webApp) => missingStorageAccounts.includes(webApp.id) ||
        missingStorageAccounts.includes(`${webApp.id}stag${prNumber}`))
        .reduce((acc, pkg) => [
        ...acc,
        {
            ...pkg,
            mssingAccounts: missingStorageAccounts.filter((storageAcc) => storageAcc.includes(pkg.id)),
        },
    ], []);
};
const getMissingFunctionApps = async (localPackages) => {
    const configFuncApps = localPackages.filter((item) => item.type === 'func-api');
    if (configFuncApps.length === 0) {
        console.log(`${chalk_1.default.bold.yellow('Warning')}: No function app packages in project`);
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az functionapp list');
    if (stderr) {
        throw new Error(stderr);
    }
    const apps = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.blue('Info')}: Retrieved ${chalk_1.default.bold(apps.length)} function apps`);
    return configFuncApps.filter((configApp) => {
        const appIds = apps.map((app) => app.name);
        return !appIds.includes(configApp.id);
    });
};
const createMissingResources = async (localConfig, subscriptionId, prNumber) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for creating services...`);
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    console.log(`${chalk_1.default.bold.green('Success')}: Subscription set to ${chalk_1.default.bold(subscriptionId)}`);
    const pkgMissingStorageAccounts = await getMissingStorageAccounts(localConfig, prNumber);
    const missingFunctionApps = await getMissingFunctionApps(localConfig);
    console.log(pkgMissingStorageAccounts.length > 0
        ? `${chalk_1.default.bold.blue('Info')}: Creating storage accounts: ${chalk_1.default.bold(pkgMissingStorageAccounts
            .reduce((acc, pkg) => [...acc, ...pkg.mssingAccounts], [])
            .join())}`
        : `${chalk_1.default.bold.yellow('Warning')}: No storage accounts to create`);
    console.log(missingFunctionApps.length > 0
        ? `${chalk_1.default.bold.blue('Info')}: Creating function apps: ${chalk_1.default.bold(missingFunctionApps.map((pkg) => pkg.id).join())}`
        : `${chalk_1.default.bold.yellow('Warning')}: No function apps to create`);
    for (const pkg of pkgMissingStorageAccounts) {
        await (0, create_storage_account_1.default)(pkg);
    }
    for (const pkg of missingFunctionApps) {
        await (0, create_function_app_1.default)(pkg);
    }
    console.log(`${chalk_1.default.bold.green('Success')}: Completed for subscriptionID ${chalk_1.default.bold(subscriptionId)}`);
};
const createServices = async (prNumber) => {
    const localPackages = await (0, get_changed_packages_1.default)();
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(localPackages);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        await createMissingResources(azureResourcesBySubId[subsId], subsId, prNumber);
    }
};
exports.default = createServices;
