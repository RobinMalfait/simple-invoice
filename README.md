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

3. Copy the example `.env`

```
cp .env.example .env
```

### Changing data

The `.env` file contains a `DATA_SOURCE_FILE` that points to a file in the `./src/data/` folder.

You can add as many files in the `./src/data/` folder as you want. E.g.: `./src/data/production.ts`
or `./src/data/development.ts`. If you want to switch data sources, then you can update the
`DATA_SOURCE_FILE` environment variable in your `.env`.

### Changing invoice designs

All pages that require a design for the actual invoice, will import the design from
`./src/ui/invoice/design.tsx`.

You can add your own designs in the `./src/ui/invoice/designs/`
folder and change the design that should be used in `./src/ui/invoice/design.tsx`.
