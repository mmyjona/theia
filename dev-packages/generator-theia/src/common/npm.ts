/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

// tslint:disable:no-any
import * as request from 'request';

export interface Author {
    name: string;
    email: string;
}

export interface Maintainer {
    username: string;
    email: string;
}

export interface Dependencies {
    [name: string]: string | undefined;
}

export class NodePackage {
    name?: string;
    version?: string;
    description?: string;
    publisher?: Maintainer;
    author?: string | Author;
    maintainers?: Maintainer[];
    keywords?: string[];
    dependencies?: Dependencies;
    readme?: string;
    latestVersion?: string;
    [property: string]: any;

    constructor(raw: NodePackage) {
        Object.assign(this, raw);
    }
}

export interface ViewParam {
    readonly name: string;
    /**
     * Return only the fields required to support installation.
     * If undefined then true.
     */
    readonly abbreviated?: boolean;
}
export interface ViewResult {
    'dist-tags': {
        [tag: string]: string
    }
    'versions': {
        [version: string]: NodePackage
    },
    'readme': string;
    [key: string]: any
}
export function view(param: ViewParam): Promise<ViewResult> {
    let url = 'https://registry.npmjs.org/';
    if (param.name[0] === '@') {
        url += '@' + encodeURIComponent(param.name.substr(1));
    } else {
        url += encodeURIComponent(param.name);
    }
    const headers: {
        [header: string]: string
    } = {};
    if (param.abbreviated === undefined || param.abbreviated) {
        headers['Accept'] = 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*';
    }
    return new Promise((resolve, reject) => {
        request({
            url, headers
        }, (err, response, body) => {
            if (err) {
                reject(err);
            } else if (response.statusCode !== 200) {
                reject(new Error(`${response.statusCode}: ${response.statusMessage} for ${url}`));
            } else {
                const data = JSON.parse(body);
                resolve(data);
            }
        });
    });
}

export function version(name: string): Promise<string> {
    return view({ name }).then(result => result['dist-tags']['latest']);
}
