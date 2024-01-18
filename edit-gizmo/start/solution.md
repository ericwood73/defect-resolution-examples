# Reproduction Example Solution
This is the solution for the reproduction example.  It is highy recommended to review the ![exercise](../start/README.md) before viewing the solution.  

## Steps to reproduce
To reproduce the issue:
1.  Hover over the boost UI of a remote user
1.  Zoom the camera so that the pointer is no longer over the Boost UI
1.  Now move the pointer, the room background will be replaced with the boost UI

## Root cause
The root cause of this issue is line 190 in `boost.js`.  The issue is that the mesh under pointer is not the the boostUI, so the `setState` function on line 84 replaces the texture for the mesh under pointer which is the background.

## Implementation
The failed assumption in this case is that the mesh passed to `setState` will always be a Boost UI instance.  The question we have to ask ourselves is: is that assumption valid?  If it isn't valid, then we would be saying that it is expected that sometimes the value would not be a Boost UI, and the fix would be a simple check.  In this case, the assumption is valid, so we need to determine and correct the issue that is passing the incorrect value, versus checking the value in the function.  We need to dig deeper to understand how this value could be anything other than a Boost UI mesh.  

We find this is happening becasue the pointer out event fires twice if the pointer leaves the mesh becasue a camera view change moved the mouse out from underneath the pointer.  The first event is fired just before the pointer leaves the mesh as expected and the mesh under pointer is the mesh.  The second event fires when the user moves the pointer..  Since this is in the BabylonJS code, we created a [BabylonJS Playground](https://playground.babylonjs.com/#5EK9SZ#19) that reproduced the behavior.  And reported an [issue](https://forum.babylonjs.com/t/triggering-pointer-out-actions-when-camera-change-causes-pointer-to-exit-mesh/39061/1), which was ultimately corrected in BabylonJS 5.53.  Generally BJS changes to fix issues are merged pretty quickly and BabylonJS releases happen fairly often, but if an issue is critical, waiting for a release may not be an option.  In addition, upgrading to the latest release may not be feasible as upgrading major releases of a core dependency can introduce a ton of risk.  Therefore in this case a short term workaround was needed.  The short term workaround was to ensure that the mesh passed to `setState` is a Boost UI mesh.  This was done by setting an `isBoostUI` property on the mesh and checking that value in `setState`.  Once the version of BJS is updated to the release containg the fix, this code can be removed.  

Note that the check was a valid workaround once we understood that the behavior of the library was invalid, but adding a check without determining that information would mask an error that might mainfest itself in other ways, now or in the future.   Understanding failed assumptions is key to creating robust solutions versus a fix that addressed a symptom rather than the disease.

