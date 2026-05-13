/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require('mongoose');
console.log('FilterQuery exported:', !!mongoose.FilterQuery);
console.log('Mongoose keys:', Object.keys(mongoose).filter(k => k.includes('Query')));
