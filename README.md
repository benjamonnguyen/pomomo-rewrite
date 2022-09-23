# Pomomo

## Requirements:

- npm v8.19.1
- node v18.9.0

## Deployment:

1. configure config/\*.json files, `npm i`, and `tsc: build` for all typescript projects
2. `npm run register-commands` in "./pomomo-bot"
3. `npm run prod` in "./pomomo-bridge"
4. `npm run prod` in "./pomomo-cluster"

### VSCode Extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)