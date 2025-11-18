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
export function parseGherkin(gherkinText: string): ParseGerkin[] {
  const lines = gherkinText.split('\n').map((line) => line.trim());
  if (!lines.length) throw new Error("No content to parse");
  const scenarios: ParseGerkin[] = [];
  let currentScenario: typeof scenarios[number] | null = null;
  let inExamples = false;
  let examplesHeader: string[] | null = null;
  let currentExamples: object[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;

    if (line.startsWith('Scenario:') || line.startsWith('Scenario Outline:')) {
      // Save previous scenario if it exists
      if (currentScenario) {
        scenarios.push(currentScenario);
      }

      // Start new scenario
      currentScenario = {
        name: line.replace(/Scenario:|Scenario Outline:/, '').trim(),
        steps: [],
        examples: []
      };
      inExamples = false;
      examplesHeader = null;
      currentExamples = [];
    } else if (
      currentScenario &&
      (line.startsWith('Given') ||
        line.startsWith('When') ||
        line.startsWith('Then') ||
        line.startsWith('And') ||
        line.startsWith('But'))
    ) {
      // Add step to current scenario
      currentScenario.steps.push(line);
    } else if (line.startsWith('Examples:')) {
      inExamples = true;
      examplesHeader = null;
      currentExamples = [];
    } else if (
      inExamples &&
      line.includes('|') &&
      !line.startsWith('#') &&
      line.trim() !== ''
    ) {
      // Parse examples table row
      const row = line
        .split('|')
        .map((cell) => cell.trim())
        // .filter((cell) => cell !== '');
      let exampleObj: Record<string, string> = {};

      if (!examplesHeader) {
        examplesHeader = row;
      } else {
        // Create object with header values as keys
        exampleObj = {};
        row.forEach((value, index) => {
          if (examplesHeader![index]) {
            exampleObj[examplesHeader![index]] = value;
          }
        });
        currentExamples.push(exampleObj);
      }
    } else if (inExamples && line.trim() === '' && currentExamples.length > 0) {
      // End of examples table
      if (currentScenario && currentExamples.length > 0) {
        currentScenario.examples = currentExamples;
      }
      inExamples = false;
    }
  }

  // Don't forget to add the last scenario
  if (currentScenario) {
    if (currentExamples.length > 0) {
      currentScenario.examples = currentExamples;
    }
    scenarios.push(currentScenario);
  }

  return scenarios;
}


type FnCall = (...args: unknown[]) => Promise<void>

/**
 * Extend from here your Given, When, Then steps.
 * Will also provide the methods to run the scenarios.
 */
export class GherkinSteps {
  private scenarios: ReturnType<typeof parseGherkin> = [];
  private currentScenario: typeof this.scenarios[number] | null = null;
  private map: Map<string, keyof GherkinSteps> = new Map();

  private async run(scenario: (typeof this.scenarios)[number], exampleIdx?: number) {
    let fnCall: FnCall;
    let fnName;
    let idx = 0;
    const examples = scenario.examples.length ? scenario.examples : [null];

    for await (const testCase of scenario.steps) {
      fnName = this.map.get(testCase) as keyof this;
      fnCall = this[fnName] as FnCall;
      idx = 0;

      if (typeof fnCall === "undefined") throw new Error(`Missing step: "${testCase}"`);

      for await (const example of examples) {
        if (typeof exampleIdx === "undefined" || exampleIdx === idx) await fnCall.call(this, example);
        idx++;
      }
    }
  }

  setScenarios(
    scenarios: ReturnType<typeof parseGherkin>,
    map: Gherkin['stepsMap']
  ) {
    this.map = new Map(map);
    this.scenarios = scenarios;
    return this;
  }

  withScenario(name: string) {
    const scenario = this.scenarios.find((s) => s.name === name);
    if (!scenario) throw new Error(`Scenario Not Found: ${name}`);
    this.currentScenario = scenario;
    return this;
  }

  async runExample(exampleIdx: number) {
    if (!this.currentScenario) throw new Error("Missing call withScenario?");
    return this.run(this.currentScenario, exampleIdx);
  }

  async runExamples() {
    if (!this.currentScenario) throw new Error("Missing call withScenario?");
    for(let i = 0; i < this.currentScenario.examples.length; i++)
      await this.run(this.currentScenario, i);
  }

  async runScenario(name: string) {
    const scenario = this.scenarios.find((s) => s.name === name);
    if (!scenario) throw new Error(`Scenario Not Found: ${name}`);
    this.currentScenario = scenario;
    return this.run(scenario);
  }
}

class Gherkin {
  public stepsMap: Array<[string, keyof GherkinSteps]> = [];
  addSentence(sentence: string, fnCall: keyof GherkinSteps) {
    this.stepsMap.push([sentence, fnCall]);
  }

  Default(prefix: string, sentence: string) {
    const self = this as Gherkin;
    return function (_target: GherkinSteps, key: string) {
      self.addSentence(`${prefix} ${sentence}`, key as keyof GherkinSteps);
    };
  }
}

function withGherkin(
  gherkinText: string,
  context: GherkinSteps
) {
  const steps: Gherkin = withGherkin.prototype.gherkinSteps;
  return context.setScenarios(parseGherkin(gherkinText), steps.stepsMap);
}

withGherkin.prototype.gherkinSteps = new Gherkin();

export function Given(sentence: string) {
  return withGherkin.prototype.gherkinSteps.Default('Given', sentence);
}

export function When(sentence: string) {
  return withGherkin.prototype.gherkinSteps.Default('When', sentence);
}

export function And(sentence: string) {
  return withGherkin.prototype.gherkinSteps.Default('And', sentence);
}

export function Then(sentence: string) {
  return withGherkin.prototype.gherkinSteps.Default('Then', sentence);
}

export default withGherkin;
