# 3D Printing ServicesWebsite

This project was generated with [App Builder Code Gen](https://www.appbuilder.dev/platform).

## Development server

Run `npm start` to build the application, start a web server and open the application in the default browser. The application will open in `http://localhost:4200/` by default.

## Build

Run `npm run build` to build the application into an output directory.

## Running unit tests

Run `npm test` to execute the unit tests via [Karma](https://karma-runner.github.io). Runs all `.spec.ts` files under `./src` folder.

## Running code style checks

Run `npm run lint` to execute the code styling rules for the project.

## Licensing

See the [License FAQ and Installation documentation](https://www.infragistics.com/products/ignite-ui-angular/angular/components/general/ignite-ui-licensing) for information on how to upgrade to the full licensed package, if the project is using a Trial version of Ignite UI for Angular, and how to setup your environment and CI to use our licensed npm feed.

If you're downloading the project as a .zip file, you still need to follow the steps in the License FAQ to configure access to the licensed feed before installing dependencies.

Alternatively run `npm run infragistics-login` for a guided login to our licensed feed.

## Localization

This project is configured for internationalization (i18n) supporting Bulgarian (default) and English.

### Running Locally

To run the application in different languages during development, use the following commands:

- **Bulgarian (Default):**
  Runs on `http://localhost:4200/`
  ```bash
  npm start
  # OR
  ng serve --configuration=bg
  ```

- **English:**
  Runs on `http://localhost:4201/en/`
  ```bash
  ng serve --configuration=en
  ```

Note: The English version runs on a different port (4201) to allow running both versions simultaneously. The language switcher in the application handles the port redirection automatically in the development environment.

### Extracting Translations

To extract translatable strings from your templates and code, run:

```bash
npm run extract-i18n
```

This command generates `src/locale/messages.json`. You can then use the contents of this file to update `src/locale/messages.en.json`.

## Additional resources

- Ignite UI Angular Schematics were used to generate this project and are available for additional commands within the project. For more details and how to use them, refer to [Angular Schematics & Ignite UI CLI](https://www.infragistics.com/products/ignite-ui-angular/angular/components/general/cli-overview).

- [Ignite UI for Angular](https://www.infragistics.com/products/ignite-ui-angular) - to learn more about the product or to dive into component specifics and showcases.