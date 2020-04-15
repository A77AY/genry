import { Template } from "genry";
import { kebabCase, camelCase, upperFirst } from "lodash";

export default new Template({
    name: "Component",
    description: "React",
    questions: [
        {
            type: "text",
            name: "name",
            message: "Name",
        },
    ],
    template: ({ name }) => {
        return [
            {
                path: `${kebabCase(name)}.jsx`,
                content: `
                  import React from "react";

                  class ${upperFirst(camelCase(name))} extends React.Component {
                    render() {
                      return <div></div>;
                    }
                  }
                `,
            },
        ];
    },
});
