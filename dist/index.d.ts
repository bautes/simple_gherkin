type ParseGerkin = {
    name: string;
    steps: string[];
    examples: object[];
};
/**
 * Parses a given text in Gherking notation
 * @param gherkinText
 * @returns Array<ParseGerkin>
 */
declare function parseGherkin(gherkinText: string): ParseGerkin[];
/**
 * Extend from here your Given, When, Then steps.
 * Will also provide the methods to run the scenarios.
 */
declare class GherkinSteps {
    private scenarios;
    private currentScenario;
    private map;
    private run;
    setScenarios(scenarios: ReturnType<typeof parseGherkin>, map: Gherkin['stepsMap']): this;
    withScenario(name: string): this;
    runExample(exampleIdx: number): Promise<void>;
    runExamples(): Promise<void>;
    runScenario(name: string): Promise<void>;
}
declare class Gherkin {
    stepsMap: Array<[string, keyof GherkinSteps]>;
    addSentence(sentence: string, fnCall: keyof GherkinSteps): void;
    Default(prefix: string, sentence: string): (_target: GherkinSteps, key: string) => void;
}
declare function withGherkin(gherkinText: string, context: GherkinSteps): GherkinSteps;
declare function Given(sentence: string): any;
declare function When(sentence: string): any;
declare function And(sentence: string): any;
declare function Then(sentence: string): any;

export { And, GherkinSteps, Given, Then, When, withGherkin as default, parseGherkin };
