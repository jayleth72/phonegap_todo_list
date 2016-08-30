// Wait for PhoneGap to load
var db = null;  // variable to hold reference to SQLite database

window.onload = function() {
    
    document.addEventListener("deviceready", onDeviceReady, false);
    
}    

// PhoneGap is ready
function onDeviceReady() {

    document.addEventListener("backbutton", onBackKeyDown, false);
    
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
    RetrieveTasks ("to-do", "to-do-data-list");
    // Update Completed-List
    RetrieveTasks ("done", "completed-Tasks");

 
    // This is here for testing only
    //DropTable ("listItems");
}

// This function is used to store Tasks in the to-do-list SQLite database
function addTask()
{
    var task = document.getElementById("task").value;
    var description = document.getElementById("description").value;
    var status = document.getElementById("status").value;
    var theLatitude = null;
    var theLongitude = null;
    var img = document.getElementById('camera_image');
    var theImage = null;
    
    if(task == "")
    {
        alert("Please enter name");
        return;
    }

    if(description == "")
    {
        alert("Please enter a description for the task");
        return;
    }
   
   getCurrentTaskPosition () ;
   var thLatitude = document.getElementById("theLatitude").value;
   var theLongitude = document.getElementById("theLongitude").value;

   // User has taken a picture so store image Reference
   if  (img.style.visibility == "visible")
        theImage = document.getElementById('camera_image').src;

    
    // Insert to do taskt in todolistItems table of SQLite
    db.transaction(function(tx) {
        tx.executeSql("INSERT INTO todolistItems (task, description, status, imageRef, latitude, longitude) VALUES (?,?,?,?,?,?)", [task, description, status, theImage, theLatitude, theLongitude], function(tx,res){
            alert("Task Added"); 
            //navigator.notification.alert( 'A Task has been added to your To-Do List', PhoneGapAlert, 'Your To-Do List', 'Ok');
  
        });
    }, function(err){
        alert("An error occured while saving the Task");
        alert("err = " + err);
    });

    // clear the form and fields
    document.forms["addTaskForm"].reset();
    clearPicture();
    document.getElementById("location-list").style.display = "none";
    document.getElementById("theLatitude").value = "";
    document.getElementById("theLongitude").value = "";
   
    // Update To-Do-List
    RetrieveTasks ("to-do", "to-do-data-list");
    // Update Completed-List
    RetrieveTasks ("done", "completed-Tasks");

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
function RetrieveTasks (status, theList) {

        // clear/refresh current list 
        document.getElementById(theList).innerHTML = ""

        // Retrieve only those tasks that are imcomplete - i.e have a status of 'to-do'
        db.transaction(function(tx) {
            tx.executeSql("SELECT * FROM todolistItems WHERE status=?", [status], function(tx,res){
                
                for(var i = 0; i < res.rows.length; i++)
                {
                                        
                    document.getElementById(theList).innerHTML = document.getElementById(theList).innerHTML + "<li><a href='#taskDetails' onclick = \"showTaskDetails(" + res.rows.item(i).id + ");\">" + res.rows.item(i).task+ "</a></li>";
                
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

// This function gets current position of phone and populates two fields on Add Task form
// Coordinates are shown when user presses "Get Location" button
function getCurrentTaskPosition () {

    // onSuccess Callback
    // This method accepts a Position object, which contains the
    // current GPS coordinates
   
    var theLatitude;
    var theLongitude;
    
   

    var onSuccess = function(position) {

              theLatitude = position.coords.latitude;
              theLongitude = position.coords.longitude;

              var formatPosition = convertPositionToDegrees( theLatitude, theLongitude);

              
              document.getElementById("theLatitude").value = formatPosition.lat
             
              document.getElementById("theLongitude").value = formatPosition.long
    };

    // onError Callback receives a PositionError object
    //
    function onError(error) {
        alert('code: '    + error.code    + '\n' +
              'message: ' + error.message + '\n');
    }

     navigator.geolocation.getCurrentPosition(onSuccess, onError);
}

function DropTable (tableName) {

        db.transaction(function(transaction) {
             var executeQuery = "DROP TABLE IF EXISTS " + tableName;
            transaction.executeSql(executeQuery, [],
            function(tx, result) {alert('Table deleted successfully.');},
            function(error){alert('Error occurred while droping the table.');}
            );
        });
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

// This function is run when user presses "Get Location" button
function showCurrentTaskPosition () {

    getCurrentTaskPosition ();
    document.getElementById("location-list").style.display = "block";
   
}

//Create an Button to represent a Task in To-Do lists
function addTaskButton(taskId, taskName, elementId) {
     
  var div = $('<div />', {'data-role' : 'fieldcontain'}),
    btn = $('<input />', {
              type  : 'button',
              value : taskName,
              id    : taskId,
              on    : {
                 click: function() {
                     alert ( this.value );
                 }
              }
          });

    div.append(btn).appendTo( $(elementId) );      
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

     // retrieve and format To-Do list
        // Retrieve only those tasks that are imcomplete - i.e have a status of 'to-do'
        db.transaction(function(tx) {
            tx.executeSql("SELECT (task) FROM todolistItems WHERE status=?", ["to-do"], function(tx,res){
                
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
                                                     alert ("Saving changes to: " + task );
                                                  });
                                                  }, function(err){
                                                        alert("An error occured while saving the Task");
                                                        console.log(err);
                                                
                                                  }, function (){ alert ("Task has been saved");
                                                                    // Update To-Do-List
                                                                    RetrieveTasks ("to-do", "to-do-data-list");
                                                                    // Update Completed-List
                                                                    RetrieveTasks ("done", "completed-Tasks");
                                                  }
                                                );
         }
         else
            alert ("No task Id - cannot save");
        
}


// Save or update changes made in the Task Details Form
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
            
                }, function (){ alert ("Task has been deleted");
                                 // Update To-Do-List
                                RetrieveTasks ("to-do", "to-do-data-list");
                                // Update Completed-List
                                RetrieveTasks ("done", "completed-Tasks");
                               }
            );
         }
         else
            alert ("No task Id - cannot save");
        
}

