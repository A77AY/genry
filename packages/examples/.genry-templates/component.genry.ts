import { Template } from "genry";

export default new Template({
    name: "Create component",
    questions: [
        {
            type: "text",
            name: "name",
            message: "Name",
        },
        {
            type: "multiselect",
            name: "componentParts",
            message: "Pick component parts",
            choices: [
                { title: "Template", value: "template", selected: true } as any,
                { title: "Style", value: "style", selected: true } as any,
                { title: "Theme", value: "theme" },
            ],
        },
        {
            type: "multiselect",
            name: "parts",
            message: "Pick parts",
            choices: [
                { title: "Service", value: "service" },
                { title: "Module", value: "module" },
                { title: "Pipe", value: "pipe" },
            ],
        },
    ],
    template: ({ name, componentParts, parts }, { template: { prefix } }) => {
        return [
            {
                path: "component.html",
                content: `
                  <div class="">
                      <ng-content></ng-content>
                  </div>
                `,
            },
            {
                path: `component.scss`,
                content: `
                  .${prefix}-${name} {}
                `,
            },
            {
                path: `component.ts`,
                content: `
                  import { Component, ChangeDetectionStrategy } from '@angular/core';

                  @Component({
                    selector: '${prefix}-${name}',
                    templateUrl: '${name}.html',
                    styleUrls: ['${name}.scss'],
                    changeDetection: ChangeDetectionStrategy.OnPush
                  })
                    export class ${name} {
                  }
                `,
            },
            {
                path: `index.ts`,
                content: `
                  export * from './${name}'
                `,
            },
        ];
    },
});
