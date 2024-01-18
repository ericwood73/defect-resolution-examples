# Edit Gizmo Issue Example Start
In this exercise, we have introduced a defect with known reproduction steps.  The assignment is to determine the root cause.  If you would lilke you can also correct the issue. The solution is in the `final` folder.

## App Decription
This is a social app where users can get together and have avatars with voice and video chat as well as share content.  At this stage, the functionality that has been implemented is limited to:
* multiple users having avatars that can be moved around the room.
* boost feature is intended to allow users to express appreciation for the actions or words of another user.  The boost feature is activated when a user clicks on another users boost UI, which looks like a rocket.  The boost feature has a cooldown before it can be used again for that user. 
* users can switch between two rooms
* users can share images from Flickr in the rooms.  Click the edit room icon (green pencil) to enable edit mode.  The share image button appears.  Click the button to share an image.  Enter a Flickr URL.  The image appears with an edit gizmo (blue resize handles).  The image can be dragged around the room and resized using the handles.  The changes will be visible by other users in the room and will persist until server restart.

## Running the example
To run the example:
1.  Cd to the server directory
1.  Run `npm start`
1.  Cd to the client directory
1.  Run `npm run dev`
1.  Open the browser to the address provided when you started the client under "local" (likely `localhost:5173`)

## Defect 
The issue is a console error is occuring and images can not be edited in the second room.  To reproduce the issue:
1. Open the app and enter initials
1. Share an image in the first room (can skip if image already shared) 
1. Move the image and resize it
1. Swtich to Room 2
1. Share an image (can skip if image already shared)
1. Note the error when the app tries to make the image editable
1. If not sharing a new image, enter edit mode and select the image (entering edit mode may be enough to trigger if the image is the only image or last image edited in the room)
1. Note console error, lack of edit gizmo, and inability to move or resize.