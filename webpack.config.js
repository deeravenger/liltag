const path = require('path');

module.exports = {
    entry: './src/liltag.ts',
    output: {
        filename: 'liltag.js',
        path: path.resolve(__dirname, 'dist'),
        library: {
            name: 'LilTag',
            type: 'umd',
            export: 'default',
        },
        globalObject: 'this',  // Ensure compatibility with various environments
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    // Declarations are emitted separately via `tsc --emitDeclarationOnly`
                    // to avoid ts-loader/webpack conflicts.
                    compilerOptions: {
                        declaration: false,
                    },
                },
            }
        ]
    },
    mode: 'production',
    devtool: 'source-map',
    optimization: {
        // Keep the readable (non-minified) bundle in dist/liltag.js; the minified
        // build is produced separately by terser as dist/liltag.min.js.
        minimize: false,
    },
};
