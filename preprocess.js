let csv2json = require("csv2json")
let fs = require('fs')

fs.createReadStream('./dataset/data.csv')
.pipe(csv2json())
.pipe(fs.createWriteStream("data.json"))