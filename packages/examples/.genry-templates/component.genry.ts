import { Template, html, css } from "genry";
import { kebabCase, camelCase, capitalize } from "lodash";

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
                            title: "Component",
                            value: Part.component,
                            selected: value === Part.component,
                        },
                        {
                            title: "Module",
                            value: Part.module,
                            selected: value === Part.module,
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
            ],
            template: (
                { name, componentParts, parts },
                { template: { prefix } }
            ) => {
                const filename = kebabCase(name);
                const selector = kebabCase(`${prefix}-${name}`);
                const className = capitalize(camelCase(name));
                console.log(selector);

                const hasService = parts.includes(Part.service);
                const hasModule = parts.includes(Part.module);
                const hasPipe = parts.includes(Part.pipe);
                const hasComponent = parts.includes(Part.component);

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
                                            : "<ng-content></ng-content>"
                                    },
                                    ${
                                        hasStyle
                                            ? `styleUrls: ['${name}.component.scss'],`
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

                return [
                    {
                        path: filename,
                        children: [
                            {
                                path: `index.ts`,
                                content: `export * from './${filename}.component.ts'`,
                            },
                            ...children,
                        ],
                    },
                ];
            },
        })
);
