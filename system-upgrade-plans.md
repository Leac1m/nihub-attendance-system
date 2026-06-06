# System update plan
## Here is a list of updates
- A reverse proxy container should be set up for the server. A network failure is a possible and critical bug that I want to log.
- Design a logging system for the application.
- We have a web registration form. I want to extend the web functionality:
   * Once a user verifies their email, they should be able to log in to the web interface with the matric number and password to retrieve their details and QR codes.
   * Admins should now be able to manage attendees' data via a dashboard.
- The mobile app will require some changes:
   * The mobile app auth flow should be seamless, either by setting up auto re-auth logic or by routing the user to login when the app is opened and the JWT token is invalid.
   * Admins should be able to manually check in attendees by selecting them from a clickable list.
   * Staff now want to check in and out attendees (this should reflect in the data structure).
- Server and database refactor:
   * Fix naming: Events/Programs -> Departments.
   * Separate code logic into modules.
   * Fix data structure naming and create a data migration script.
   * The description field in the departments table is no longer needed; fix this across the UI.
- Make branding consistent across the app.
