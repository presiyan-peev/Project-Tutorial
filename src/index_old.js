(function () {
    
    "use strict";

    var taskGuids = [];
    var sigma = 0; //the sigma for the project
    var sumVariances = 0; //sum of Variances of critical tasks

    // The initialize function must be run each time a new page is loaded.
    Office.initialize = function (reason) {
        $(document).ready(function () {
            
            // After the DOM is loaded, add-in-specific code can run.
          //  app.initialize();
            $('#get-info').click(getTaskInfo);
        });
    };

    // Get the maximum task index, and then get the task GUIDs.
    function getTaskInfo() {
        getMaxTaskIndex().then(
            function (data) {
                getTaskGuids(data).then(showSigma);
            }
        );
    }

    // Get the maximum index of the tasks for the current project.
    function getMaxTaskIndex() {
        var defer = $.Deferred();
        Office.context.document.getMaxTaskIndexAsync(
            function (result) {
                if (result.status === Office.AsyncResultStatus.Failed) {
                    onError(result.error);
                }
                else {
                    defer.resolve(result.value);
                }
            }
        );
        return defer.promise();
    }

    // Get each task GUID, and then display the GUIDs in the add-in.
    function getTaskGuids(maxTaskIndex) {
        var defer = $.Deferred();
        for (var i = 0; i <= maxTaskIndex; i++) {
            getTaskGuid(i);
        }
        //showSigma();
        return defer.promise();
        function getTaskGuid(index) {
            Office.context.document.getTaskByIndexAsync(index,
                function (result) {
                    if (result.status === Office.AsyncResultStatus.Succeeded) {
                        taskGuids.push(result.value);
                        if (index == maxTaskIndex) {
                            defer.resolve();
                        }
                        totalTaskscounterInCall++;
                        getTaskFields(result.value);
                    }
                    else {
                        onError(result.error);
                    }
                }
            );
        }
    }
    
    /**
     * 
     * OT tyka po4wam az
     * 
     */

    var nonCritCounter = 0;
    var summaryCounter = 0;
    var critTaskCountInCallback = 0;
    var totalTaskscounterInCall = 0;
    var totalTaskscounterInCallback = 0;

    // Get the specified fields for the selected task.
    async function getTaskFields(taskGuid) {
        var output = '';
        var targetFields = [Office.ProjectTaskFields.Critical, Office.ProjectTaskFields.Summary, Office.ProjectTaskFields.ScheduledDuration, Office.ProjectTaskFields.Duration1, Office.ProjectTaskFields.Duration3];
        
        // fieldValues[0] = Office.ProjectTaskFields.ScheduledDuration;
        // fieldValues[1] = Office.ProjectTaskFields.Duration1; (Optimistic Duration )
        // fieldValues[2] = Office.ProjectTaskFields.Duration3; (Pessimistic Duration )
        var fieldValues = [];
        var index = 0;
        getField();

        // Get each field, and then display the field values in the add-in.
        function getField() {
            if (index == targetFields.length) {
                for (var i = 0; i < fieldValues.length; i++) {
                    output += fieldValues[i] + '<br />';
                }
                addVariances(fieldValues);// put it as a resolve 

                /**
                 * TODO add return defer.success statement
                 */
                //return defer.promise();
            }

            // Get the field value. If the call is successful, then get the next field.
            else {
                Office.context.document.getTaskFieldAsync(
                    taskGuid,
                    targetFields[index],
                    function (result) {
                        if (result.status === Office.AsyncResultStatus.Succeeded) {
                            
                            // just a counter da si broq
                            if(index == 1 )
                                totalTaskscounterInCallback++;



                            //if Task is not on Critical path, do nothing and exit function 
                            if(index == 0 && !result.value.fieldValue) {
                                nonCritCounter++;     
                            } else {
                                //if Task is on Critical path and is a Summary task, do nothing and exit function
                                if (index == 1 && result.value.fieldValue){
                                    summaryCounter++;
                                } else { 

                                    //if task is on Critical path and is a subtask, 
                                    //input all the field values into fieldValues[] except for the Critical (it has index=0) and for the Summary (it has index=1)

                                    if(index > 1) {
                                        critTaskCountInCallback++;
                                        // Response from Server is string like "5d".
                                        // We need to extract only the number from:
                                        var resultedString = result.value.fieldValue;
                                        fieldValues[index - 1] = resultedString.match(/\d+/)[0];
                                    }
                                    getField(index++);
                                }                                
                            }
                        }
                        else {
                            onError(result.error);
                            console.log("error");
                        }
                    }
                );
            }
        }
    }

    var critTaskCountInAddVar = 0;
    var sigmaCount = 0;
    function addVariances(fieldValues){
        sumVariances += ((fieldValues[2] - fieldValues[1])*(fieldValues[2] - fieldValues[1]))/36;
        critTaskCountInAddVar++;
        console.log("kyp");
    }


    function showSigma(){
        sigmaCount++;
        sigma = Math.sqrt(sumVariances);        
        $('#message').html("Sigma is " + sigma + " days");
                
  //      $('#message2').html("out of total " + critTaskCount + " critical tasks");
        $('#message3').html(
            "<br> critTaskCountInAddVar=" + critTaskCountInAddVar + 
            "<br> critTaskCountInCallback="+ critTaskCountInCallback + 
            "<br> summaryCounter=" + summaryCounter + 
            "<br> nonCritCounter=" + nonCritCounter +
            "<br> totalTaskscounterInCall=" + totalTaskscounterInCall +
            "<br> totalTaskscounterInCallback=" + totalTaskscounterInCallback
        );
        sumVariances = 0;
        critTaskCountInAddVar = 0;
        critTaskCountInCallback = 0;
        nonCritCounter = 0;
        summaryCounter = 0;
        totalTaskscounterInCall = 0;
        totalTaskscounterInCallback = 0;
        
    }
    
    
    
    
    
    /**
     * 
     * dotuka bqh
     * 
     */
    
    function onError(error) {
        console.log(error.name + ' ' + error.code + ': ' + error.message);
    }

})();
