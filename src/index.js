import fs from 'node:fs';
import { relative, resolve } from 'node:path';

/** @type {string[]} */
const localStuff = fs.readdirSync('./src/', { recursive: true, encoding: 'utf8' });

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

const barePathRegex = /^(components|helpers|ambiguous|modifiers)\//;

/** 
 * @typedef {Object} Invokable 
 * @property {string} path
 * @property {string} fullPath
 * @property {string} barePath
 * @property {string} extension
 **/

/** @type {Invokable[]} */
const availableComponents = [];

/** @type {Invokable[]} */
const availableHelpers = [];

/** @type {Invokable[]} */
const availableModifiers = [];

const extensionRegex = /\.(hbs|ts|js|gts|gjs)$/;

for (const item of localStuff) {
  const result = extensionRegex.exec(item);
  if(!result) {
    // probably a directory
    continue;
  }
  const extension = result[1];

  if (item.startsWith('components/')) {
    availableComponents.push({
      fullPath: resolve('./src/', item),
      path: item,
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension
    })
      // item.replace(/^components\//, '').replace(extensionRegex, ''));
  }
  if (item.startsWith('helpers/')) {
    availableHelpers.push({
      fullPath: resolve('./src/', item),
      path: item,
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension,
    })
    // availableHelpers.push(item.replace(/^helpers\//, '').replace(extensionRegex, ''));
  }

  if (item.startsWith('modifiers/')) {
    availableModifiers.push({
      fullPath: resolve('./src/', item),
      path: item,
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension,
    });
      
      // item.replace(/^modifiers\//, '').replace(extensionRegex, ''));
  }
}

/**
 * 
 * @param {string} path 
 * @param {string} filename
 * @returns 
 */
function resolveVirtualInvokable(path, filename) {
  let basePath = path.replace('@embroider/virtual/', '');
  const barePath = basePath.replace(barePathRegex, '');

  if (basePath.startsWith('components/')) {
    const component = availableComponents.find((item => item.barePath === barePath))

    if(component) {
      return relative(filename, component.fullPath);
    }
  }

  if (basePath.startsWith('helpers/')) {
    const helper = availableHelpers.find(item => item.barePath === barePath);

    if (helper) {
      return relative(filename, helper.fullPath);
    }
  }

  if (basePath.startsWith('modifiers/')) {
    const modifier = availableModifiers.find(item => item.barePath === barePath);

    if (modifier) {
      return relative(filename, modifier.fullPath);
    }
  }

  // now we need to deal with the ambiguous ones!

  const component = availableComponents.find((item => item.barePath === barePath))

  if (component) {
    return relative(filename, component.fullPath);
  }

  const helper = availableHelpers.find(item => item.barePath === barePath);

  if (helper) {
    return relative(filename, helper.fullPath);
  }

  const modifier = availableModifiers.find(item => item.barePath === barePath);

  if (modifier) {
    return relative(filename, modifier.fullPath);
  }
}

// I set resolve as any here because we're just passing it through and it doesn't matter to this use case
/**
 * 
 * @param {string} path 
 * @param {string} filename 
 * @param {any} resolve 
 * @returns 
 */
export default async function (path, filename, resolve) {
  let localResolution = resolveVirtualInvokable(path, filename);

  if (localResolution) {
    return localResolution;
  }

  await resolve(path, filename);
}