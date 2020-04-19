import { Template, html, css } from "genry";
import { kebabCase, camelCase, upperFirst } from "lodash";

enum ComponentPart {
    template,
    style,
    theme,
}

enum Part {
    service,
    module,
    pipe,
    component,
    index,
}

export default [
    { name: "Create component", value: Part.component },
    { name: "Create module", value: Part.module },
    { name: "Create service", value: Part.service },
    { name: "Create pipe", value: Part.pipe },
].map(
    ({ name, value }) =>
        new Template({
            name,
            description: "Angular",
            questions: [
                {
                    type: "text",
                    name: "name",
                    message: "Name",
                },
                {
                    type: "multiselect",
                    name: "parts",
                    message: "Pick parts",
                    choices: [
                        {
                            title: "Module",
                            value: Part.module,
                            selected: value === Part.module,
                        },
                        {
                            title: "Component",
                            value: Part.component,
                            selected: value === Part.component,
                        },
                        {
                            title: "Service",
                            value: Part.service,
                            selected: value === Part.service,
                        },
                        {
                            title: "Pipe",
                            value: Part.pipe,
                            selected: value === Part.pipe,
                        },
                        {
                            title: "Index",
                            value: Part.index,
                            selected: true,
                        },
                    ] as any,
                },
                {
                    type: (_, { parts }) =>
                        parts.includes(Part.component) ? "multiselect" : null,
                    name: "componentParts",
                    message: "Pick component parts",
                    choices: [
                        {
                            title: "Template",
                            value: ComponentPart.template,
                            selected: true,
                        },
                        {
                            title: "Style",
                            value: ComponentPart.style,
                            selected: true,
                        },
                        { title: "Theme", value: ComponentPart.theme },
                    ] as any,
                },
                {
                    type: "toggle",
                    name: "hasDirectory",
                    message: "With directory",
                    initial: true,
                    active: "Yes",
                    inactive: "No",
                },
            ],
            template: (
                { name, componentParts, parts, hasDirectory },
                { template: { prefix } }
            ) => {
                const filename = kebabCase(name);
                const selector = kebabCase(`${prefix}-${name}`);
                const camelCaseName = camelCase(name);
                const className = upperFirst(camelCaseName);

                const hasService = parts.includes(Part.service);
                const hasModule = parts.includes(Part.module);
                const hasPipe = parts.includes(Part.pipe);
                const hasComponent = parts.includes(Part.component);
                const hasIndex = parts.includes(Part.index);

                const children = [];

                if (hasComponent) {
                    const hasStyle = componentParts.includes(
                        ComponentPart.style
                    );
                    const hasTheme = componentParts.includes(
                        ComponentPart.theme
                    );
                    const hasTemplate = componentParts.includes(
                        ComponentPart.template
                    );

                    children.push({
                        path: `${filename}.component.ts`,
                        content: `
                                import { ChangeDetectionStrategy, Component } from '@angular/core';
                
                                @Component({
                                    selector: '${selector}',
                                    templateUrl: ${
                                        hasTemplate
                                            ? `'${filename}.component.html'`
                                            : "`<ng-content></ng-content>`"
                                    },
                                    ${
                                        hasStyle
                                            ? `styleUrls: ['${filename}.component.scss'],`
                                            : ""
                                    }
                                    changeDetection: ChangeDetectionStrategy.OnPush
                                })
                                export class ${className}Component {}
                            `,
                    });

                    if (hasStyle) {
                        children.push({
                            path: `${filename}.component.scss`,
                            content: css`
                                :host {
                                    .${selector} {
                                    }
                                }
                            `,
                        });
                    }
                    if (hasTheme) {
                        children.push({
                            path: `_${filename}-theme.scss`,
                            content: css`
                                @import "~@angular/material/theming";

                                @mixin ${selector}-theme ($theme) {
                                    .${selector} {
                                    }
                                }

                                @mixin ${selector}-typography ($config) {
                                    .${selector} {
                                    }
                                }
                            `,
                        });
                    }
                    if (hasTemplate) {
                        children.push({
                            path: `${filename}.component.html`,
                            content: html`
                                <div class="${selector}">
                                    <ng-content></ng-content>
                                </div>
                            `,
                        });
                    }
                }
                if (hasService) {
                    children.push({
                        path: `${filename}.service.ts`,
                        content: `
                            import { Injectable } from '@angular/core';

                            @Injectable()
                            export class ${className}Service {
                                constructor() {}
                            }
                        `,
                    });
                }
                if (hasModule) {
                    children.push({
                        path: `${filename}.module.ts`,
                        content: `
                            import { NgModule } from '@angular/core';

                            ${[
                                hasComponent
                                    ? `export * from './${filename}.component.ts'`
                                    : "",
                                hasPipe
                                    ? `export * from './${filename}.pipe.ts'`
                                    : "",
                                hasService
                                    ? `export * from './${filename}.service.ts'`
                                    : "",
                            ]
                                .filter((v) => v)
                                .join("\n")}

                            const EXPORTED_DECLARATIONS = [${[
                                hasComponent ? `${className}Component` : "",
                                hasPipe ? `${className}Pipe` : "",
                            ]
                                .filter((v) => v)
                                .join(",")}];
                            
                            @NgModule({
                                imports: [],
                                declarations: EXPORTED_DECLARATIONS,
                                exports: EXPORTED_DECLARATIONS,
                                providers: [${
                                    hasService ? `${className}Service` : ""
                                }]
                            })
                            export class ${className}Module {}
                        `,
                    });
                }
                if (hasPipe) {
                    children.push({
                        path: `${filename}.pipe.ts`,
                        content: `
                            import { Pipe, PipeTransform } from '@angular/core';

                            @Pipe({name: '${camelCaseName}'})
                            export class ${className}Pipe implements PipeTransform {
                                transform(value: any) {
                                    return value;
                                }
                            }
                        `,
                    });
                }
                if (hasIndex) {
                    children.push({
                        path: `index.ts`,
                        content: [
                            hasComponent
                                ? `export * from './${filename}.component.ts'`
                                : "",
                            hasModule
                                ? `export * from './${filename}.module.ts'`
                                : "",
                            hasPipe
                                ? `export * from './${filename}.pipe.ts'`
                                : "",
                            hasService
                                ? `export * from './${filename}.service.ts'`
                                : "",
                        ]
                            .filter((v) => v)
                            .join("\n"),
                    });
                }

                return hasDirectory
                    ? [
                          {
                              path: filename,
                              children,
                          },
                      ]
                    : children;
            },
        })
);
