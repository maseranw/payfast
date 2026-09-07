const fs = require("fs");
const path = require("path");

const content = `{
  "type": "commonjs"
}
`;

fs.mkdirSync(path.join(__dirname, "../dist/cjs"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "../dist/cjs/package.json"), content);
