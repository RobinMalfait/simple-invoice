## Simple Invoice Generator

This is a simple invoice generator tool. The data is in the code there is no database or anything.

### Getting started

1. Install dependencies:

```
npm install
```

2. Copy the example `.env`

```
cp .env.example .env
```

3. Run the project

```
npm run dev
```

### Environment variables

- `CLASSIFIED_MODE` — This is the default value to enable classified mode. Once you change it in the
  application it will be persisted to the database. Classified mode will blur out all numbers and
  personal identifiable information. If you spot a case where this is not true, please report it as
  a bug report.
- `NEXT_PUBLIC_ENVIRONMENT` environment variable

  This variable is used to know which data to load and which design to load.

  - `./src/data/${NEXT_PUBLIC_ENVIRONMENT}.ts` contains all the data for your application.
  - `./src/ui/invoice/designs/${NEXT_PUBLIC_ENVIRONMENT}/invoice.tsx` contains the design for your
    invoices.

  If you want to create a new environment, then you have to make sure that files exists in the above
  mentioned locations and we do the rest.

  Note: Only the `example` environment is visible to Git, the other files and folders are ignored
  by default. But, if you make changes, do make sure you are not comitting real data to a (public)
  repository.

  If you want a different design source file, or different data source file, then you can also set
  these environment variables:

  - `NEXT_PUBLIC_DATA_SOURCE_FILE` — This has precedence over `NEXT_PUBLIC_ENVIRONMENT`
  - `NEXT_PUBLIC_DESIGN_SOURCE_FILE` — This has precedence over `NEXT_PUBLIC_ENVIRONMENT`
