const mongoose = require('mongoose');
const connectMongo = (mongo) => {
    mongoose.connect(mongo, {
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
        useNewUrlParser: true
    });
};

module.exports = { connectMongo };

