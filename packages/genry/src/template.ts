import * as prompts from "prompts";
import { PromptObject, Answers } from "prompts";
import { promises as fs } from "fs";
import * as path from "path";
import * as prettier from "prettier";

type Prompt<T extends string = string, A extends string = string> =
    | PromptObject<T>
    | TreePrompt<T, A>;

interface TreePrompt<T extends string = string, A extends string = string> {
    condition: (answers: Answers<A>) => boolean;
    prompts: Prompt<T>[];
}

function isTreePrompt<T extends string = string>(
    prompt: Prompt<T>
): prompt is TreePrompt<T, T> {
    return Boolean((prompt as any).condition && (prompt as any).prompts);
}

function treePromptToPromptsObjects<T extends string = string>(
    prompt: TreePrompt<T>
): PromptObject<T>[] {
    return prompt.prompts.reduce((acc, p) => {
        if (isTreePrompt(p)) {
            return acc.concat(treePromptToPromptsObjects(p));
        }
        const { type, ...restP } = p;
        acc.push({
            ...restP,
            type:
                typeof type === "function"
                    ? (p, v, ps) =>
                          prompt.condition(v) ? type(p, v, ps) : null
                    : (p, v) => (prompt.condition(v) ? type : null),
        });
        return acc;
    }, [] as PromptObject<T>[]);
}

function promptsToPromptsObject<T extends string = string>(
    prompts: Prompt<T, T>[]
): PromptObject<T>[] {
    return prompts.reduce((acc, p) => {
        if (isTreePrompt(p)) {
            acc.push(...treePromptToPromptsObjects(p));
        } else {
            acc.push(p);
        }
        return acc;
    }, []);
}

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
