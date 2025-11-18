"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  And: () => And,
  GherkinSteps: () => GherkinSteps,
  Given: () => Given,
  Then: () => Then,
  When: () => When,
  default: () => index_default,
  parseGherkin: () => parseGherkin
});
module.exports = __toCommonJS(index_exports);
function parseGherkin(gherkinText) {
  const lines = gherkinText.split("\n").map((line) => line.trim());
  if (!lines.length) throw new Error("No content to parse");
  const scenarios = [];
  let currentScenario = null;
  let inExamples = false;
  let examplesHeader = null;
  let currentExamples = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("Scenario:") || line.startsWith("Scenario Outline:")) {
      if (currentScenario) {
        scenarios.push(currentScenario);
      }
      currentScenario = {
        name: line.replace(/Scenario:|Scenario Outline:/, "").trim(),
        steps: [],
        examples: []
      };
      inExamples = false;
      examplesHeader = null;
      currentExamples = [];
    } else if (currentScenario && (line.startsWith("Given") || line.startsWith("When") || line.startsWith("Then") || line.startsWith("And") || line.startsWith("But"))) {
      currentScenario.steps.push(line);
    } else if (line.startsWith("Examples:")) {
      inExamples = true;
      examplesHeader = null;
      currentExamples = [];
    } else if (inExamples && line.includes("|") && !line.startsWith("#") && line.trim() !== "") {
      const row = line.split("|").map((cell) => cell.trim());
      let exampleObj = {};
      if (!examplesHeader) {
        examplesHeader = row;
      } else {
        exampleObj = {};
        row.forEach((value, index) => {
          if (examplesHeader[index]) {
            exampleObj[examplesHeader[index]] = value;
          }
        });
        currentExamples.push(exampleObj);
      }
    } else if (inExamples && line.trim() === "" && currentExamples.length > 0) {
      if (currentScenario && currentExamples.length > 0) {
        currentScenario.examples = currentExamples;
      }
      inExamples = false;
    }
  }
  if (currentScenario) {
    if (currentExamples.length > 0) {
      currentScenario.examples = currentExamples;
    }
    scenarios.push(currentScenario);
  }
  return scenarios;
}
var GherkinSteps = class {
  scenarios = [];
  currentScenario = null;
  map = /* @__PURE__ */ new Map();
  async run(scenario, exampleIdx) {
    let fnCall;
    let fnName;
    let idx = 0;
    const examples = scenario.examples.length ? scenario.examples : [null];
    for await (const testCase of scenario.steps) {
      fnName = this.map.get(testCase);
      fnCall = this[fnName];
      idx = 0;
      if (typeof fnCall === "undefined") throw new Error(`Missing step: "${testCase}"`);
      for await (const example of examples) {
        if (typeof exampleIdx === "undefined" || exampleIdx === idx) await fnCall.call(this, example);
        idx++;
      }
    }
  }
  setScenarios(scenarios, map) {
    this.map = new Map(map);
    this.scenarios = scenarios;
    return this;
  }
  withScenario(name) {
    const scenario = this.scenarios.find((s) => s.name === name);
    if (!scenario) throw new Error(`Scenario Not Found: ${name}`);
    this.currentScenario = scenario;
    return this;
  }
  async runExample(exampleIdx) {
    if (!this.currentScenario) throw new Error("Missing call withScenario?");
    return this.run(this.currentScenario, exampleIdx);
  }
  async runExamples() {
    if (!this.currentScenario) throw new Error("Missing call withScenario?");
    for (let i = 0; i < this.currentScenario.examples.length; i++)
      await this.run(this.currentScenario, i);
  }
  async runScenario(name) {
    const scenario = this.scenarios.find((s) => s.name === name);
    if (!scenario) throw new Error(`Scenario Not Found: ${name}`);
    this.currentScenario = scenario;
    return this.run(scenario);
  }
};
var Gherkin = class {
  stepsMap = [];
  addSentence(sentence, fnCall) {
    this.stepsMap.push([sentence, fnCall]);
  }
  Default(prefix, sentence) {
    const self = this;
    return function(_target, key) {
      self.addSentence(`${prefix} ${sentence}`, key);
    };
  }
};
function withGherkin(gherkinText, context) {
  const steps = withGherkin.prototype.gherkinSteps;
  return context.setScenarios(parseGherkin(gherkinText), steps.stepsMap);
}
withGherkin.prototype.gherkinSteps = new Gherkin();
function Given(sentence) {
  return withGherkin.prototype.gherkinSteps.Default("Given", sentence);
}
function When(sentence) {
  return withGherkin.prototype.gherkinSteps.Default("When", sentence);
}
function And(sentence) {
  return withGherkin.prototype.gherkinSteps.Default("And", sentence);
}
function Then(sentence) {
  return withGherkin.prototype.gherkinSteps.Default("Then", sentence);
}
var index_default = withGherkin;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  And,
  GherkinSteps,
  Given,
  Then,
  When,
  parseGherkin
});
