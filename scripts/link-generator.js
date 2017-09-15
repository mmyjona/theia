/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
// @ts-check
const fs = require('fs-extra');
const path = require('path');

const src = path.resolve(__dirname, '..', 'generator-theia');
const dest = path.resolve(__dirname, '..', 'node_modules', 'generator-theia');
try {
    fs.ensureSymlinkSync(src, dest, 'dir');
} catch (e) { /* already linked */ }
