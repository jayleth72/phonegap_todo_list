// Wait for PhoneGap to load
var db = null;  // variable to hold reference to SQLite database
var theLatitude;
var theLongitude;

window.onload = function() {
    
    document.addEventListener("deviceready", onDeviceReady, false);
    
}    

// PhoneGap is ready
function onDeviceReady() {

        
    // determine platform or order to make SQlite work on various platforms
    var devicePlatorm = device.platform;
    
    if(devicePlatorm=="Android")
    {
           // create SQLlite database for storing tasks to display in To-Do list
            db = window.sqlitePlugin.openDatabase({name: "to-do-list.db", iosDatabaseLocation:'default'});
    }
    else
    {
            db = window.sqlitePlugin.openDatabase({name: "to-do-list.db", location: 2, createFromLocation: 1}); 
    }

      db.transaction(function(tx) {
            tx.executeSql("CREATE TABLE IF NOT EXISTS todolistItems (id integer primary key autoincrement, task text, description text, status text, imageRef text, latitude text, longitude text)");
            }, function(err){
            alert("An error occurred while initializing the app");
            });         
    
    // Update To-Do-List
    RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
    // Update Completed-List
    RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");

}

// This function is used to store Tasks in the to-do-list SQLite database
function addTask()
{
    var task = document.getElementById("task").value;
    var description = document.getElementById("description").value;
    var status = document.getElementById("status").value;
   
    var img = document.getElementById('camera_image');
    var theImage = null;
   
     
   // User has taken a picture so store image Reference
   if  (img.style.visibility == "visible")
        theImage = document.getElementById('camera_image').src;

    // Insert to do taskt in todolistItems table of SQLite
    db.transaction(function(tx) {
        tx.executeSql("INSERT INTO todolistItems (task, description, status, imageRef, latitude, longitude) VALUES (?,?,?,?,?,?)", [task, description, status, theImage, theLatitude, theLongitude], function(tx,res){
            
            
  
            });
            }, function(err){
                        alert("An error occured while deleting the tasks");
                        console.log(err);
        
            }, function (){ showConfirmTaskAdded() ;
                            // Update To-Do-List
                            RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
                            // Update Completed-List
                            RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");
                            }
             );

    // clear the form and fields
    resetAddTaskForm ();
 
}

// Take optional picture with camera to store with each task
function takePicture() {
    
       navigator.camera.getPicture( function(uri) { 
            var img = document.getElementById('camera_image');
            img.style.visibility = "visible"; 
            img.style.display = "block";
            img.src = uri;
             
            document.getElementById('camera_status').innerHTML = "Success";},
                 function(error) { console.log("Error getting picture: " + error); 
                     document.getElementById('camera_status').innerHTML = "Error getting picture.";}, 
                     { quality: 50, destinationType: navigator.camera.DestinationType.FILE_URI});
      
      // Move image file to permanent storage
      //MoveFile (uri);
                    
 }

// Select picture from phones library
function selectPicture() { 

       navigator.camera.getPicture( function(uri) { 
            var img = document.getElementById('camera_image');
            img.style.visibility = "visible"; 
            img.style.display = "block";
            img.src = uri;
            
            document.getElementById('camera_status').innerHTML = "Success";},
                 function(error) { console.log("Error getting picture: " + error); 
                     document.getElementById('camera_status').innerHTML = "Error getting picture.";}, 
                     { quality: 50, destinationType: navigator.camera.DestinationType.FILE_URI, 
                          sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY});

        // Even though when image is selected from gallery it is in permanent storage, it may
        // deleted by user so move these image files so user always has image associated with task
        // even if they delete photo from their gallery                  
        //MoveFile (uri);                   

 }

 // CLear selected picture
function clearPicture() { 

        var img = document.getElementById('camera_image');img.style.visibility = "hidden"; 
        img.style.display = "none";
        img.src = ""; 
        document.getElementById('camera_status').innerHTML = "Image Cleared";
        newImageURL = null;
 }

// Retrieve Tasks to show in To-Do list
function RetrieveTasks (status, theList, emptyListMessage, listButtons) {

        // Show 'There are no tasks in your To-Do list' and "Completed Task List' until we retrieve some Task records
        document.getElementById(emptyListMessage).style.display = "block";

        // Hide List Buttons until records retrieved
        document.getElementById(listButtons).style.display = "none";

        // clear/refresh current list 
        document.getElementById(theList).innerHTML = ""
                         
        // Retrieve only those tasks that are imcomplete - i.e have a status of 'to-do'
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM todolistItems WHERE status=?", [status], function(tx,res){
                
                // Hide No Tasks message and show buttons
                if (res.rows.length > 0)
                {
                    document.getElementById(emptyListMessage).style.display = "none";
                    document.getElementById(listButtons).style.display = "block";    
                }
                    

                for(var i = 0; i < res.rows.length; i++)
                {
                    document.getElementById(theList).innerHTML = document.getElementById(theList).innerHTML + "<li><a href='#taskDetails' onclick = \"showTaskDetails(" + res.rows.item(i).id + ");\">" + res.rows.item(i).task + "</a></li>";
                   
                }
            });
        }, function(err){
            alert("An error occured while retrieving the to-do list");
            console.log(err);
        },  function(){ refreshList(theList);
        });
 
 }   

// Refresh list after adding a task
 function refreshList(theList){

     $("#" + theList).listview("refresh");
     
 }


// move file to permanent storage
function MoveFile (imagePath) {
    //Grab the file name of the photo in the temporary directory
    var currentName = imagePath.replace(/^.*[\\\/]/, '');
    
    //Create a new name for the photo
    var d = new Date(),
        n = d.getTime(),
        newImageFileName = n + ".jpg";
    
    //Move the file to permanent storage
    $cordovaFile.moveFile(cordova.file.tempDirectory, currentName, cordova.file.dataDirectory, newFileName).then(function(success){
    
    // store new path, to image that is now in permanent storage, so it can be used to be stored in to-do-list.db
    newImageURL = success.nativeURL;
           
    }, function(error){
        //an error occured
        alert("an error occured while moving file");
    });

}  

/**
 * Convert longitude/latitude decimal degrees to degrees and minutes
 * DDD to DMS, no seconds
 * @param lat, latitude degrees decimal
 * @param lng, longitude degrees decimal
 */
        
function convertPositionToDegrees( lat, lng ) {
 
        var convertLat = Math.abs(lat);
        var LatDeg = Math.floor(convertLat);
        var LatMin = (Math.floor((convertLat - LatDeg) * 60));
        var LatCardinal = ((lat > 0) ? "N" : "S");
         
        var convertLng = Math.abs(lng);
        var LngDeg = Math.floor(convertLng);
        var LngMin = (Math.floor((convertLng - LngDeg) * 60));
        var LngCardinal = ((lng > 0) ? "E" : "w");

        var latitudeToDisplay = LatDeg + "°" + LatCardinal + " " + LatMin + "'";
        var longitudeToDisplay = LngDeg + "°" + LngCardinal + " " + LngMin + "'";

        return {lat: latitudeToDisplay, long: longitudeToDisplay };
} 


// Opens Task Details form with relevant task details
function showTaskDetails(taskId) {
        
    // Retrieve Task Details for Task selected from Task list
  
    // check that taskId has a value and then retrieve Task Details for that Task Id
    if (taskId)
    {
        
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM todolistItems WHERE id=?", [taskId], function(tx,res){
            
                for(var i = 0; i < res.rows.length; i++)
                {
                     
                     document.getElementById("taskDetails-id").value = res.rows.item(i).id;
                     document.getElementById("taskDetails-task").value = res.rows.item(i).task;
                     document.getElementById("taskDetails-description").value = res.rows.item(i).description;
                     document.getElementById("taskDetails-status").value = res.rows.item(i).status;
                     $("#taskDetails-status").slider("refresh");
                     document.getElementById("taskDetails-theLatitude").value= res.rows.item(i).latitude;
                     document.getElementById("taskDetails-theLongitude").value = res.rows.item(i).longitude;
                     
                     // show position 
                     document.getElementById("taskDetails-location-list").style.display = "block";

                     var img = document.getElementById("taskDetails-camera_image");
                     // if user took a picture of image then show image
                     var imageRef = res.rows.item(i).imageRef;
                     
                     if (imageRef)
                     {
                         img.style.visibility = "visible"; 
                         img.style.display = "block";
                         img.src = imageRef;
                     }
                     else
                     {
                         img.style.visibility = "hidden"; 
                         img.style.display = "none";
                         img.src = "";
                     }
                     
                }
            });
        }, function(err){
            alert("An error occured while adding the task");
            console.log(err);
        });
        
    }
    else
    {
        alert ("Could not retrieve Task Id for the Task.  Unable to retrieve Task Details")
    }  
    
}


function sendList(toDoList) {

        cordova.plugins.email.isAvailable(
            function (isAvailable) {
            // alert('Service is not available') unless isAvailable; 
                if(!isAvailable)
                {
                    alert("Your email account has not been set up on this phone.  Unable to send list");
                    return; 
                }
                                     
             }
        );

        // check we have an email address
        var emailAddress = document.getElementById("email").value;

        if (!validEmail)
            return;     
  
        // check if list is empty
        if (toDoList.length==0)
        {
            alert ("There are no tasks in your to-do list");
            return;
        }
       
        var formatList = "<h1>Your List of To-do Tasks</h1>";
        
        for(var i = 0; i < toDoList.length; i++)
        {
            formatList += "<big><b>" + (i+1) + ". " + toDoList[i] + "</b><big><br>";           
        }

        cordova.plugins.email.open({
            to:      emailAddress,
            subject: 'Your To-Do List',
            body:    formatList,
            isHtml:  true
        },
        function(){clearEmailAddress();});

        cordova.plugins.email.open(properties, function () {
            console.log('email view dismissed');
        }, this);

}

function clearEmailAddress () {

        document.getElementById("email").value = "";
}

// Function that validates email address through a regular expression.
function validEmail(emailAddress) {

        var filter = /^[\w\-\.\+]+\@[a-zA-Z0-9\.\-]+\.[a-zA-z0-9]{2,4}$/;

        if(emailAddress == "" || filter.test(emailAddress))
        {
            alert("Please enter an email address");
            return false;
        }
        else 
        {
            return true;
        }
}

//This function retrieves to-do list tasks from SQLite db and passes them to the SendList function
function toDoListSender(){

     var toDoListArr = [];

     // determine which list we want to send by getting value checked of List Type radio buttons
     var listToRetrieve;
     
     if (document.getElementById("to-do-list-radio").checked)
     {
            listToRetrieve = "to-do";
     }
     else
     {
            listToRetrieve = "done";
     }

     // retrieve and format To-Do list
        // Retrieve only those tasks that are imcomplete - i.e have a status of 'to-do'
        db.transaction(function(tx) {
            tx.executeSql("SELECT (task) FROM todolistItems WHERE status=?", [listToRetrieve], function(tx,res){
                
                for(var i = 0; i < res.rows.length; i++)
                {
                    toDoListArr.push(res.rows.item(i).task);                 
                    
                }
            });
        }, function(err){
            alert("An error occured while retrieving the to-do list");
            console.log(err);
        },  function(){ sendList(toDoListArr);
        });
       
}

// Pick one contact so we can get their email 
function getEmailContact (){

        window.plugins.ContactPicker.chooseContact(function(contactInfo) {
                   
            if (contactInfo.phones.length > 0)
                document.getElementById("email").value = contactInfo.email;
            else
                alert("You do not have any contacts stored in your phone");    
        });
}

// Save or update changes made in the Task Details Form
function saveTask (){

        var taskId = document.getElementById("taskDetails-id").value;
        var task = document.getElementById("taskDetails-task").value;
        var description = document.getElementById("taskDetails-description").value ;
        var status = document.getElementById("taskDetails-status").value ;
                    
        var latitude =  document.getElementById("taskDetails-theLatitude").value;
        var longitude =  document.getElementById("taskDetails-theLongitude").value ;
        var img = document.getElementById("taskDetails-camera_image").src;

        // TODO confirm save or not
        // Make sure we have a taskId value
        if (taskId)
        {
            db.transaction(function(tx) {
                tx.executeSql("UPDATE todolistItems SET task = ?, description = ?, status = ?, "
                                 + "imageRef = ?, latitude = ?, longitude = ?  WHERE id =?", [task, description, status, img, latitude, longitude, taskId],
                                  function(tx,res){
                                                     
                                                  });
                                                  }, function(err){
                                                        alert("An error occured while saving the Task");
                                                        console.log(err);
                                                
                                                  }, function (){ showConfirmTaskSave();
                                                                    // Update To-Do-List
                                                                     RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
                                                                    // Update Completed-List
                                                                    RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");
                                                  }
                                                );
         }
         else
            alert ("No task Id - cannot save");
        
}


// Delete task from the List
function deleteTask (){

        var taskId = document.getElementById("taskDetails-id").value;
        var task = document.getElementById("taskDetails-task").value;

        // TODO confirm delete or not
        // Make sure we have a taskId value
        if (taskId)
        {
            db.transaction(function(tx) {
                tx.executeSql("DELETE FROM todolistItems WHERE id =?", [taskId], function(tx,res){
                    
                    // delete task
                });
                }, function(err){
                    alert("An error occured while deleting the task");
                    console.log(err);
            
                }, function (){ showConfirmTaskDeleted();
                                // Update To-Do-List
                                 RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
                                // Update Completed-List
                                RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");
                               }
            );
         }
         else
            alert ("No task Id - cannot save");
        
}

// Delete all tasks from to-do list
function deleteAllToDoTasks(){

        db.transaction(function(tx) {
            tx.executeSql("DELETE FROM todolistItems WHERE status =?", ["to-do"], function(tx,res){
                
                // deleting tasks
            });
            }, function(err){
                alert("An error occured while deleting the tasks");
                console.log(err);
        
            }, function (){ 
                            // Update To-Do-List
                            RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
                            // Update Completed-List
                            RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");
                            }
             );
        
                
}

// Delete all tasks from completed list
function deleteAllCompletedTasks() {

    db.transaction(function(tx) {
            tx.executeSql("DELETE FROM todolistItems WHERE status =?", ["done"], function(tx,res){
                
                // deleting tasks
            });
            }, function(err){
                alert("An error occured while deleting the tasks");
                console.log(err);
        
            }, function (){ 
                            // Update To-Do-List
                            RetrieveTasks ("to-do", "to-do-data-list", "to-do-list-empty", "to-do-list-buttons");
                            // Update Completed-List
                            RetrieveTasks ("done", "completed-Tasks", "completed-list-empty", "completed-list-buttons");
                            }
             );
    
}

// This sets the value of the Radio Buttom - either To-Do List or Completed List - in Send List Form depending where we come from 
// If come from To-Do List then set to send To-Do list items, and vice versa
function setListTypeRadioButton(listType){

    if (listType == "todo")
    {  
         $("#to-do-list-radio[type='radio']").prop("checked",true).checkboxradio("refresh");
         $("#completed-list-radio[type='radio']").prop("checked",false).checkboxradio("refresh");
    }
          
    else
    {  
        $("#completed-list-radio[type='radio']").prop("checked",true).checkboxradio("refresh");
        $("#to-do-list-radio[type='radio']").prop("checked",false).checkboxradio("refresh");
    } 

}

function  GetGeoLocation () {
  var options =  { maximumAge: 10000, timeout: 10000, enableHighAccuracy: true };
  navigator.geolocation.getCurrentPosition(ShowPosition, ShowError, options);
}

function ShowPosition(position) {
  

    var pos = convertPositionToDegrees( position.coords.latitude, position.coords.longitude );

    theLatitude = pos.lat;
    theLongitude = pos.long;

    document.getElementById("theLatitude").value = theLatitude;
    document.getElementById("theLongitude").value = theLongitude; 
}


function ShowError(error) {
   alert("Errorcode: "    + error.code    +
         "Errormessage: "+ error.message );
}


// This function is run when user presses "Get Location" button
function showCurrentTaskPosition () {

    //getCurrentTaskPosition ();
    GetGeoLocation ();
    document.getElementById("location-list").style.display = "block";
   
}

// Reset all fields on Add Task Form
function resetAddTaskForm (){

    document.getElementById("task").value = "";
    document.getElementById("description").value = "";
    document.getElementById("status").value = "to-do"; 

    document.getElementById("theLatitude").value = "";
    document.getElementById("theLongitude").value = "";
    clearPicture();   
}

// For deleting tasks
function onConfirmDelete(button) {
    
    // Delete task
    if (button==1)
        deleteTask ();
}

// Show a custom confirmation dialog for deleting tasks
function showConfirmDelete() {
    navigator.notification.confirm(
        'Are you sure you want to delete the task',  // message
        onConfirmDelete,              // callback to invoke with index of button pressed
        'Confirm Delete',            // title
        'Yes,No'          // buttonLabels
    );
}

function onConfirmAdd(button) {
  
   switch(button) {
    case 1:
        addTask();
        break;
    case 2:
        //task not added refresh
        resetAddTaskForm ();
        break;
    default:
        // do nothing
    }
 
}

// Show a custom confirmation dialog for adding tasks
//
function showConfirmAdd() {
    navigator.notification.confirm(
        'Do you wish to add this Task to your To-Do List',  // message
        onConfirmAdd,              // callback to invoke with index of button pressed
        'Task Add',            // title
        'Yes,No'          // buttonLabels
    );
}

function addingTaskToDatabase () {

    // validate entry

    var task = document.getElementById("task").value;
    var description = document.getElementById("description").value;
    var status = document.getElementById("status").value;
   
    var img = document.getElementById('camera_image');
    var theImage = null;
    
    if(task == "")
    {
        alert("Please enter name");
        document.getElementById("task").focus();
        return;
    }

    if(description == "")
    {
        alert("Please enter a description for the task");
        document.getElementById("description").focus();
        return;
    }

    showConfirmAdd();
}


// For deleting To-DO task lists
function onConfirmDeleteToDoList(button) {
    
    // Delete task list
    if (button==1)
        deleteAllToDoTasks();
}

// Show a custom confirmation dialog for deleting tasks
function showConfirmDeleteToDoTasks() {
    navigator.notification.confirm(
        'Are you sure you want to delete the To-Do task list',  // message
        onConfirmDeleteToDoList,              // callback to invoke with index of button pressed
        'Confirm Delete',            // title
        'Yes,No'          // buttonLabels
    );
}

// For deleting Completed task lists
function onConfirmDeleteCompletedList(button) {
    
    // Delete task list
    if (button==1)
        deleteAllCompletedTasks();
}

// Show a custom confirmation dialog for deleting tasks
function showConfirmDeleteCompletedTasks() {
    navigator.notification.confirm(
        'Are you sure you want to delete the completed task list',  // message
        onConfirmDeleteCompletedList,              // callback to invoke with index of button pressed
        'Confirm Delete',            // title
        'Yes,No'          // buttonLabels
    );
}

// For confirming task adds
function onConfirmTaskAdded(button) {
}

// Show a custom confirmation dialog for confirming adds
function showConfirmTaskAdded() {
    navigator.notification.confirm(
        'A Task has been added to your To-Do list',  // message
        onConfirmTaskAdded,              // callback to invoke with index of button pressed
        'Task Saved',            // title
        'Ok'          // buttonLabels
    );
}

// For confirming task saves
function onConfirmTaskSave(button) {
}

// Show a custom confirmation dialog for confirming save
function showConfirmTaskSave() {
    navigator.notification.confirm(
        'Any changes to your Task have been saved',  // message
        onConfirmTaskSave,              // callback to invoke with index of button pressed
        'Task Saved',            // title
        'Ok'          // buttonLabels
    );
}

// For confirming task deletes
function onConfirmTaskSave(button) {
}

// Show a custom confirmation dialog for confirming deletes
function showConfirmTaskSave() {
    navigator.notification.confirm(
        'Any changes to your Task have been saved',  // message
        onConfirmTaskSave,              // callback to invoke with index of button pressed
        'Task Saved',            // title
        'Ok'          // buttonLabels
    );
}

// For confirming task deleted
function onConfirmTaskDeleted(button) {
}

// Show a custom confirmation dialog for confirming deletes
function showConfirmTaskDeleted() {
    navigator.notification.confirm(
        'Your Task has been deleted',  // message
        onConfirmTaskDeleted,              // callback to invoke with index of button pressed
        'Task Deleted',            // title
        'Ok'          // buttonLabels
    );
}

