import * as prompts from "prompts";
import { PromptObject, Answers } from "prompts";
import { promises as fs } from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { Prompt, promptsToPromptsObject } from "./tree-prompt";

interface FileTemplate {
    path: string;
    content: string;
}

interface Args {
    path: string;
    ipcServer: string;
    terminalId: string;
}

interface TemplateParams {
    path: string;
}

export class Template<T extends string = string, C extends any = any> {
    name: string;
    description?: string;
    questions: PromptObject<T>[];
    template: (
        answers: Answers<T>,
        config: C,
        args: TemplateParams
    ) => FileTemplate[] | Promise<FileTemplate[]>;

    constructor({
        name,
        description,
        questions,
        template,
    }: {
        name: Template<T, C>["name"];
        description?: Template<T, C>["description"];
        questions: Prompt<T, T>[];
        template: Template<T, C>["template"];
    }) {
        this.name = name;
        this.description = description;
        this.questions = promptsToPromptsObject(questions);
        this.template = template;
    }

    async generate(config: C, args: Args) {
        const answers = await prompts(this.questions);
        const params: TemplateParams = { path: args.path };
        const template = await this.template(answers, config, params);
        await Promise.all(
            template.map(async (result) => {
                const prettierFileInfo = await prettier.getFileInfo(
                    result.path
                );
                const resultPath = path.join(params.path, result.path);
                const resultContent = prettierFileInfo.ignored
                    ? result.content
                    : prettier.format(result.content, {
                          parser: prettierFileInfo.inferredParser as prettier.Options["parser"],
                      });
                await fs.writeFile(resultPath, resultContent);
            })
        );
    }
}
