const Data = require("./Data/LabelsAndSites.js");
const redis = require("redis");
const VocabularyClassifier = require("./Includes/VocabularyClassifier.js");

const merkmale = Data.merkmale;
const client = redis.createClient();

client.on('connect', function() {
    client.select(1, function(err, res){ 
        if(err != null)
            console.log(err)
        else
        {
            classifier = new VocabularyClassifier(client);

            classifier.trainLabel("german", "dies ist ein deutscher text text", function(){
                classifier.trainLabel("english", "this is an english text", function(){
                    classifier.classifyText(["german", "english"], "dies ist", function(result, reduced){
                        console.log(JSON.stringify(result, null, 3));
                        console.log(reduced);
                        
                        classifier.removeLabel("german");
                        classifier.removeLabel("english");
                    });
                });
            });

            //End            
        } 
    });
});