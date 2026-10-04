const MAX_Attributes = {
  AGE: 80,
  SIBSP: 8,
  FARE: 512,
  PARCH: 6,
  CLASS: 3,
};
const formatClass = (v) => {
  switch (v) {
    case 1:
      return 3;
    case 3:
      return 1;
    default:
      return 2;
  }
};

class Utility {
  static Format(dataset) {
    let newlist = [];
    for (let i = 0; i < dataset.length; i++) {
      let item = dataset[i];

      if (
        item.Survived == "" ||
        item.Pclass == "" ||
        item.Sex == "" ||
        item.Age == "" ||
        item.SibSp == "" ||
        item.Parch == "" ||
        item.Fare == "" ||
        item.Embarked == ""
      ) {
        continue;
      }

      newlist = [
        ...newlist,
        {
          id: item.PassengerId,
          Survived: parseInt(item.Survived),
          Pclass: formatClass(parseInt(item.Pclass)),
          Sex: item.Sex == "male" ? 1 : 0,
          Age: parseInt(item.Age) / MAX_Attributes.AGE,
          SibSp: parseInt(item.SibSp) / MAX_Attributes.SIBSP,
          Parch: parseInt(item.Parch) / MAX_Attributes.PARCH,
          Fare: parseFloat(item.Fare) / MAX_Attributes.FARE,
          Embarked:
            item.Embarked == "C"
              ? [1, 0, 0]
              : item.Embarked == "S"
                ? [0, 1, 0]
                : [0, 0, 1],
        },
      ];
    }

    return newlist;
  }

  static seedRandom(seed) {
    return function () {
      // Standard LCG parameters (numerical constants used by glibc)
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
  }

  // Implementation of the Fisher-Yates Shuffle using the custom PRNG
  static reproducibleShuffle(array, seed) {
    // Create a shallow copy to keep the original array immutable
    const shuffled = [...array];
    const random = Utility.seedRandom(seed);

    for (let i = shuffled.length - 1; i > 0; i--) {
      // Generate a reproducible random index between 0 and i
      const j = Math.floor(random() * (i + 1));

      // Swap elements using ES6 destructuring
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  static train_test_split(dataset) {
    let train_size = Math.floor(dataset.length * 0.95);
    return {
      train: dataset.slice(0, train_size),
      test: dataset.slice(train_size, dataset.length),
    };
  }
}

class Algorithm {
  static vectorEuclidean(v1, v2) {
    let sum = 0;

    for (let i = 0; i < v1.length; i++) {
      sum += Math.pow(v1[i] - v2[i], 2);
    }

    return sum;
  }

  static vectorManhatan(v1, v2) {
    let sum = 0;

    for (let i = 0; i < v1.length; i++) {
      sum += Math.abs(v1[i] - v2[i]);
    }

    return sum;
  }

  static manhattan(obj1, obj2) {
    let distance = 0;

    for (let key in obj1) {
      if (key !== "Survived" && key !== "Embarked" && key!== "id") {
        distance += Math.abs(obj1[key] - obj2[key]);
      }
    }

    distance += Algorithm.vectorManhatan(obj1.Embarked, obj2.Embarked);

    return distance;
  }

  static Euclidean(obj1, obj2) {
    let distance = 0;

    for (let key in obj1) {
      if (key !== "Survived" && key !== "Embarked" && key!== "id") {
        distance += Math.pow(obj1[key] - obj2[key], 2);
      }
    }

    distance += Algorithm.vectorEuclidean(obj1.Embarked, obj2.Embarked);

    return Math.sqrt(distance);
  }
  static KNN(observation, dataset, k) {
    let list_distances = [];

    dataset.forEach((item) => {
      list_distances.push({
        distance: Algorithm.Euclidean(item, observation),
        item,
      });
    });

    //sort the list
    list_distances.sort((a, b) => a.distance - b.distance);

    list_distances = list_distances.slice(0, k);

    //majority voting

    let votes = {
      survived: 0,
      perished: 0,
    };

    list_distances.forEach((item) => {
      if (item.item.Survived == 1) {
        votes["survived"] += 1;
      } else {
        votes["perished"] += 1;
      }
    });

    return votes.survived > votes.perished
      ? { prediction: 1 }
      : { prediction: 0 };
  }
}

module.exports = { Utility, Algorithm };
