# ember-template-tag-addon-resolver

This is a custom resolver that is intended to be a (slightly hacky) way to run the [official GJS Codemod](https://github.com/embroider-build/embroider/tree/main/packages/template-tag-codemod#embroidertemplate-tag-codemod) on a classic v1 addon or a v2 addon that was generated with the [legacy v2 addon blueprint](https://github.com/embroider-build/addon-blueprint) 

## Usage

You need to install this locally to be able to get the template tag codemod to resolve it correctly: 

```
pnpm i ember-template-tag-addon-resolver
```

then you can run the template tag codemod on your addon using this module as a **custom resolver**

```
pnpx @embroider/template-tag-codemod --components="addon/components/**/*" --customResolver=ember-template-tag-addon-resolver
```

## Notice on stability

This is very lightly tested and depends on [a few hacks](https://github.com/embroider-build/embroider/issues/2563) to actually get it running. Ultimately we will have a better migration strategy for addon developers converting their components and tests to GJS but for now this is a good test-bed for the challenges we are facing

Note: this also has different behaviour for v1 addons and v2 addons. The "more modern" way to import things internally in a package is to use relative paths with extensions, but extensions don't work in v1 addons and relative paths are not **file paths** but instead they are **relative paths between AMD names** which is super counter-intuative. This means that if you use this resolver on a v1 addon it will import paths from `package-name/path/to/modules` instead of using relative paths