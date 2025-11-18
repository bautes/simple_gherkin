# simple_gherkin

Simple libary to parse and run tests based on Gherkin notation.

## Installation

`npm i -D simple_gherkin`

## Usage

### Create your Gherkin notation file

File: _testcase.feature_
```
Feature: Your feature to test

    Some description...

    Scenario: Scenario 1
        Given your Given case
        When your When case
        Then your assertion case <exmaple_column>

        Examples:
            | example_column |
            | case 1         |
            | case 2         |
            | ...            |
```

### Setup the steps

File: _tests.ts_
```
import { Given, When, Then, GherkinSteps } from "simple_gherkin/src"

class Steps extends GherkinSteps {
    @Given('your Given case')
    async givenFunction1(args: Array<{ example_column: string, ... }>) {
        // Your test setup
    }

    @When('your When case')
    async whenFunction1(args: Array<{ example_column: string, ... }>) {
        // Your test setup
    }

    @Then('your assertion case <exmaple_column>')
    async thenFunction1(args: Array<{ example_column: string, ... }>) {
        // Your expects goes here 
    }
}
```

### Run tests

```
import withGherkin from 'simple_gherkin/src';
import Steps from 'your_steps_library';
const textPlainScenarios = require("testcase.feature")

describe(() => {
    ...
    withGherkin(textPlainScenarios, new Steps())
        .runScenario("Scenario 1");
})

```