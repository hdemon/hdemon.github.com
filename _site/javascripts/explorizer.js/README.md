##Dependency

It requires jQuery v1.2.6 and greater.

##Basic usage
~~~~
...
<div id="wrapper"></div>
...
hdemon.explorizer
    .set({
        'wrapper' : $('#wrapper')
    })
    .add();
~~~~
+ Markup the wrapper element.
+ Call 'set' method from 'hdemon.explorizer' with 'wrapper' arguments.
+ Call 'add' method.

##Methods

###set
####$wrapper
 It is only required parameters to execute explorizer. It limits window form's moving and resizing range. 
####autoScroll
int | false
 Normally in using a browser without auto-scrolling function such as IE, Firefox or Opera. Explorizer activate auto-scroll function with no user intervention.
 If you use other browser and that function is ineffective, pass 'true' to this parameter 
####scrollWeight 
 Speed of auto-scrolling.
####width         
####height        
 Initial size of the window form.

####minWidth      
####minHeight     
####maxWidth      
####maxHeight     
 Size limitation of resizing the window form.

####tBarHeight
 A title bar's height.

###add
 Create a new window form. It requires no parameter.
 
###convert
 Convert an existing block element to the window form that is same as product of 'add' method.

###callback
 Explorizer provides callbacks of each operation.
####manipulated     
 It will be fired when mouse-up after dragging elements to another window-form. And pass the following paramater.
 {
    'baseFormId'    : formId of the source window form that includes dragging elements
    'targetFormId'  : formId of the destination window form    
    'element'       : [ (elementId of manipulated element), ... ]
 }
####selected        
####formRemoved     
####formAdded       
####onElement       
####focusChanged    
####focusKeeped     
####resizingStart   
####resizing        
####resizingEnded   
####};
