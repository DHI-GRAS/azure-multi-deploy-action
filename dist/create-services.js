"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_promise_1 = require("child-process-promise");
const create_function_app_1 = __importDefault(require("./functions/create-function-app"));
const create_storage_account_1 = __importDefault(require("./functions/create-storage-account"));
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const getMissingStorageAccounts = (packages) => __awaiter(void 0, void 0, void 0, function* () {
    const webAppPackages = packages.filter((item) => item.type === 'app');
    if (webAppPackages.length === 0) {
        console.log('No web app packages in project');
        return [];
    }
    const { stdout, stderr } = yield (0, child_process_promise_1.exec)('az storage account list');
    if (stderr) {
        throw Error(stderr);
    }
    const accounts = JSON.parse(stdout);
    console.log(`Retrieved ${accounts.length} storage accounts`);
    return webAppPackages.filter((item) => !accounts.map((account) => account.name).includes(item.id));
});
const getMissingFunctionApps = (packages) => __awaiter(void 0, void 0, void 0, function* () {
    const configFuncApps = packages.filter((item) => item.type === 'func-api');
    if (configFuncApps.length === 0) {
        console.log('No function app packages in project');
        return [];
    }
    const { stdout, stderr } = yield (0, child_process_promise_1.exec)('az functionapp list');
    if (stderr) {
        throw Error(stderr);
    }
    const apps = JSON.parse(stdout);
    console.log(`Retrieved ${apps.length} function apps`);
    return configFuncApps.filter((configApp) => {
        const appIds = apps.map((app) => app.name);
        return !appIds.includes(configApp.id);
    });
});
const createMissingResources = (localConfig, subscriptionId) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\nSetting the subscription for creating services...');
    console.log('Creating missing Azure services...');
    yield (0, child_process_promise_1.exec)(`az account set --subscription ${subscriptionId}`);
    console.log(`subscription set to ${subscriptionId}`);
    const missingStorageAccounts = yield getMissingStorageAccounts(localConfig);
    const missingFunctionApps = yield getMissingFunctionApps(localConfig);
    console.log(missingStorageAccounts.length > 0
        ? `Creating storage accounts: ${missingStorageAccounts
            .map((pkg) => pkg.id)
            .join()}`
        : 'No storage accounts to create');
    console.log(missingFunctionApps.length > 0
        ? `Creating function apps: ${missingFunctionApps
            .map((pkg) => pkg.id)
            .join()}`
        : 'No function apps to create');
    for (const pkg of missingStorageAccounts) {
        yield (0, create_storage_account_1.default)(pkg);
    }
    for (const pkg of missingFunctionApps) {
        yield (0, create_function_app_1.default)(pkg);
    }
    console.log(`Completed for subscriptionID ${subscriptionId}`);
});
const createServices = () => __awaiter(void 0, void 0, void 0, function* () {
    const groupBySubscription = get_packages_1.default.reduce((acc, item) => {
        acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item];
        return acc;
    }, {});
    for (const subsId of Object.keys(groupBySubscription)) {
        yield createMissingResources(groupBySubscription[subsId], subsId);
    }
});
exports.default = createServices;
