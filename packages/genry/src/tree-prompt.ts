import { PromptObject, Answers } from "prompts";

export type Prompt<T extends string = string, A extends string = string> =
    | PromptObject<T>
    | TreePrompt<T, A>;

export interface TreePrompt<
    T extends string = string,
    A extends string = string
> {
    condition: (answers: Answers<A>) => boolean;
    prompts: Prompt<T>[];
}

export function isTreePrompt<T extends string = string>(
    prompt: Prompt<T>
): prompt is TreePrompt<T, T> {
    return Boolean((prompt as any).condition && (prompt as any).prompts);
}

export function treePromptToPromptsObjects<T extends string = string>(
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

export function promptsToPromptsObject<T extends string = string>(
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
