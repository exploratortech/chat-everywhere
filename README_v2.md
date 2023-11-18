# Chat Everywhere by [Explorator Labs](https://exploratorlabs.com) v2 (Beta)

v2 consist a new interface and a new underlying technology stack. It is currently in beta and is not recommended for production use.

## Workflow
1. User send a message
1. Message is being added to a thread
1. Queue the thread in a thread-runner (serverless function which has a 5 mins timeout)
1. Thread-runner picks up the thread
  - Mark the thread as runInProcess (which will prevent other thread-runner to pick up the same thread, and indicate the front-end to keep polling)
  - Cancel any previous runs of the same thread
  - Create a Run
  - Monitor for any tool calling from the thread, and trigger the tool
  - Once the tool is finished, mark the thread's runInProcess as false (which also disable polling from the front-end)
1. Cycle repeats