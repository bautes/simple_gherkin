import jest from "@jest/globals";
import { parseGherkin } from "../index";

const _feature = `
Feature: Home Page Loaded

    Will present the Home Page Loaded with the cards

    Scenario: Loads the page
        Given the user has loaded the homepage
        When no interaction
        Then will load all the items

    Scenario: Filters Results
        Given the user has loaded the homepage
        When enters <filter_input>
        Then will load <number_cards>

        Examples:
            | filter_input | number_cards |
            | whatever     | 0            |
            | the          | 32           |
            | joe          | 3            |
            | music        | 11           |
            |              | 100          |
`;

jest.test("parseGherkin", () => {
  jest.expect(parseGherkin("whatever")).toEqual([]);
  const [scenario1, scenario2] = parseGherkin(_feature);
  jest.expect(scenario1?.name).toEqual("Loads the page");
  jest.expect(scenario1?.examples).toEqual([]);
  jest
    .expect(scenario1?.steps)
    .toEqual([
      "Given the user has loaded the homepage",
      "When no interaction",
      "Then will load all the items",
    ]);
  jest.expect(scenario2?.name).toEqual("Filters Results");
  jest.expect(scenario2?.examples).toEqual([
    { filter_input: "whatever", number_cards: "0" },
    { filter_input: "the", number_cards: "32" },
    { filter_input: "joe", number_cards: "3" },
    { filter_input: "music", number_cards: "11" },
    { filter_input: "", number_cards: "100" },
  ]);
  jest
    .expect(scenario2?.steps)
    .toEqual([
      "Given the user has loaded the homepage",
      "When enters <filter_input>",
      "Then will load <number_cards>",
    ]);
});
