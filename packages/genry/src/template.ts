import * as prompts from "prompts";
import { PromptObject, Answers } from "prompts";
import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { Prompt, promptsToPromptsObject } from "./tree-prompt";

interface FileTemplate {
    path: string;
    content: string;
}

interface DirectoryTemplate {
    path: string;
    children: StructureTemplate[];
}

type StructureTemplate = FileTemplate | DirectoryTemplate;

interface Args {
    path: string;
    ipcServer: string;
    terminalId: string;
}

interface TemplateParams {
    path: string;
}

function isFileTemplate(
    fileOrDirTemplate: StructureTemplate
): fileOrDirTemplate is FileTemplate {
    return (fileOrDirTemplate as any).content;
}

export class Template<T extends string = string, C extends any = any> {
    name: string;
    description?: string;
    questions: PromptObject<T>[];
    template: (
        answers: Answers<T>,
        config: C,
        args: TemplateParams
    ) => StructureTemplate[] | Promise<StructureTemplate[]>;

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
            template.map(async (result) =>
                this.generateStructure(result, params.path)
            )
        );
    }

    private async generateStructure(
        structureTemplate: StructureTemplate,
        rootPath: string
    ) {
        const prettierFileInfo = await prettier.getFileInfo(
            structureTemplate.path
        );
        const resultPath = path.join(rootPath, structureTemplate.path);
        if (isFileTemplate(structureTemplate)) {
            const resultContent = prettierFileInfo.ignored
                ? structureTemplate.content
                : prettier.format(structureTemplate.content, {
                      parser: prettierFileInfo.inferredParser as prettier.Options["parser"],
                  });
            this.createDirectory(path.dirname(resultPath));
            await fs.promises.writeFile(resultPath, resultContent);
        } else {
            this.createDirectory(resultPath);
            if (structureTemplate.children) {
                await Promise.all(
                    structureTemplate.children.map((child) =>
                        this.generateStructure(child, resultPath)
                    )
                );
            }
        }
    }

    private createDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {
                recursive: true,
            });
        }
    }
}
