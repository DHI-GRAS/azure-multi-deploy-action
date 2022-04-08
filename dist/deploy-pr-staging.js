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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const get_changed_packages_1 = __importDefault(require("./functions/get-changed-packages"));
const deploy_web_to_staging_1 = __importDefault(require("./functions/deploy-web-to-staging"));
const deploy_func_to_staging_1 = __importDefault(require("./functions/deploy-func-to-staging"));
const group_by_subscription_1 = __importDefault(require("./functions/group-by-subscription"));
chalk_1.default.level = 1;
const createMissingResources = (localConfig, subsId, prNumber) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('\n');
    console.log(`${chalk_1.default.bold.blue('Info')}: Setting the subscription for PR deployment...`);
    yield (0, child_process_promise_1.exec)(`az account set --subscription ${subsId}`);
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
        yield (0, deploy_web_to_staging_1.default)(webApp, prNumber);
    for (const funcApp of funcPackages)
        yield (0, deploy_func_to_staging_1.default)(funcApp, prNumber);
    console.log(`${chalk_1.default.bold.green('Success')}: Completed for subscriptionID ${chalk_1.default.bold(subsId)}`);
});
const deployToStag = (prNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const changedPackages = yield (0, get_changed_packages_1.default)();
    const azureResourcesBySubId = (0, group_by_subscription_1.default)(changedPackages);
    for (const subsId of Object.keys(azureResourcesBySubId)) {
        yield createMissingResources(azureResourcesBySubId[subsId], subsId, prNumber);
    }
});
exports.default = deployToStag;
