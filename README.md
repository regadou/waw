
   Documentation for WAW (Web Admin Widgets) application

The goal of this application is threefold:
- Manage the files of your web site directly in the browser
- Manage the databases of your web site directly in the browser
- Create multiplatform applications without knowing anything about programming

Currently the first 2 goals are partially achieved
- You can browse your files and view them but you cannot add, modify or delete files with this interface
- You can browse your databases, view, add, modify and delete records but you cannot change the tables structures

You cannot yet create aplications with this interface other than uploading files with another interface

To install, just copy the files into a directory on your web site.
You will need to modify basepath and mimetypesFile values in the appropriate waw.* file to suit your needs
This version supports 4 platforms: aspx, jsp, php and TeaJS(v8cgi)
When you launch the application, it should automatically detect on which system you are
If the application detects that several supported platforms are installed, it will ask you which one you want to use
You can also force a specific platform by editing the res/config.json file by adding a current value after the supported one under system object
For JSP platforms, the WEB-INF/lib directory gives you the jars needed for the application to run
For ASPX platforms, the bin directory gives you the dll needed for the application to run
For SJS(TeaJS/v8cgi) platforms, you need the apache module configured to send sjs extensions to the teajs handler
For PHP platforms, well ... I hate to say this but there is nothing special to do

But for all platforms, you might need to change database credentials in the res/config.json file
You might also need to add a "host" property if you database server is not on the same host as your web server
If you want to use SQLite, you will have to set the folder property and put all your sqlite databases there

To see know bugs and todo list, view the config tree under system folder

