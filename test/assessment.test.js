const assert = require("node:assert/strict");
const { DIMENSIONS, QUESTIONS, scoreAssessment, validateAnswers } = require("../src/assessment");

const byDimension = Object.fromEntries(
  DIMENSIONS.map((dimension) => [
    dimension.id,
    QUESTIONS.filter((question) => question.dimension === dimension.id)
  ])
);

function answersFor(levels) {
  const answers = {};
  Object.entries(byDimension).forEach(([dimensionId, questions]) => {
    const value = levels[dimensionId];
    questions.forEach((question) => {
      answers[question.id] = value;
    });
  });
  return answers;
}

function resultFor(levelValues) {
  return scoreAssessment(answersFor(levelValues)).result.label;
}

assert.equal(QUESTIONS.length, 12);
DIMENSIONS.forEach((dimension) => {
  assert.equal(byDimension[dimension.id].length, 3, `${dimension.label} should have 3 questions`);
});

assert.equal(
  resultFor({
    equipmentValue: 2,
    downtimeImpact: 2,
    dataFoundation: 1,
    teamCapability: 1
  }),
  "立刻上"
);

assert.equal(
  resultFor({
    equipmentValue: 2,
    downtimeImpact: 2,
    dataFoundation: 0,
    teamCapability: 0
  }),
  "试点"
);

assert.equal(
  resultFor({
    equipmentValue: 1,
    downtimeImpact: 1,
    dataFoundation: 0,
    teamCapability: 0
  }),
  "暂缓"
);

assert.equal(
  resultFor({
    equipmentValue: 0,
    downtimeImpact: 0,
    dataFoundation: 2,
    teamCapability: 2
  }),
  "不必上"
);

const invalid = answersFor({
  equipmentValue: 2,
  downtimeImpact: 2,
  dataFoundation: 2,
  teamCapability: 2
});
delete invalid.ev_cost;
assert.ok(validateAnswers(invalid).length > 0);

console.log("assessment scoring tests passed");
