import { it, describe, beforeEach } from "vitest";
import { Project } from "fixturify-project";
import { execa } from 'execa';
import { readSync } from "fixturify";
import { join } from 'node:path';
import { expect } from "vitest";

let project = Project.fromDir('./tests/fixtures/v1-addon', { linkDeps: true, linkDevDeps: true });


describe("v2 addon test", () => {
  beforeEach(async () => {
    await project.write();
  })

  it("works", async () => {
    const { stdout, stderr } = await execa({cwd: project.baseDir})`template-tag-codemod --components=addon/components/**/* --customResolver=ember-template-tag-addon-resolver`

    console.log(stdout, stderr)

    const results = readSync(join(project.baseDir, 'addon/components'), {
      ignore: ['node_modules/*']
    })

    expect(results['super-face.gjs']).toMatchInlineSnapshot(`
      "import SecondComponent from "my-silly-v1-addon/components/second-component";
      import fancy from "my-silly-v1-addon/modifiers/fancy";
      <template><SecondComponent {{fancy}}> Hi there </SecondComponent></template>"
    `)

    expect(results['second-component.gjs']).toMatchInlineSnapshot(`
      "import superLog from "my-silly-v1-addon/helpers/super-log";
      <template><h1>I'm another component and I like to {{superLog}}</h1></template>"
    `)

    console.log(results);
  })
})