# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands
- `yarn start` - Start development server with hot reload
- `yarn build` - Create production build
- `yarn test` - Run Jest tests
- `yarn test:watch` - Run tests in watch mode
- `yarn lint` - Run linting via Gulp

### Build Variants
- `yarn create-build` - Create production build via Webpack
- `yarn create-build-dev` - Create development build via Webpack
- `yarn start-wildfire` - Start development server for wildfire configuration

### Other Commands
- `yarn gulp` - Run Gulp tasks directly
- `yarn serve` - Serve built files using prpl-server

## Architecture Overview

### Technology Stack
- **Framework**: LitElement (Web Components) with TypeScript
- **State Management**: Redux with Redux Thunk for async actions
- **Build System**: Webpack 4 with TypeScript, Babel, and custom loaders
- **Styling**: CSS modules with PostCSS and Sass support
- **Testing**: Jest with ts-jest for TypeScript support
- **GraphQL**: Apollo Client for GraphQL queries and subscriptions

### Project Structure

#### Core Application (`src/app/`)
- `mint-app.ts` - Main application component with routing
- `store.ts` - Redux store configuration with lazy reducer loading
- `actions.ts` & `reducers.ts` - Core app state management
- `ui-actions.ts` & `ui-reducers.ts` - UI-specific state management

#### Feature Modules (`src/screens/`)
Each screen follows the same pattern:
- `actions.ts` - Redux actions for the feature
- `reducers.ts` - Redux reducers and state types
- `ui-actions.ts` & `ui-reducers.ts` - UI-specific state (where applicable)
- Main component files (e.g., `modeling-home.ts`)

**Key Screens:**
- `modeling/` - Problem statement management and modeling workflows
- `datasets/` - Data catalog browsing and dataset management
- `models/` - Model catalog and configuration management
- `regions/` - Geographic region management
- `analysis/` - Data analysis and visualization
- `variables/` - Variable management
- `messages/` - User messaging system
- `emulators/` - Model emulation functionality

#### Components (`src/components/`)
Reusable UI components following LitElement patterns.

#### Configuration (`src/config/`)
- `config.ts` - Runtime configuration from window variables
- `default-graph.ts` - Default GraphQL configuration
- `graphql.ts` - GraphQL client setup

#### Utilities (`src/util/`)
- `state_functions.ts` - Redux state selectors
- `ui_functions.ts` & `ui_renders.ts` - UI utility functions
- `graphql_adapter.ts` - GraphQL client utilities
- `datacatalog/` - Data catalog abstraction layer

### State Management
- Uses Redux with lazy reducer loading via `pwa-helpers/lazy-reducer-enhancer`
- Each screen module has its own reducer that gets loaded when needed
- State is typed with TypeScript interfaces
- Async actions handled with Redux Thunk

### Configuration System
The app uses a window-based configuration system where config values are set on `window.REACT_APP_*` variables (despite being a LitElement app, not React). Key configuration areas:
- API endpoints (GraphQL, Model Catalog, Data Catalog)
- Authentication settings (OAuth2 support)
- Execution engines (LocalEx, Wings)
- External service integrations

### GraphQL Integration
- Uses Apollo Client for GraphQL operations
- Query files organized in `src/queries/` by feature
- Fragments for reusable query parts
- Subscription support for real-time updates

### Testing
- Jest configuration supports TypeScript and path mapping
- Test files can be `__tests__/*.test.ts` or `*.test.ts`
- Module path mapping matches the src directory structure

### Build System
- Webpack 4 with TypeScript and Babel compilation
- Custom CSS loader for LitElement styles
- Service worker integration with Workbox
- Multiple build configurations (dev, prod, wildfire)

## Development Notes

### Component Patterns
- LitElement components use decorators (`@customElement`, `@property`)
- Redux connection via `connect(store)` mixin from pwa-helpers
- Shared styles imported from `styles/shared-styles`

### Import Patterns
- Path aliases configured in Webpack: `@components`, `@actions`, `@reducers`
- Module resolution starts from `src/` directory
- GraphQL queries imported as modules with `.graphql` extension

### Authentication
The app supports OAuth2 with multiple grant types and providers (Keycloak, Tapis) configured through the config system.