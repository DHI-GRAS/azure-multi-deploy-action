"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const chalk_1 = __importDefault(require("chalk"));
const create_function_app_1 = __importDefault(require("./functions/create-function-app"));
const create_storage_account_1 = __importDefault(require("./functions/create-storage-account"));
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
chalk_1.default.level = 1;
const getMissingStorageAccounts = async (localPackages) => {
    const webAppPackages = localPackages.filter((item) => item.type === 'app');
    if (webAppPackages.length === 0) {
        console.log(`${chalk_1.default.bold.yellow('Warning')}: No web app packages in project`);
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az storage account list');
    if (stderr) {
        throw Error(stderr);
    }
    const accounts = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.blue('Info')}: Retrieved ${chalk_1.default.bold(accounts.length)} storage accounts`);
    return webAppPackages.filter((item) => !accounts.map((account) => account.name).includes(item.id));
};
const getMissingFunctionApps = async (localPackages) => {
    const configFuncApps = localPackages.filter((item) => item.type === 'func-api');
    if (configFuncApps.length === 0) {
        console.log(`${chalk_1.default.bold.yellow('Warning')}: No function app packages in project`);
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az functionapp list');
    if (stderr) {
        throw Error(stderr);
    }
    const apps = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.yellow('Warning')}: Retrieved ${chalk_1.default.bold(apps.length)} function apps`);
    return configFuncApps.filter((configApp) => {
        const appIds = apps.map((app) => app.name);
        return !appIds.includes(configApp.id);
    });
};
const createMissingResources = async (localConfig, subscriptionId) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for creating services...`);
    console.log(`${chalk_1.default.bold.blue('Info')}: Creating missing Azure services...`);
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    console.log(`${chalk_1.default.bold.green('Success')}: subscription set to ${chalk_1.default.bold(subscriptionId)}`);
    const missingStorageAccounts = await getMissingStorageAccounts(localConfig);
    const missingFunctionApps = await getMissingFunctionApps(localConfig);
    console.log(missingStorageAccounts.length > 0
        ? `${chalk_1.default.bold.blue('Info')}: Creating storage accounts: ${chalk_1.default.bold(missingStorageAccounts.map((pkg) => pkg.id).join())}`
        : `${chalk_1.default.bold.yellow('Warning')}: No storage accounts to create`);
    console.log(missingFunctionApps.length > 0
        ? `${chalk_1.default.bold.blue('Info')}: Creating function apps: ${chalk_1.default.bold(missingFunctionApps.map((pkg) => pkg.id).join())}`
        : `${chalk_1.default.bold.yellow('Warning')}: No function apps to create`);
    for (const pkg of missingStorageAccounts) {
        await (0, create_storage_account_1.default)(pkg);
    }
    for (const pkg of missingFunctionApps) {
        await (0, create_function_app_1.default)(pkg);
    }
    console.log(`${chalk_1.default.bold.green('Success')}: Completed for subscriptionID ${chalk_1.default.bold(subscriptionId)}`);
};
const createServices = async () => {
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(get_packages_1.default);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        await createMissingResources(azureResourcesBySubId[subsId], subsId);
    }
};
exports.default = createServices;
