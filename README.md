# Deriv Candle Data Interface

A lightweight web application to fetch and export candle data from Deriv trading platform.

## Features

- Select from symbols: C600, C900, B900, B1000
- Choose timeframes: 1h, 4h, 1d
- Select number of candles: 50 or 100
- View high and low values for each candle
- Export data to CSV file

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Running Locally

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

The built files will be in the `dist/` directory and can be served by any static file server.

## Usage

1. Select a symbol from the dropdown (C600, C900, B900, or B1000)
2. Choose a timeframe (1h, 4h, or 1d)
3. Select the number of candles (50 or 100)
4. The data will automatically load when you change any parameter
5. Click "Export to CSV" to download the data

## Technology Stack

- **React** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **WebSocket** for real-time API communication with Deriv

## Project Structure

```
deriv/
├── src/
│   ├── components/     # React components
│   ├── services/       # API service
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── package.json
└── vite.config.ts
```

## Notes

- The application connects to Deriv's WebSocket API
- Data is fetched in real-time when parameters change
- CSV export includes: Symbol, Timeframe, Candle Number, High, Low

## API Configuration

The application uses a demo App ID (`1089`) for testing. For production use:

1. Register your application at [Deriv API Token](https://app.deriv.com/account/api-token)
2. Get your App ID
3. Update the `APP_ID` constant in `src/services/derivApi.ts`

**Note**: The demo App ID may have rate limits. For production use, you should register your own App ID.

