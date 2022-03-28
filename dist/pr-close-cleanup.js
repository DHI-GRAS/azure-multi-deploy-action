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
const get_packages_1 = __importDefault(require("./functions/get-packages"));
const removeWebStagingDeployment = (pkg, pullNumber) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!pullNumber)
            throw Error('No PR number');
        const slotName = pullNumber;
        const stagName = `${pkg.id}stag`;
        yield (0, child_process_promise_1.exec)('az extension add --name storage-preview').catch();
        yield (0, child_process_promise_1.exec)(`az storage blob directory delete --account-name ${pkg.id}stag --container-name \\$web --directory-path ${slotName} --auth-mode key --recursive`);
        console.log(`Deleted web app: ${stagName}-${slotName}`);
    }
    catch (err) {
        throw Error(err);
    }
});
const removeFuncAppStagingDeployment = (pkg, pullNumber) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!pullNumber)
            throw Error('No PR number');
        const slotName = `stag-${pullNumber}`;
        const { stdout: deleteOut, stderr: deleteErr } = yield (0, child_process_promise_1.exec)(`az functionapp deployment slot delete -g ${pkg.resourceGroup} -n ${pkg.id} --slot ${slotName}`);
        if (deleteErr)
            console.log(deleteOut, deleteErr);
        console.log(`Deleted function app: ${pkg.id}-${slotName}`);
    }
    catch (err) {
        throw Error(err);
    }
});
const cleanDeployments = (prNumber) => __awaiter(void 0, void 0, void 0, function* () {
    const webPackages = get_packages_1.default.filter((pkg) => pkg.type === 'app');
    const funcPackages = get_packages_1.default.filter((pkg) => pkg.type === 'func-api');
    for (const pkg of webPackages) {
        yield removeWebStagingDeployment(pkg, prNumber);
    }
    for (const pkg of funcPackages) {
        yield removeFuncAppStagingDeployment(pkg, prNumber);
    }
});
exports.default = cleanDeployments;
