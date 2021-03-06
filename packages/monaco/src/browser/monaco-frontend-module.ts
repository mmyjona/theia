/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { ContainerModule, decorate, injectable } from "inversify";
import { MenuContribution, CommandContribution, KeybindingContribution } from "@theia/core/lib/common";
import { QuickOpenService } from "@theia/core/lib/browser";
import { Languages, Workspace } from "@theia/languages/lib/common";
import { TextEditorProvider } from "@theia/editor/lib/browser";
import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from "monaco-languageclient";
import { MonacoEditorProvider } from './monaco-editor-provider';
import { MonacoEditorMenuContribution } from './monaco-menu';
import { MonacoEditorCommandHandlers } from "./monaco-command";
import { MonacoKeybindingContribution } from "./monaco-keybinding";
import { MonacoLanguages } from "./monaco-languages";
import { MonacoWorkspace } from "./monaco-workspace";
import { MonacoEditorService } from "./monaco-editor-service";
import { MonacoTextModelService } from "./monaco-text-model-service";
import { MonacoContextMenuService } from "./monaco-context-menu";
import { MonacoCommandService, MonacoCommandServiceFactory } from './monaco-command-service';
import { MonacoCommandRegistry } from './monaco-command-registry';
import { MonacoQuickOpenService } from './monaco-quick-open-service';

decorate(injectable(), MonacoToProtocolConverter);
decorate(injectable(), ProtocolToMonacoConverter);

import '../../src/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(MonacoToProtocolConverter).toSelf().inSingletonScope();
    bind(ProtocolToMonacoConverter).toSelf().inSingletonScope();

    bind(MonacoLanguages).toSelf().inSingletonScope();
    bind(Languages).toDynamicValue(ctx => ctx.container.get(MonacoLanguages));

    bind(MonacoWorkspace).toSelf().inSingletonScope();
    bind(Workspace).toDynamicValue(ctx => ctx.container.get(MonacoWorkspace));

    bind(MonacoEditorService).toSelf().inSingletonScope();
    bind(MonacoTextModelService).toSelf().inSingletonScope();
    bind(MonacoContextMenuService).toSelf().inSingletonScope();
    bind(MonacoEditorProvider).toSelf().inSingletonScope();
    bind(MonacoCommandService).toSelf().inTransientScope();
    bind(MonacoCommandServiceFactory).toAutoFactory(MonacoCommandService);
    bind(TextEditorProvider).toProvider(context =>
        uri => context.container.get(MonacoEditorProvider).get(uri)
    );

    bind(MonacoCommandRegistry).toSelf().inSingletonScope();
    bind(CommandContribution).to(MonacoEditorCommandHandlers).inSingletonScope();
    bind(MenuContribution).to(MonacoEditorMenuContribution).inSingletonScope();
    bind(KeybindingContribution).to(MonacoKeybindingContribution).inSingletonScope();

    bind(MonacoQuickOpenService).toSelf().inSingletonScope();
    rebind(QuickOpenService).toDynamicValue(ctx =>
        ctx.container.get(MonacoQuickOpenService)
    ).inSingletonScope();
});
