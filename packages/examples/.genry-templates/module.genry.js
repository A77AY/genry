import { Template } from "genry";

export default new Template({
    name: "Create module",
    description: "Module with component, service...",
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
                { title: "Component", value: "component" },
                { title: "Service", value: "service" },
                { title: "Pipe", value: "pipe" },
            ],
        },
    ],
    template: ({ name }, { template: { prefix } }) => {
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
