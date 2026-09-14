import { it, describe, beforeEach } from "vitest";
import { Project } from "fixturify-project";
import { execa } from 'execa';
import { readSync } from "fixturify";
import { join } from 'node:path';
import { expect } from "vitest";

let project = Project.fromDir('./tests/fixtures/v2-addon', { linkDeps: true, linkDevDeps: true });

// these are all hacks that we should probably try to fix upstream
project.linkDevDependency('@ember/optional-features', { baseDir: import.meta.dirname })

describe("basic test", () => {
  beforeEach(async () => {
    await project.write();
  })

  it("works", async () => {
    // const templateTagCodemodPath = require.resolve('@embroider/template-tag-codemod').replace(/\/index.js$/, '/cli.js');
    // console.log(templateTagCodemodPath)

    const { stdout, stderr } = await execa({cwd: project.baseDir})`template-tag-codemod --components=src/components/**/* --customResolver=ember-template-tag-addon-resolver`

    console.log(stdout, stderr)

    const results = readSync(join(project.baseDir, 'src/components'), {
      ignore: ['node_modules/*']
    })

    expect(results['super-face.gjs']).toMatchInlineSnapshot(`
      "import SecondComponent from "../second-component.hbs";
      import fancy from "../../modifiers/fancy.js";
      <template><SecondComponent {{fancy}}> Hi there </SecondComponent></template>"
    `)

    expect(results['second-component.gjs']).toMatchInlineSnapshot(`
      "import superLog from "../../helpers/super-log.js";
      <template><h1>I'm another component and I like to {{superLog}}</h1></template>"
    `)

    console.log(results);
  })
})