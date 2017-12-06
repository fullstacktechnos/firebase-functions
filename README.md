# firebase-functions
Firebase functions for testing purpose

Steps to build and deploy :

1) Create your firebase project from https://console.firebase.google.com

2) Update config.json file present in root directory of this project with the keys from your firebase project.

3) Update your firebase project id in .firebaserc

4) Go inside functions folder and Run "npm install"

5) Install firebase CLI (sudo npm install -g firebase-tools)

6) In command line from the root of this project type

$firebase login

It will open a browser and ask you to enter the google credentials and permissions. Give the personal gmail account using which you have created the firebase project earlier.

7) Now list the projects that are associated with the account by using the following command

$firebase list

8)Use the newly created project to push the code

$firebase use "project id"

9) Deploy your code

$firebase deploy




