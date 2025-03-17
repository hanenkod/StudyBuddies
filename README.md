Here’s a summary of the tasks completed for setting up Express.js and MySQL using Docker and Node.js:

Setting Up Express.js and MySQL for a Database-Driven App

1. Project Setup in VS Code with Github Repositories
	•	Opened a New Project: Created a new folder and linked our Github Repositories to VS code.
	•	Trusted the Workspace: Approved the security prompt to trust the authors, allowing all project files to be visible.

2. Installing Dependencies
	•	Node.js Packages: Opened a new terminal in VS Code and ran:

npm install

This installed all necessary Node.js dependencies specified in the package.json file.

3. Running Docker Containers
	•	Starting Docker Services: Ran the following command to start the Docker containers: (Make sure Docker it’s open)

docker-compose up

This process pulled the necessary Docker images and initialised both the Node.js server and the MySQL database. It’s normal to see the server restart multiple times during this step.

4. Verifying Server and Database Connection
	•	Checked Server and Database:
	•	Node.js Server: Visited http://127.0.0.1:3000
	•	phpMyAdmin Interface: Accessed http://127.0.0.1:8081 to manage the MySQL database.

5. Database Connectivity
	•	Configured Database Connection:
	•	Utilized the dotenv package to load environment variables from the .env file.
	•	Connected to MySQL using the mysql2 package.
	•	Database Query Function: Createxd an utility function to execute SQL queries:


6. Creating and Accessing Test Tables
	•	Imported SQL File:
	•	Located the sb2-test.sql file in the provided scaffolding files.
	•	Accessed phpMyAdmin, navigated to the sd2-test database, and ran the SQL file to populate test data.
	•	Viewed Data via Express: Verified the data by visiting:
http://127.0.0.1:3000/db_test

7. Troubleshooting Docker Issues
	•	Common Issues Handled:
	•	Avoided Running Docker from OneDrive: Prevented permission conflicts.
	•	Skipped Extra Software Installation: Ensured stability on university computers.
	•	Mac-Specific Fix: Removed SQLite3 if Docker Compose failed:

npm remove sqlite3


	•	Windows Users: Restarted the system post-installation for Docker to apply changes effectively.

This workflow demonstrates how to set up a full-stack environment using Docker for containerization, Node.js for server-side logic, and MySQL for database management, all orchestrated within a development environment like VS Code.


Commands used for GITHUB Upload of files.

git status (Checks if there are files that are ready to be staged)
git add . (Adds all the files to the repository at once)
git commit -m 'Insert a friendly message' (Commits the files)
git push (Checks that the files have been staged and changes applied to GITHUB repository)
git pull (This command allows others user's of the repository to get the files on their machine)

