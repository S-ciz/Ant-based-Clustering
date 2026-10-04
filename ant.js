const dataset = require('./data.js')
const {Utility} = require("./Algorithms.js")

const SEED = 45;

let result = Utility.Format(dataset)

result = Utility.reproducibleShuffle(result, SEED)

let {train, test} = Utility.train_test_split(result)
let students = train;


// --------------------------------------------------
// ACO PARAMETERS
// --------------------------------------------------

let Student_Pheromone = {};

students.forEach(student => {
    Student_Pheromone[student.id] = {
        c1: 1,
        c2: 1
    };
});

const numAnts = 30;
const numIterations = 150;

// Evaporation rate
const P = 0.1;


// --------------------------------------------------
// INITIALIZE CLUSTERS
// --------------------------------------------------

const initializeCluster = () => {

    let cluster = {
        c1: [],
        c2: []
    };

    let idx1 = Math.floor(Math.random() * students.length);

    let idx2;

    do {
        idx2 = Math.floor(Math.random() * students.length);
    } while (idx2 === idx1);

    cluster.c1.push(students[idx1]);
    cluster.c2.push(students[idx2]);

    return cluster;
};


// --------------------------------------------------
// HEURISTIC
// --------------------------------------------------

const heuristic = (distance) => {
    return 1 / (distance + 0.01);
};


// --------------------------------------------------
// CALCULATE CENTROID
// --------------------------------------------------

const clusterCentroid = (cluster) => {

    const sumPclass = cluster.reduce(
        (sum, student) => sum + student.Pclass,
        0
    );

    const sumSex = cluster.reduce(
        (sum, student) => sum + student.Sex,
        0
    );

    const sumAge = cluster.reduce(
        (sum, student) => sum + student.Age,
        0
    );
      const sumSibSp = cluster.reduce(
        (sum, student) => sum + student.SibSp,
        0
    );
      const sumParch = cluster.reduce(
        (sum, student) => sum + student.Parch,
        0
    );
      const sumFair = cluster.reduce(
        (sum, student) => sum + student.Fare,
        0
    );

    const n = cluster.length;

    return {
        Pclass: sumPclass / n,
        Sex: sumSex / n,
        Age: sumAge / n,
        SibSp: sumSibSp/n,
        Parch: sumParch/n,
        Fare: sumFair/n
    };
};


// --------------------------------------------------
// EUCLIDEAN DISTANCE
// --------------------------------------------------

const student_centroid_distance = (student, centroid) => {

    let sum = 0;
    

    student = {
        Pclass: student.Pclass,
        Sex: student.Sex,
        Age: student.Age,
        SibSp: student.SibSp,
        Parch: student.Parch,
        Fare: student.Fare
    }

    for (let key in student) {

        if (key !== "id") {

            sum += (
                student[key] - centroid[key]
            ) ** 2;
        }
    }

    return Math.sqrt(sum);
};


// --------------------------------------------------
// CHECK IF STUDENT IS ALREADY IN CLUSTER
// --------------------------------------------------

const studentInCluster = (studentId, cluster) => {

    return cluster.some(
        student => student.id === studentId
    );
};


// --------------------------------------------------
// PHEROMONE EVAPORATION
// --------------------------------------------------

const Evaporate_PLevel = (dictionary) => {

    for (let key in dictionary) {

        dictionary[key].c1 *= (1 - P);
        dictionary[key].c2 *= (1 - P);

        // Prevent pheromone from becoming too small
        dictionary[key].c1 = Math.max(
            dictionary[key].c1,
            0.0001
        );

        dictionary[key].c2 = Math.max(
            dictionary[key].c2,
            0.0001
        );
    }
};


// --------------------------------------------------
// PHEROMONE DEPOSITION
// --------------------------------------------------

const Deposit_PLevel = (best_ant, sse, dictionary) => {

    // const pheromoneDeposit = 1 / (sse + 0.01);
     const pheromoneDeposit = 0.5;


    for (let student of best_ant.c1) {

        dictionary[student.id].c1 += pheromoneDeposit;
    }

    for (let student of best_ant.c2) {

        dictionary[student.id].c2 += pheromoneDeposit;
    }
};


// --------------------------------------------------
// CALCULATE SSE FOR ONE CLUSTER
// --------------------------------------------------

const calculateClusterSSE = (cluster) => {

    if (cluster.length === 0) {
        return 0;
    }

    const centroid = clusterCentroid(cluster);

    let sse = 0;

    for (let student of cluster) {

        const distance =
            student_centroid_distance(
                student,
                centroid
            );

        sse += distance ** 2;
    }

    return sse;
};


// --------------------------------------------------
// CALCULATE TOTAL SSE
// --------------------------------------------------

const calculateTotalSSE = (solution) => {

    const sseC1 = calculateClusterSSE(
        solution.c1
    );

    const sseC2 = calculateClusterSSE(
        solution.c2
    );

    return sseC1 + sseC2;
};


// --------------------------------------------------
// CREATE ONE ANT SOLUTION
// --------------------------------------------------

const createAntSolution = () => {

    let myCluster = initializeCluster();

    for (let student of students) {

        const { id } = student;

        // Skip students already selected as
        // initial cluster representatives
        if (
            studentInCluster(id, myCluster.c1) ||
            studentInCluster(id, myCluster.c2)
        ) {
            continue;
        }


        // Calculate centroids
        const centroid1 =
            clusterCentroid(myCluster.c1);

        const centroid2 =
            clusterCentroid(myCluster.c2);


        // Calculate distances
        const distance1 =
            student_centroid_distance(
                student,
                centroid1
            );

        const distance2 =
            student_centroid_distance(
                student,
                centroid2
            );


        // Calculate heuristic values
        const heuristic1 =
            heuristic(distance1);

        const heuristic2 =
            heuristic(distance2);


        // Pheromone × heuristic
        const pheromoneHeuristicC1 =
            Student_Pheromone[id].c1 *
            heuristic1;

        const pheromoneHeuristicC2 =
            Student_Pheromone[id].c2 *
            heuristic2;


        // Calculate probabilities
        const sum =
            pheromoneHeuristicC1 +
            pheromoneHeuristicC2;

        const probC1 =
            pheromoneHeuristicC1 / sum;

        const probC2 =
            pheromoneHeuristicC2 / sum;


        // Randomly select cluster
        const r = Math.random();

        if (r < probC1) {

            myCluster.c1.push(student);

        } else {

            myCluster.c2.push(student);
        }
    }

    return myCluster;
};


// --------------------------------------------------
// RUN ONE ACO ITERATION
// --------------------------------------------------

const RunClustering = () => {

    let all_solutions = [];

    for (let ant = 0; ant < numAnts; ant++) {

        const solution = createAntSolution();

        all_solutions.push(solution);
    }

    return all_solutions;
};


// --------------------------------------------------
// FIND BEST ANT
// --------------------------------------------------

const getBestAnt = (solutions) => {

    let minSSE = Infinity;
    let best_ant = null;

    for (let solution of solutions) {

        const totalSSE =
            calculateTotalSSE(solution);

        if (totalSSE < minSSE) {

            minSSE = totalSSE;
            best_ant = solution;
        }
    }

    return {
        best_ant,
        qty: minSSE
    };
};


// --------------------------------------------------
// MAIN ACO ALGORITHM
// --------------------------------------------------


function run_ACO_Clustering(){
  console.log("Starting ACO clustering...");

let globalBest = null;
let globalBestSSE = Infinity;


for (
    let iteration = 0;
    iteration < numIterations;
    iteration++
) {

    // ----------------------------------------------
    // 1. Create solutions using ants
    // ----------------------------------------------

    const solutions = RunClustering();


    // ----------------------------------------------
    // 2. Find best solution in this iteration
    // ----------------------------------------------

    const {
        best_ant,
        qty
    } = getBestAnt(solutions);


    // ----------------------------------------------
    // 3. Update global best
    // ----------------------------------------------

    if (qty < globalBestSSE) {

        globalBestSSE = qty;
        globalBest = best_ant;
    }


    // ----------------------------------------------
    // 4. Evaporate pheromone
    // ----------------------------------------------

    Evaporate_PLevel(
        Student_Pheromone
    );
    
    


    // ----------------------------------------------
    // 5. Deposit pheromone from best ant
    // ----------------------------------------------

    Deposit_PLevel(
        best_ant,
        qty,
        Student_Pheromone
    );

    
    //show how p level be updating...
    // if(iteration%50 == 0) 
    // {
    //     console.log("printing p level...")
    //     console.log(Student_Pheromone)
    // }


    // ----------------------------------------------
    // 6. Display progress
    // ----------------------------------------------

    console.log(
        `Iteration ${iteration + 1} | ` +
        `Best SSE: ${qty.toFixed(6)}`
    );
 
}

return {globalBest, globalBestSSE}

}


//PREDICTIONS
const testAccuracy = (testStudents, globalBest) => {

    // -----------------------------------------
    // 1. Determine what C1 represents
    // -----------------------------------------

    const c1Survived = globalBest.c1.filter(
        student => student.Survived === 1
    ).length;

    const c1Died = globalBest.c1.filter(
        student => student.Survived === 0
    ).length;


    // -----------------------------------------
    // 2. Determine what C2 represents
    // -----------------------------------------

    const c2Survived = globalBest.c2.filter(
        student => student.Survived === 1
    ).length;

    const c2Died = globalBest.c2.filter(
        student => student.Survived === 0
    ).length;


    // Cluster's predicted class = majority class
    const c1Class = c1Survived >= c1Died ? 1 : 0;
    const c2Class = c2Survived >= c2Died ? 1 : 0;


    // -----------------------------------------
    // 3. Test observations
    // -----------------------------------------

    const centroid1 = clusterCentroid(globalBest.c1);
    const centroid2 = clusterCentroid(globalBest.c2);

    let correct = 0;
    let total = testStudents.length;

    const predictions = [];


    for (const student of testStudents) {

        const distance1 =
            student_centroid_distance(student, centroid1);

        const distance2 =
            student_centroid_distance(student, centroid2);


        // Assign to closest cluster
        const predictedCluster =
            distance1 < distance2 ? "c1" : "c2";


        // Convert cluster to predicted survival class
        const predictedSurvived =
            predictedCluster === "c1"
                ? c1Class
                : c2Class;


        // Check prediction
        if (predictedSurvived === student.Survived) {
            correct++;
        }


        predictions.push({
            id: student.id,
            actualSurvived: student.Survived,
            predictedSurvived,
            predictedCluster,
            distanceC1: distance1,
            distanceC2: distance2
        });
    }


    // -----------------------------------------
    // 4. Calculate accuracy
    // -----------------------------------------

    const accuracy = correct / total;

    const accuracyPercentage = accuracy * 100;


    return {
        correct,
        total,
        accuracy,
        accuracyPercentage,
        predictions,

        clusterInfo: {
            c1: {
                survived: c1Survived,
                died: c1Died,
                predictedClass: c1Class
            },

            c2: {
                survived: c2Survived,
                died: c2Died,
                predictedClass: c2Class
            }
        }
    };
};

let {globalBest, globalBestSSE} = run_ACO_Clustering()

const prediction_results = testAccuracy(test, globalBest);


console.log("Correct:", prediction_results.correct);
console.log("Total:", prediction_results.total);
console.log("Accuracy:", prediction_results.accuracyPercentage.toFixed(2) + "%");

