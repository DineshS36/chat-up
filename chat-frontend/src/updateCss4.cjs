const fs = require('fs');
let css = fs.readFileSync('index.css', 'utf-8');

const newCSS = `
/* =========================================
   FLEXBOX COLLAPSE FIXES
   ========================================= */
.msg-bubble {
  display: block !important;
  width: fit-content !important;
  min-width: 50px !important;
}

.msg-content {
  flex-shrink: 0 !important;
  width: auto !important;
  white-space: pre-wrap !important;
}

@media screen and (max-width: 767px) {
  .msg-bubble {
    display: block !important;
    width: fit-content !important;
    min-width: 50px !important;
    max-width: 90% !important;
  }
  
  .msg-content {
    flex-shrink: 0 !important;
    width: auto !important;
    white-space: pre-wrap !important;
  }
}
`;

fs.writeFileSync('index.css', css + newCSS);
console.log('Successfully appended flexbox collapse fixes to index.css');
