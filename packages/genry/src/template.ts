import * as prompts from "prompts";
import { PromptObject, Answers } from "prompts";
import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { Prompt, promptsToPromptsObject } from "./tree-prompt";
import { Options } from "prettier";

interface FileTemplate {
    path: string;
    content: string;
}

interface DirectoryTemplate {
    path: string;
    children: StructureTemplate[];
}

type StructureTemplate = FileTemplate | DirectoryTemplate;

interface LaunchConfig {
    path: string;
    packagePath: string;
    ipcServer?: string;
    terminalId?: string;
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

    async generate(launchConfig: LaunchConfig, config: C) {
        const answers = await prompts(this.questions);
        const params: TemplateParams = { path: launchConfig.path };
        const template = await this.template(answers, config, params);
        const prettierConfig = await prettier.resolveConfig(
            launchConfig.packagePath
        );

        await Promise.all(
            template.map(async (result) =>
                this.generateStructure({
                    structureTemplate: result,
                    rootPath: params.path,
                    prettierConfig: prettierConfig,
                })
            )
        );
    }

    private async generateStructure({
        structureTemplate,
        rootPath,
        prettierConfig,
    }: {
        structureTemplate: StructureTemplate;
        rootPath: string;
        prettierConfig: prettier.Options;
    }) {
        const resultPath = path.join(rootPath, structureTemplate.path);

        if (isFileTemplate(structureTemplate)) {
            this.createDirectory(path.dirname(resultPath));
            await fs.promises.writeFile(
                resultPath,
                await this.formatContent(
                    resultPath,
                    structureTemplate.content,
                    prettierConfig
                )
            );
        } else {
            this.createDirectory(resultPath);
            if (structureTemplate.children) {
                await Promise.all(
                    structureTemplate.children.map((childTermplate) =>
                        this.generateStructure({
                            structureTemplate: childTermplate,
                            rootPath: resultPath,
                            prettierConfig,
                        })
                    )
                );
            }
        }
    }

    private async formatContent(
        filePath: string,
        content: string,
        prettierConfig: prettier.Options
    ) {
        const { ignored, inferredParser } = await prettier.getFileInfo(
            filePath
        );
        return ignored
            ? content
            : prettier.format(content, {
                  ...prettierConfig,
                  parser: inferredParser as Options["parser"],
              });
    }

    private createDirectory(dirPath: string) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, {
                recursive: true,
            });
        }
    }
}
