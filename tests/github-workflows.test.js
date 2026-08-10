'use strict';

/**
 * Tests for the GitHub Actions workflow changes introduced in this PR:
 *  - Removal of .github/workflows/azure-webapps-node.yml
 *  - Addition of .github/workflows/terraform.yml
 *
 * These workflow files are plain YAML/text and this project has no YAML
 * parsing dependency, so the assertions below validate the raw file
 * contents with targeted string/regex checks rather than pulling in a
 * new dependency just for tests.
 */

const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowsDir = path.join(__dirname, '..', '.github', 'workflows');
const terraformWorkflowPath = path.join(workflowsDir, 'terraform.yml');
const azureWorkflowPath = path.join(workflowsDir, 'azure-webapps-node.yml');

describe('.github/workflows/azure-webapps-node.yml (removed)', () => {
  test('the Azure Web Apps workflow file no longer exists', () => {
    assert.equal(fs.existsSync(azureWorkflowPath), false);
  });

  test('no remaining workflow references the Azure Web Apps deploy action', () => {
    const files = fs.readdirSync(workflowsDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(workflowsDir, file), 'utf8');
      assert.ok(
        !content.includes('azure/webapps-deploy'),
        `${file} should not reference the removed azure/webapps-deploy action`
      );
      assert.ok(
        !content.includes('AZURE_WEBAPP_PUBLISH_PROFILE'),
        `${file} should not reference the removed AZURE_WEBAPP_PUBLISH_PROFILE secret`
      );
    }
  });
});

describe('.github/workflows/terraform.yml (added)', () => {
  let content;

  before(() => {
    content = fs.readFileSync(terraformWorkflowPath, 'utf8');
  });

  test('the Terraform workflow file exists', () => {
    assert.equal(fs.existsSync(terraformWorkflowPath), true);
  });

  test('does not use tab characters for indentation', () => {
    // A common YAML footgun: mixing tabs and spaces breaks parsing.
    assert.ok(!content.includes('\t'), 'workflow file should not contain tab characters');
  });

  test('declares the workflow name', () => {
    assert.match(content, /^name:\s*'Terraform'\s*$/m);
  });

  test('triggers on push to main and on pull_request', () => {
    assert.match(content, /on:\s*\n\s*push:\s*\n\s*branches:\s*\[\s*"main"\s*\]/);
    assert.match(content, /pull_request:\s*$/m);
  });

  test('restricts default token permissions to read-only contents', () => {
    assert.match(content, /^permissions:\s*\n\s*contents:\s*read\s*$/m);
  });

  test('defines a single "terraform" job running on ubuntu-latest with the production environment', () => {
    assert.match(content, /jobs:\s*\n\s*terraform:/);
    assert.match(content, /name:\s*'Terraform'\s*\n\s*runs-on:\s*ubuntu-latest/);
    assert.match(content, /environment:\s*production/);
  });

  test('uses the bash shell by default for run steps', () => {
    assert.match(content, /defaults:\s*\n\s*run:\s*\n\s*shell:\s*bash/);
  });

  test('checks out the repository', () => {
    assert.match(content, /name:\s*Checkout\s*\n\s*uses:\s*actions\/checkout@v4/);
  });

  test('sets up Terraform CLI with the Terraform Cloud API token secret', () => {
    assert.match(content, /name:\s*Setup Terraform\s*\n\s*uses:\s*hashicorp\/setup-terraform@v1/);
    assert.match(content, /cli_config_credentials_token:\s*\$\{\{\s*secrets\.TF_API_TOKEN\s*\}\}/);
  });

  test('runs terraform init', () => {
    assert.match(content, /name:\s*Terraform Init\s*\n\s*run:\s*terraform init\s*$/m);
  });

  test('runs terraform fmt in check mode', () => {
    assert.match(content, /name:\s*Terraform Format\s*\n\s*run:\s*terraform fmt -check\s*$/m);
  });

  test('runs terraform plan without prompting for input', () => {
    assert.match(content, /name:\s*Terraform Plan\s*\n\s*run:\s*terraform plan -input=false\s*$/m);
  });

  test('runs terraform apply only conditionally, without prompting for input', () => {
    assert.match(content, /name:\s*Terraform Apply\s*\n\s*if:\s*.+\n\s*run:\s*terraform apply -auto-approve -input=false\s*$/m);
  });

  test('the Terraform Apply step gates on the push event name', () => {
    const ifMatch = content.match(/name:\s*Terraform Apply\s*\n\s*if:\s*(.+)\n/);
    assert.ok(ifMatch, 'expected to find an `if:` condition on the Terraform Apply step');
    assert.match(ifMatch[1], /github\.event_name == 'push'/);
  });

  test('pins the exact current Terraform Apply guard condition (regression)', () => {
    // Pins the current condition verbatim so that any future edit to this
    // guard (e.g. fixing the quoting around "main") is a conscious,
    // reviewed change rather than an accidental regression.
    const ifMatch = content.match(/name:\s*Terraform Apply\s*\n\s*if:\s*(.+)\n/);
    assert.ok(ifMatch);
    assert.equal(
      ifMatch[1].trim(),
      `github.ref == 'refs/heads/"main"' && github.event_name == 'push'`
    );
  });

  test('every "run:" step has non-empty content', () => {
    const runLines = content.match(/^\s*run:\s*(.*)$/gm) || [];
    assert.ok(runLines.length > 0, 'expected at least one run: step');
    for (const line of runLines) {
      const value = line.split('run:')[1].trim();
      assert.ok(value.length > 0, `run step should not be empty: "${line}"`);
    }
  });
});