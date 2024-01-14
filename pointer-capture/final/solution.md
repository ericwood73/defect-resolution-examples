# Reproduction Example Solution
This is the solution for the pointer capture issue example.  It is highy recommended to review the ![exercise](../start/README.md) before viewing the solution.  

## Steps to reproduce
To reproduce the issue:
1.  The issue occurs when the last mesh in the scene does not have a pointer capture behavior (is not an HtmlMesh)
1.  To reproduce, simply add another mesh to the scene after the last htmlmesh in example.js.  You can copy and paste the box from earlier in the file, e.g.

## Root cause
The root cause of this issue that the predicate is called for every mesh in the scene, so if the last mesh(es)does not have a pointer capture behavior then the pointer capture behavior will be undefined when we call `capturePointerEvents`.  Once you realize that this is happening; however, you should also recognize that the last mesh is always capturing pointer events and yet the extension behaves correctly when hovering a mesh that is not the last mesh.  The reason is that pointer capture events are enabled for all HtmlMesh instances by default and once we disable pointer events on the canvas, the HTML content will automatically receive pointer events when hovered.  I would not expect you to know there is anything wrong with this behavior, but it is in fact an issue when you have overlapping HtmlMesh instances.  In the final, I therefore defaulted pointer-events to none in `html-mesh.ts` line 260.  I hope though, you were curious about why it worked even though the wrong instance was capturing pointer events.

## Implementation
The failed assumption in this case was that the predicate would only be called for a single mesh when the mesh was picked.  The assumption is invalid, becasue the scene.pick function needs to check all meshes to see if one might be closer.  The correct resolution, therfore is to simply check that a mesh has the behavior and then to call the `capturePointerEvents` function on the behavior retrieved using the picked mesh as a key.
