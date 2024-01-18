# Pointer Capture Issue Example Start
In this exercise, we have introduced a defect with unknown reproduction steps.  In fact, the example is currently not configured to produce the defect.  The assignment is to determine how to correct the defect, ,eaning you will first need to figure out how to reproduce it. The solution is in the `final` folder.

## Running the example
To run the example:
1.  Run `npm run dev`
1.  Open the browser to the address provided when you started the client under "local" (likely `localhost:5173`)
1.  You can hover over the HTML elements to interact with them (this is what pointer events capture behavior allows).

## Defect Observations
The following are the observations that have been made about this defect
1.  Users of the extension have observed that the are getting an error that pointerCaptureBehavior is undefined on line 121 of `pointer-events-capture-behavior.ts`.
1.  The call to scene.pick on line 86 in the same file contains a predicate to intended to only pick meshes that have a pointer event capture behavior (indicated by havng an entry in the `meshToBehaviorMap`).
1.  The developer who reported the issue is using the HtmlMesh in their metaverse app which allows users to add instances of HtmlMesh to a space.  They reproted that any instances of HtmlMesh added by the user worked, but any instances hydrated from the server (e.g. in other user's instances or on loading the space after initial creation) expereinced the issue when hovered.