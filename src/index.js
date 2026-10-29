import fs from 'node:fs';
import { posix, relative, resolve } from 'node:path';

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

/** @type {string} */
let srcFolder;

const isV2Addon = pkg['ember-addon'].version === 2;

if (isV2Addon) {
  srcFolder = 'src';
} else {
  srcFolder = 'addon';
  console.error(`Couldn't determine the ember-addon version. Assuming a classic v1 addon`);
}

/** @type {string[]} */
const localStuff = fs.readdirSync(`./${srcFolder}/`, { recursive: true, encoding: 'utf8' });

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
      fullPath: resolve(`./${srcFolder}/`, item),
      path: item.replace(extensionRegex, ''),
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension
    })
      // item.replace(/^components\//, '').replace(extensionRegex, ''));
  }

  if (item.startsWith('helpers/')) {
    availableHelpers.push({
      fullPath: resolve(`./${srcFolder}/`, item),
      path: item.replace(extensionRegex, ''),
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension,
    })
    // availableHelpers.push(item.replace(/^helpers\//, '').replace(extensionRegex, ''));
  }

  if (item.startsWith('modifiers/')) {
    availableModifiers.push({
      fullPath: resolve(`./${srcFolder}/`, item),
      path: item.replace(extensionRegex, ''),
      barePath: item.replace(barePathRegex, '').replace(extensionRegex, ''),
      extension,
    });
      
      // item.replace(/^modifiers\//, '').replace(extensionRegex, ''));
  }
}

/**
 * This function is here just to smooth the difference between v2 addon relative path resolutions
 * and the v1 addon package-name resolutions
 * @param {string} filename 
 * @param {Invokable} item 
 */
function resolveWith(filename, item) {
  if(isV2Addon) {
    return relative(filename, item.fullPath);
  } else {
    return posix.join(pkg.name, item.path);
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
      return resolveWith(filename, component);
    }
  }

  if (basePath.startsWith('helpers/')) {
    const helper = availableHelpers.find(item => item.barePath === barePath);

    if (helper) {
      return resolveWith(filename, helper);
    }
  }

  if (basePath.startsWith('modifiers/')) {
    const modifier = availableModifiers.find(item => item.barePath === barePath);

    if (modifier) {
      return resolveWith(filename, modifier);
    }
  }

  // now we need to deal with the ambiguous ones!

  const component = availableComponents.find((item => item.barePath === barePath))

  if (component) {
    return resolveWith(filename, component);
  }

  const helper = availableHelpers.find(item => item.barePath === barePath);

  if (helper) {
    return resolveWith(filename, helper);
  }

  const modifier = availableModifiers.find(item => item.barePath === barePath);

  if (modifier) {
    return resolveWith(filename, modifier);
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