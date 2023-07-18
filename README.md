## Simple Invoice Generator

This is a simple invoice generator tool. The data is in the code there is no database or anything.

### Getting started

1. Install dependencies:

```
npm install
```

2. Run the project

```
npm run dev
```

### Changing data

All data is imported from `./src/data/index.ts`, there is also an example data set available in
`./src/data/example.ts`. This file contains account info and invoices information.

You can add a custom `./src/data/production.ts` if you want, just make sure to update the reference
in `./src/data/index.ts`.

### Changing invoice designs

All pages that require a design for the actual invoice, will import the design from
`./src/ui/invoice/design.tsx`.

You can add your own designs in the `./src/ui/invoice/designs/`
folder and change the design that should be used in `./src/ui/invoice/design.tsx`.
