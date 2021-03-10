const mongoose = require('mongoose');

const mongo = process.env.MONGODB;
mongoose.connect(mongo, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useNewUrlParser: true
});

