const path = require('path');

module.exports = {
  entry: {
    status: './src/client/status.ts',
    dashboard: './src/client/dashboard.ts',
    export: './src/client/export.ts',
    monitor: './src/client/monitor.ts'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'production',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist/static'),
  },
};