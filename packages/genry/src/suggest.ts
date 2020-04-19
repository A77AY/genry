import { Choice } from "prompts";

export async function suggest(
    input: string,
    choices: Choice[]
): Promise<Choice[]> {
    return choices
        .filter(
            (choice) =>
                choice.title.search(input) !== -1 ||
                (choice.description && choice.description.search(input) !== -1)
        )
        .sort(
            (a, b) =>
                (a.title + a.description).search(input) -
                (b.title + b.description).search(input)
        );
}
