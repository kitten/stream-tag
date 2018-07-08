const { NODE_ENV, BABEL_ENV } = process.env
const transpileToCommon = BABEL_ENV === "commonjs" || NODE_ENV === "test"

module.exports = {
  presets: [
    "@babel/preset-typescript",
    [
      "@babel/preset-env",
      {
        modules: transpileToCommon ? "commonjs" : false,
        loose: true,
        targets: {
          node: "8.11.0",
        },
      },
    ],
  ],
  plugins: [
    BABEL_ENV === "commonjs" && "babel-plugin-add-module-exports"
  ].filter(Boolean),
}
