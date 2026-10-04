const dataset = require('./data.js')
const {Utility, Algorithm} = require("./Algorithms.js")


const K = 5
const SEED = 45;

let result = Utility.Format(dataset)

console.log(`Initial dataset length: ${dataset.length}`)
console.log(`Dataset length after preprocessing: ${result.length}`)

console.log(`Processing difference: ${dataset.length - result.length}`)

//shuffle array. 
result = Utility.reproducibleShuffle(result, SEED)

let {train, test} = Utility.train_test_split(result)

console.log(`train size: ${train.length}, test size: ${test.length}`)



//KNN
let accuracy = 0;

test.forEach(obs=>{
let actual = obs.Survived 



let res = Algorithm.KNN(obs, train, K)

   console.log({...res, actual})
  
    if(res.prediction == actual) 
    {
        accuracy++
    }
    
})

console.log("accuracy", accuracy/ test.length)

// ANT-BASED CLUSTERING

