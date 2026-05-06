# GetLoveYVR Public Site

## Firebase

The public homepage poll reads and writes Cloud Firestore data from the `event_votes` collection.

- Firestore rules live in `firestore.rules`.
- Sign in to Firebase CLI with `npx firebase-tools login` if this machine is not authenticated yet.
- Deploy them with `npm run firestore:deploy:rules`.
