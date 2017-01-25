#Vocabulary Classifier
Supervised learning for text classification based on vocabulary analysis. There is also an downloader for facebook pages included.  

##API
``` Javascript
new VocabularyClassifier(redisClient)
.normalizeText(text)
.trainLabel(labelName, text, callback)
.classifyText(labelsArray, text, callback)
.removeLabel(labelName, callback)
.getLabelWordCount(labelName, callback)
.getLabels(callback)
```

##Usage
``` Javascript
//The classifier depends on redis
const redis = require("redis"); 

//Import the classifier
const VocabularyClassifier = require("./VocabularyClassifier.js"); 

//Create a redis client
const client = redis.createClient();

//Create a instance of the Classifier
let classifier = new VocabularyClassifier(client);

//Wait until redis is connected
client.on('connect', function() {

    //Train the classifier with labeled data
    classifier.trainLabel("german", "dies ist ein deutscher text text", function(){

        //Train it again with different labeld data
        classifier.trainLabel("english", "this is an english text", function(){

            //Classify a new text
            classifier.classifyText(["german", "english"], "dies ist", function(wordForWord, reduced){
                
                //Output the result for every word
                console.log(JSON.stringify(wordForWord, null, 3));
                
                //Output the result for the entire text
                console.log(reduced);
                // > [ { label: 'german', score: 3 },
                //     { label: 'english', score: -1 } ]

                //Output the trained labels
                classifier.getLabels(function(result){
                    console.log(result);
                    // > [ 'english', 'german' ]

                    //Remove the labels to free the redis database
                    classifier.removeLabel("german");
                    classifier.removeLabel("english");
                });

            });
        });
    });
});
```

##Example result of .classifyText(...)
###The word for word result
``` Javascript
            "min": 0
         }
      ]
   },
   {
      "word": "ist",
      "result": [
         {
            "label": "german",
            "score": 0.16666666666666666,
            "avg": 0.08333333333333333,
            "avgNormalizedScore": 0.08333333333333333,
            "minNormalizedScore": 0.16666666666666666,
            "min": 0
         },
         {
            "label": "english",
            "score": 0,
            "avg": 0.08333333333333333,
            "avgNormalizedScore": -0.08333333333333333,
            "minNormalizedScore": 0,
            "min": 0
         }
      ]
   }
]
```

###The overall text result
``` Javascript
[ { label: 'german', score: 3 },
  { label: 'english', score: -1 } ]
```
This text is obviously german. 