# mint-ui-lit [![Build Status](https://travis-ci.com/mintproject/mint-ui-lit.svg?branch=master)](https://travis-ci.com/mintproject/mint-ui-lit)

New version of the MINT-UI 

## Version

### Active

| Url                            | Name        | GitHub                                       | Firebase  |
|--------------------------------|-------------|----------------------------------------------|-----------|
| https://dev.mint.isi.edu       | Development | The last commit on dev branch                | MINT-FULL |
| https://formative.mint.isi.edu | Formative   | The last commit on MINT-Formative branch     | MINT      |
| https://mint.isi.edu           | Full        | The last release on master branch            | MINT-FULL |
| https://demo.mint.isi.edu      | Demo        | The last commit on MINT-demo branch          | MINT-DEMO |

### Snapshots
- <https://demo.mint.isi.edu> DEMO release
- <https://old.mint.isi.edu> Old release

## Deploy

The deployment of the following the services is full-automatic:

- <https://dev.mint.isi.edu>
- <https://formative.mint.isi.edu>

The deployment of the production webpage needs a manual step.

- <https://mint.isi.edu> points the last release/tag on GitHub - MINT version: Full

Wait! How I can deploy a new version?

- Create a release on GitHub https://github.com/mintproject/mint-ui-lit/releases
- For example, I created the version 0.1 https://github.com/mintproject/mint-ui-lit/releases/tag/v0.1
- If the deploy is correct then you can login on mint-server as mintui and see the directory.
- You can check the status of deploy at travis-ci.com/mintproject/mint-ui-lit/builds/

```
[mintui@mint ~]$ ssh mint.isi.edu -l mintui
[mintui@mint ~]$ ls -l
lrwxrwxrwx 1 mintui mintui 11 Aug 20 08:20 mintui_production -> mintui_v0.0.1
drwxrwxr-x 3 mintui mintui 50 Aug 20 08:18 mintui_v0.1
```

You can see that the actual version is v0.0.1

- In this case, we want change the production version from v0.0.1 to v0.1. How?

```
[mintui@mint ~]$ unlink mintui_production; ln -s mintui_v0.1 mintui_production
```

- Yay, you did it!
- Is the release broken? Relax, you can rollback to a previous version. How?

```
[mintui@mint ~]$ unlink mintui_production; ln -s mintui_v0.0.1 mintui_production
```


## INSTALL
```
yarn install
```

You will need to set the configuration for firebase through enviroment variables:
```
export FIREBASE_API_KEY=
export FIREBASE_AUTH_DOMAIN=
export FIREBASE_DATABASE_URL=
export FIREBASE_PROJECT_ID=
export FIREBASE_STORAGE_BUCKET=
export FIREBASE_MESSAGING_SENDER_ID=
export FIREBASE_APP_ID=
export GOOGLE_MAPS_API_KEY=
```

If you want to add new variables, please check `webpack/base.config.ts`

## BUILDING

To create the production build use:
```
yarn create-build
```

You can start the development server with:
```
yarn start
```

Or build the development version with:
```
yarn create-build-dev
```
