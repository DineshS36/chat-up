const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf-8');

// We find the mobile breakpoint and insert the class
const mobileMediaQueryStart = css.indexOf('@media screen and (max-width: 767px) {');
if (mobileMediaQueryStart !== -1) {
  const insertPosition = css.indexOf('{', mobileMediaQueryStart) + 1;
  const newCss = css.slice(0, insertPosition) + '\n  .mobile-hidden-btn {\n    display: none !important;\n  }\n' + css.slice(insertPosition);
  fs.writeFileSync('index.css', newCss);
  console.log('Successfully updated index.css');
} else {
  console.log('Mobile media query not found!');
}
