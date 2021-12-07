npm init -y
npm install google-closure-library
npm install --save-dev google-closure-compiler

 $(npm bin)/google-closure-compiler \
   --js third_party/punycode.js \
   --js dialog.js \
   --js node_modules/google-closure-library/**/*.js \
   --dependency_mode=PRUNE \
   --entry_point=goog:dialog \
   --js_output_file dialog_compiled.js
