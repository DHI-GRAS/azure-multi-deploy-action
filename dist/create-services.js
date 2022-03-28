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
const getMissingStorageAccounts = async (packages) => {
    const webAppPackages = packages.filter((item) => item.type === 'app');
    if (webAppPackages.length === 0) {
        console.log(`${chalk_1.default.bold.blue('info')}: No web app packages in project`);
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az storage account list');
    if (stderr) {
        throw Error(stderr);
    }
    const accounts = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.blue('info')}: Retrieved ${chalk_1.default.bold.green(accounts.length)} storage accounts`);
    return webAppPackages.filter((item) => !accounts.map((account) => account.name).includes(item.id));
};
const getMissingFunctionApps = async (packages) => {
    const configFuncApps = packages.filter((item) => item.type === 'func-api');
    if (configFuncApps.length === 0) {
        console.log(`${chalk_1.default.bold.blue('info')}: No function app packages in project`);
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az functionapp list');
    if (stderr) {
        throw Error(stderr);
    }
    const apps = JSON.parse(stdout);
    console.log(`${chalk_1.default.bold.blue('info')}: Retrieved ${chalk_1.default.bold(apps.length)} function apps`);
    return configFuncApps.filter((configApp) => {
        const appIds = apps.map((app) => app.name);
        return !appIds.includes(configApp.id);
    });
};
const createMissingResources = async (localConfig, subscriptionId) => {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')} :Setting the subscription for creating services...`);
    console.log(`chalk.bold.blue("info"): Creating missing Azure services...`);
    await (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    console.log(`chalk.bold.blue("info"): Subscription set to ${chalk_1.default.bold(subscriptionId)}`);
    const missingStorageAccounts = await getMissingStorageAccounts(localConfig);
    const missingFunctionApps = await getMissingFunctionApps(localConfig);
    console.log(missingStorageAccounts.length > 0
        ? `${chalk_1.default.bold.blue('info')}: Creating storage accounts: ${missingStorageAccounts
            .map((pkg) => pkg.id)
            .join()}`
        : `${chalk_1.default.bold.blue('info')}: No storage accounts to create`);
    console.log(missingFunctionApps.length > 0
        ? `${chalk_1.default.bold.blue('info')}: Creating function apps: ${missingFunctionApps
            .map((pkg) => pkg.id)
            .join()}`
        : `${chalk_1.default.bold.blue('info')}: No function apps to create`);
    for (const pkg of missingStorageAccounts) {
        await (0, create_storage_account_1.default)(pkg);
    }
    for (const pkg of missingFunctionApps) {
        await (0, create_function_app_1.default)(pkg);
    }
    console.log(`${chalk_1.default.bold.blue('info')}: Completed for subscriptionID ${subscriptionId}`);
};
const createServices = async () => {
    const groupBySubscription = get_packages_1.default.reduce((acc, item) => {
        acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item];
        return acc;
    }, {});
    for (const subsId of Object.keys(groupBySubscription)) {
        await createMissingResources(groupBySubscription[subsId], subsId);
    }
};
exports.default = createServices;
