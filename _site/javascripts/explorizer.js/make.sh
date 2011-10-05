#! /bin/bash

rm explorizer.js

cd src

cat core.js         >> code
cat util.js         >> code
cat resizer.js      >> code
cat aligner.js      >> code
cat selector.js     >> code
cat manipulator.js  >> code
cat titlebar.js     >> code
cat locator.js      >> code
cat evtcontroller.js>> code
cat wform.js        >> code

cat intro code outro >> ../explorizer.js
rm code

cd ..
