import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def init_firebase():
    """Initializes the Firebase Admin SDK. Returns the Firestore client."""
    if not firebase_admin._apps:
        # Use Application Default Credentials
        # If running locally without GOOGLE_APPLICATION_CREDENTIALS, it will try to find it.
        # For a seamless demo, we should ensure the user has run `gcloud auth application-default login`
        cred = credentials.ApplicationDefault()
        
        project_id = os.getenv("GOOGLE_CLOUD_PROJECT", "momentlab-demo")
        firebase_admin.initialize_app(cred, {
            'projectId': project_id,
        })
    return firestore.client()

# A module-level db client can be obtained by calling get_db()
def get_db():
    return init_firebase()
