/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { Repository, WorkingDirectoryStatus } from './model';

/**
 * The WS endpoint path to the Git.
 */
export const GitPath = '/services/git';

/**
 * Git symbol for DI.
 */
export const Git = Symbol('Git');

export namespace Git {

    /**
     * Options for various Git commands.
     */
    export namespace Options {

        /**
         * Git clone options.
         */
        export interface Clone {

            /**
             * The desired destination path (given as a URI) for the cloned repository.
             * If the path does not exist it will be created. Cloning into an existing
             * directory is only allowed if the directory is empty. If not specified,
             * the the workspace root will be used as the destination.
             */
            readonly localUri?: string;

            /**
             * The branch to checkout after the clone has completed. If not given,
             * the default branch will will be the current one which is usually the `master`.
             */
            readonly branch?: string;

        }

        /**
         * Options for further `git checkout` refinements.
         */
        export namespace Checkout {

            /**
             * Options for checking out branches.
             */
            export interface Branch {

                /**
                 * Branch to checkout; if it refers to a branch, then that branch is checked out.
                 * Otherwise, if it refers to a valid commit, your `HEAD` becomes "detached" and you are no
                 * longer on any branch.
                 */
                readonly branch: string;

                /**
                 * When switching branches, proceed even if the index or the working tree differs from `HEAD`.
                 * This is used to throw away local changes.
                 */
                readonly force?: boolean;

                /**
                 * When switching branches, if you have local modifications to one or more files that are different
                 * between the current branch and the branch to which you are switching, the command refuses to
                 * switch branches in order to preserve your modifications in context. However, with this option,
                 * a three-way merge between the current branch, your working tree contents, and the new branch is done,
                 * and you will be on the new branch.
                 */
                readonly merge?: boolean;


                /**
                 * The name for the new local branch.
                 */
                readonly newBranch?: string;

            }

            /**
             * Options for checking out files from the working tree.
             */
            export interface WorkingTreeFile {

                /**
                 * This is used to restore modified or deleted paths to their original contents from the index or replace
                 * paths with the contents from a named tree-ish (most often a commit-ish).
                 *
                 * One can specify a regular expression for the paths, in such cases, it must be escaped with single-quotes.
                 * For instance checking out a `Hello.ts` file will be simply `"Hello.ts"`, if one would like to checkout
                 * all TS files, then this for should be used: ```ts
                 * const options = {
                 *   paths: `'*.ts'`
                 * }
                 * ```.
                 */
                readonly paths: string | string[];

                /**
                 * When checking out paths from the index, do not fail upon unmerged entries; instead, unmerged
                 * entries are ignored.
                 */
                readonly force?: boolean;

                /**
                 * When checking out paths from the index, this option lets you recreate the conflicted merge in the
                 * specified paths.
                 */
                readonly merge?: boolean;

                /**
                 * Tree to checkout from. If not specified, the index will be used.
                 */
                readonly treeish?: string;

            }

        }

        /**
         * Options for further refining the `git show` command.
         */
        export interface Show {

            /**
             * The desired encoding which should be used when retrieving the file content.
             * `utf8` should be used for text content and `binary` for blobs. The default one is `utf8`.
             */
            readonly encoding?: 'utf8' | 'binary';

            /**
             * A commit SHA or some other identifier that ultimately dereferences to a commit/tree.
             * `HEAD` is the local `HEAD`, and `index` is the the staged. If not specified,
             * then `HEAD` will be used instead. But this can be `HEAD~2` or `ed14ef1~1` where `ed14ef1` is a commit hash.
             */
            readonly commitish?: 'index' | string

        }

    }

}

/**
 * Provides basic functionality for Git.
 *
 * TODOs:
 *  - register/remove repositories that are currently outside of the workspace but user wants to track the changes.
 */
export interface Git {

    /**
     * Clones a remote repository into the desired local location.
     *
     * @param remoteUrl the URL of the remote.
     * @param options the clone options.
     */
    clone(remoteUrl: string, options?: Git.Options.Clone): Promise<Repository>;

    /**
     * Resolves to an array of repositories discovered in the workspace.
     */
    repositories(): Promise<Repository[]>;

    /**
     * Returns with the working directory status of the given Git repository.
     *
     * @param the repository to get the working directory status from.
     */
    status(repository: Repository): Promise<WorkingDirectoryStatus>;

    /**
     * Stages the given file or files in the working clone. The invocation will be rejected if
     * any files (given with their file URIs) is not among the changed files.
     *
     * @param repository the repository to stage the files.
     * @param uri one or multiple file URIs to stage in the working clone.
     */
    add(repository: Repository, uri: string | string[]): Promise<void>;

    /**
     * Removes the given file or files among the staged files in the working clone. The invocation will be rejected if
     * any files (given with their file URIs) is not among the staged files.
     *
     * @param repository the repository to where the staged files have to be removed from/
     * @param uri one or multiple file URIs to unstage in the working clone.
     */
    rm(repository: Repository, uri: string | string[]): Promise<void>;

    /**
     * Returns with the name of the branches from the repository. Will be rejected if the repository does not exist.
     * This method will be resolved to a `string` if the `type === 'current`. If the repository has a detached `HEAD`,
     * instead of returning with `(no branch)` it resolves to `undefined`. Otherwise, it will be resolved to an array of
     * branch names.
     *
     * @param the repository to get the active branch from.
     * @param type the type of the query to run. The default type is `current`.
     */
    branch(repository: Repository, type?: 'current' | 'local' | 'remote' | 'all'): Promise<undefined | string | string[]>;

    /**
     * Creates a new branch in the repository.
     *
     * @param repository the repository where the new branch has to be created.
     * @param name the name of the new branch.
     * @param startPoint the commit SH that the new branch should be based on, or `undefined` if the branch should be created based off of the current state of `HEAD`.
     */
    createBranch(repository: Repository, name: string, startPoint?: string): Promise<void>;

    /**
     * Renames an existing branch in the repository.
     *
     * @param repository the repository where the renaming has to be performed.
     * @param name the current name of the branch to rename.
     * @param newName the desired name of the branch.
     */
    renameBranch(repository: Repository, name: string, newName: string): Promise<void>;

    /**
     * Deletes an existing branch in the repository.
     *
     * @param repository the repository where the branch has to be deleted.
     * @param name the name of the existing branch to delete.
     */
    deleteBranch(repository: Repository, name: string): Promise<void>;

    /**
     * Switches branches or restores working tree files.
     *
     * @param repository the repository to where the `git checkout` has to be performed.
     * @param options further checkout options.
     */
    checkout(repository: Repository, options: Git.Options.Checkout.Branch | Git.Options.Checkout.WorkingTreeFile): Promise<void>;

    /**
     * Commits the changes of all staged files in the working directory.
     *
     * @param repository the repository where the staged changes has to be committed.
     * @param message the optional commit message.
     */
    commit(repository: Repository, message?: string): Promise<void>;

    /**
     * Fetches branches and/or tags (collectively, `refs`) from the repository, along with the objects necessary to complete their histories.
     * The remotely-tracked branches will be updated too.
     *
     * @param repository the repository to fetch from.
     */
    fetch(repository: Repository): Promise<void>;

    /**
     * Updates the `refs` using local `refs`, while sending objects necessary to complete the given `refs` by pushing
     * all committed changed from the local Git repository to the `remote` one.
     *
     * @param repository the repository to push to.
     */
    push(repository: Repository): Promise<void>;

    /**
     * Fetches from and integrates with another repository. It incorporates changes from a repository into the current branch.
     * In its default mode, `git pull` is shorthand for `git fetch` followed by `git merge FETCH_HEAD`.
     *
     * @param repository the repository to pull from.
     */
    pull(repository: Repository): Promise<void>;

    /**
     * Resets the current `HEAD` of the entire working directory to the specified state.
     *
     * @param repository the repository which state has to be reset.
     * @param mode the reset mode. The followings are supported: `hard`, `sort`, or `mixed`. Those correspond to the consecutive `--hard`, `--soft`, and `--mixed` Git options.
     * @param ref the reference to reset to. By default, resets to `HEAD`.
     */
    reset(repository: Repository, mode: 'hard' | 'soft' | 'mixed', ref?: string): Promise<void>;

    /**
     * Merges the given branch into the currently active branch.
     *
     * @param repository the repository to merge from.
     * @param name the name of the branch to merge into the current one.
     */
    merge(repository: Repository, name: string): Promise<void>;

    /**
     * Reapplies commits on top of another base tip to the current branch.
     *
     * @param repository the repository to get the commits from.
     * @param name the name of the branch to retrieve the commits and reapplies on the current branch tip.
     */
    rebase(repository: Repository, name: string): Promise<void>;

    /**
     * Retrieves and shows the content of a resource from the repository at a given reference, commit, or tree.
     * Resolves to a promise that will produce a Buffer instance containing the contents of the file or an error if the file does not exists in the given revision.
     *
     * @param repository the repository to get the file content from.
     * @param uri the URI of the file who's content has to be retrieved and shown.
     * @param options the options for further refining the `git show`.
     */
    show(repository: Repository, uri: string, options?: Git.Options.Show): Promise<Buffer>

}
