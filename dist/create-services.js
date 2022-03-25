"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const getMissingStorageAccounts = async (packages) => {
    const webAppPackages = packages.filter((item) => item.type === 'app');
    if (webAppPackages.length === 0) {
        console.log('No web app packages in project');
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az storage account list');
    if (stderr) {
        throw Error(stderr);
    }
    const accounts = JSON.parse(stdout);
    console.log(`Retrieved ${accounts.length} storage accounts`);
    return webAppPackages.filter((item) => !accounts.map((account) => account.name).includes(item.id));
};
const getMissingFunctionApps = async (packages) => {
    const configFuncApps = packages.filter((item) => item.type === 'func-api');
    if (configFuncApps.length === 0) {
        console.log('No function app packages in project');
        return [];
    }
    const { stdout, stderr } = await (0, child_process_promise_1.exec)('az functionapp list');
    if (stderr) {
        throw Error(stderr);
    }
    const apps = JSON.parse(stdout);
    console.log(`Retrieved ${apps.length} function apps`);
    return configFuncApps.filter((configApp) => {
        const appIds = apps.map((app) => app.name);
        return !appIds.includes(configApp.id);
    });
};
const createServices = async () => {
    console.log('config packages', get_packages_1.default);
    // console.log('Creating missing Azure services...')
    // const missingStorageAccounts = await getMissingStorageAccounts(config)
    // const missingFunctionApps = await getMissingFunctionApps(config)
    // console.log(
    // 	missingStorageAccounts.length > 0
    // 		? `Creating storage accounts: ${missingStorageAccounts
    // 				.map((pkg) => pkg.id)
    // 				.join()}`
    // 		: 'No storage accounts to create',
    // )
    // console.log(
    // 	missingFunctionApps.length > 0
    // 		? `Creating function apps: ${missingFunctionApps
    // 				.map((pkg) => pkg.id)
    // 				.join()}`
    // 		: 'No function apps to create',
    // )
    // missingStorageAccounts.forEach((pkg) => createStorageAccount(pkg))
    // missingFunctionApps.forEach((pkg) => createFunctionApp(pkg))
};
exports.default = createServices;
