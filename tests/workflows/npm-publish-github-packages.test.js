'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const WORKFLOW_PATH = path.join(
  __dirname,
  '..',
  '..',
  '.github',
  'workflows',
  'npm-publish-github-packages.yml'
);

let rawYaml;
let workflow;

test.before(() => {
  rawYaml = fs.readFileSync(WORKFLOW_PATH, 'utf8');
  workflow = yaml.load(rawYaml);
});

test('workflow file exists and is readable', () => {
  assert.ok(fs.existsSync(WORKFLOW_PATH), 'expected workflow file to exist');
});

test('workflow file parses as valid YAML', () => {
  assert.doesNotThrow(() => yaml.load(rawYaml));
  assert.equal(typeof workflow, 'object');
  assert.notEqual(workflow, null);
});

test('workflow file does not contain tab characters (YAML indentation regression)', () => {
  assert.ok(!rawYaml.includes('\t'), 'workflow YAML should use spaces, not tabs');
});

test('workflow has the expected top-level name', () => {
  assert.equal(workflow.name, 'Node.js Package');
});

test('workflow triggers only on release creation', () => {
  assert.ok(workflow.on, 'expected an "on" trigger to be defined');
  assert.deepEqual(Object.keys(workflow.on), ['release']);
  assert.deepEqual(workflow.on.release.types, ['created']);
});

test('workflow defines exactly two jobs: build and publish-gpr', () => {
  assert.ok(workflow.jobs, 'expected jobs to be defined');
  assert.deepEqual(Object.keys(workflow.jobs), ['build', 'publish-gpr']);
});

test('build job runs on ubuntu-latest', () => {
  assert.equal(workflow.jobs.build['runs-on'], 'ubuntu-latest');
});

test('build job checks out the repository and sets up Node.js 20', () => {
  const steps = workflow.jobs.build.steps;
  assert.ok(Array.isArray(steps) && steps.length === 4, 'expected 4 steps in build job');

  assert.equal(steps[0].uses, 'actions/checkout@v4');

  assert.equal(steps[1].uses, 'actions/setup-node@v4');
  assert.equal(steps[1].with['node-version'], 20);
  assert.equal(
    steps[1].with['registry-url'],
    undefined,
    'build job should not configure a publish registry'
  );
});

test('build job installs dependencies with npm ci and runs tests if present', () => {
  const steps = workflow.jobs.build.steps;
  assert.equal(steps[2].run, 'npm ci');
  assert.equal(steps[3].run, 'npm test --if-present');
});

test('publish-gpr job depends on the build job completing successfully', () => {
  assert.equal(workflow.jobs['publish-gpr'].needs, 'build');
});

test('publish-gpr job runs on ubuntu-latest', () => {
  assert.equal(workflow.jobs['publish-gpr']['runs-on'], 'ubuntu-latest');
});

test('publish-gpr job requests least-privilege permissions', () => {
  const permissions = workflow.jobs['publish-gpr'].permissions;
  assert.deepEqual(permissions, { contents: 'read', packages: 'write' });
});

test('publish-gpr job checks out the repository and configures the GitHub Packages registry', () => {
  const steps = workflow.jobs['publish-gpr'].steps;
  assert.ok(Array.isArray(steps) && steps.length === 4, 'expected 4 steps in publish-gpr job');

  assert.equal(steps[0].uses, 'actions/checkout@v4');

  assert.equal(steps[1].uses, 'actions/setup-node@v4');
  assert.equal(steps[1].with['node-version'], 20);
  assert.equal(steps[1].with['registry-url'], 'https://npm.pkg.github.com/');
});

test('publish-gpr job installs dependencies and publishes the package using an authenticated token', () => {
  const steps = workflow.jobs['publish-gpr'].steps;
  assert.equal(steps[2].run, 'npm ci');

  const publishStep = steps[3];
  assert.equal(publishStep.run, 'npm publish');
  assert.ok(publishStep.env, 'expected an env block on the publish step');
  assert.equal(publishStep.env.NODE_AUTH_TOKEN, '${{secrets.GITHUB_TOKEN}}');
});

test('build job does not have write permissions or publish steps (build should only test)', () => {
  const buildJob = workflow.jobs.build;
  assert.equal(buildJob.permissions, undefined);
  const hasPublishStep = buildJob.steps.some(
    (step) => typeof step.run === 'string' && step.run.includes('npm publish')
  );
  assert.equal(hasPublishStep, false);
});

test('only the publish-gpr job references the NODE_AUTH_TOKEN secret', () => {
  const buildStepsWithEnv = workflow.jobs.build.steps.filter((step) => step.env);
  assert.deepEqual(buildStepsWithEnv, []);
});