# Edit Gizmo Issue Solution
This is the solution for the reproduction example.  It is highy recommended to review the ![exercise](../start/README.md) before viewing the solution.  

## Root cause
The root cause of this issue is a conncurrent modification of the callbacks array when firing an event that has a `subscribeOnce` subscription because the `subscribeOnce` implmentation removes the callback during execution.  As a result, the array size changed during iteration and the edit-gizmo subscription is skipped.

## Implementation
The failed assumption in this case is that it is safe to remove the subscription in the subscription callback.  This assumption is invalid, so we must devise a strategy for removing the subscription after all callbacks for an event have been executed.

We introduced a subscription details by event id object.  This allows us to capture the requirement to remove the subscription one the callback is executed and to defer the removal in the fire function until after all callbacks have been executed.  In order to avoid breaking changes to the subscribe function, we introduced a new `subscribeAdvanced` function and called it from subscribe with default options.  We also change the implmentation of `subscribeOnce` to delegate to `subscribeAdvanced` to avoid having to change all the places `subscribeOnce` was used.

