/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from 'inversify';
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient';
import URI from "@theia/core/lib/common/uri";
import { DisposableCollection } from '@theia/core/lib/common';
import { EditorPreferences, EditorPreferenceChange } from "@theia/editor/lib/browser";
import { MonacoEditor } from "./monaco-editor";
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditorService } from "./monaco-editor-service";
import { MonacoTextModelService } from "./monaco-text-model-service";
import { MonacoContextMenuService } from "./monaco-context-menu";
import { MonacoWorkspace } from "./monaco-workspace";
import { MonacoCommandServiceFactory } from "./monaco-command-service";
import { MonacoQuickOpenService } from './monaco-quick-open-service';

const monacoTheme = 'vs-dark';
monaco.editor.setTheme(monacoTheme);
document.body.classList.add(monacoTheme);

@injectable()
export class MonacoEditorProvider {

    constructor(
        @inject(MonacoEditorService) protected readonly editorService: MonacoEditorService,
        @inject(MonacoTextModelService) protected readonly textModelService: MonacoTextModelService,
        @inject(MonacoContextMenuService) protected readonly contextMenuService: MonacoContextMenuService,
        @inject(MonacoToProtocolConverter) protected readonly m2p: MonacoToProtocolConverter,
        @inject(ProtocolToMonacoConverter) protected readonly p2m: ProtocolToMonacoConverter,
        @inject(MonacoWorkspace) protected readonly workspace: MonacoWorkspace,
        @inject(MonacoCommandServiceFactory) protected readonly commandServiceFactory: MonacoCommandServiceFactory,
        @inject(EditorPreferences) protected readonly editorPreferences: EditorPreferences,
        @inject(MonacoQuickOpenService) protected readonly quickOpenService: MonacoQuickOpenService
    ) { }

    get(uri: URI): Promise<MonacoEditor> {
        const referencePromise = this.textModelService.createModelReference(uri);
        const prefPromise = this.editorPreferences.ready;

        return Promise.all([referencePromise, prefPromise]).then(([reference]) => {
            const commandService = this.commandServiceFactory();

            const node = document.createElement('div');
            const model = reference.object;
            const textEditorModel = model.textEditorModel;

            textEditorModel.updateOptions(this.getModelOptions());

            const { editorService, textModelService, contextMenuService } = this;
            const editor = new MonacoEditor(
                uri, node, this.m2p, this.p2m, this.workspace, this.getEditorOptions(model), {
                    editorService,
                    textModelService,
                    contextMenuService,
                    commandService
                }
            );

            const toDispose = new DisposableCollection();
            toDispose.push(reference);
            toDispose.push(this.editorPreferences.onPreferenceChanged(e => this.updateOptions(e, editor)));
            editor.onDispose(() => toDispose.dispose());

            const standaloneCommandService = new monaco.services.StandaloneCommandService(editor.instantiationService);
            commandService.setDelegate(standaloneCommandService);

            this.installQuickOpenService(editor);

            return editor;
        });
    }

    protected getModelOptions(): monaco.editor.ITextModelUpdateOptions {
        return {
            tabSize: this.editorPreferences["editor.tabSize"]
        };
    }

    protected getEditorOptions(model: MonacoEditorModel): MonacoEditor.IOptions | undefined {
        return {
            model: model.textEditorModel,
            wordWrap: 'off',
            folding: true,
            lineNumbers: this.editorPreferences["editor.lineNumbers"],
            renderWhitespace: this.editorPreferences["editor.renderWhitespace"],
            glyphMargin: true,
            readOnly: model.readOnly
        };
    }

    protected readonly modelOptions: {
        [name: string]: (keyof monaco.editor.ITextModelUpdateOptions | undefined)
    } = {
        'editor.tabSize': 'tabSize'
    };

    protected readonly editorOptions: {
        [name: string]: (keyof monaco.editor.IEditorOptions | undefined)
    } = {
        'editor.lineNumbers': 'lineNumbers',
        'editor.renderWhitespace': 'renderWhitespace'
    };

    protected updateOptions(change: EditorPreferenceChange, editor: MonacoEditor): void {
        const modelOption = this.modelOptions[change.preferenceName];
        if (modelOption) {
            const options: monaco.editor.ITextModelUpdateOptions = {};
            // tslint:disable-next-line:no-any
            options[modelOption] = change.newValue as any;
            editor.getControl().getModel().updateOptions(options);
        }

        const editorOption = this.editorOptions[change.preferenceName];
        if (editorOption) {
            const options: monaco.editor.IEditorOptions = {};
            options[editorOption] = change.newValue;
            editor.getControl().updateOptions(options);
        }
    }

    protected installQuickOpenService(editor: MonacoEditor): void {
        const control = editor.getControl();
        const quickOpenController = control._contributions['editor.controller.quickOpenController'];
        quickOpenController.run = options => {
            const selection = control.getSelection();
            this.quickOpenService.internalOpen({
                ...options,
                onClose: canceled => {
                    quickOpenController.clearDecorations();

                    if (canceled && selection) {
                        control.setSelection(selection);
                        control.revealRangeInCenterIfOutsideViewport(selection);
                    }
                    editor.focus();
                }
            });
        };
    }

}
