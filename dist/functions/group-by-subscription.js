"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (config) => config
    // exclude libs as libs aren't an azure resource
    .filter((item) => item.type !== 'lib')
    // group resources by subscription
    .reduce((acc, item) => {
    acc[item.subscriptionId] = [...(acc[item.subscriptionId] || []), item];
    return acc;
}, {});
